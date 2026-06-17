import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { initiateTransaction } from "@/lib/paytm";
import { paymentRateLimiter, getClientIp } from "@/lib/rate-limit";
import {
  generateIdempotencyKey,
  generateOrderId,
  validateAmount,
  isSuspiciousRequest,
} from "@/lib/payment-security";
import { createOrderSchema } from "@/lib/validators/payment";
import { calculateSubtotal } from "@/lib/seat-layouts";
import { generateBookingId } from "@/lib/utils";
import { APP_URL } from "@/lib/constants";
import { validatePromoCode } from "@/actions/promos";

export const dynamic = "force-dynamic";

async function validatePromoCodeAndCalculateDiscount(
  promoCode: string | undefined,
  subtotal: number
): Promise<{ verifiedDiscount: number; promoCodeUsed: string | null }> {
  if (!promoCode) {
    return { verifiedDiscount: 0, promoCodeUsed: null };
  }

  const result = await validatePromoCode(promoCode);
  if (!result.valid) {
    return { verifiedDiscount: 0, promoCodeUsed: null };
  }

  let verifiedDiscount = 0;
  if (result.type === "percentage") {
    verifiedDiscount = (subtotal * result.discount) / 100;
  } else {
    verifiedDiscount = result.discount;
  }

  return {
    verifiedDiscount: Math.min(subtotal, verifiedDiscount),
    promoCodeUsed: promoCode.toUpperCase(),
  };
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  try {
    // ─── Rate Limiting ─────────────────────────────────
    const rateCheck = paymentRateLimiter.check(ip);
    if (!rateCheck.success) {
      console.warn(`[CreateOrder] Rate limited: ${ip}`);
      return NextResponse.json(
        { error: "Too many requests. Please wait and try again." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    // ─── Bot Protection ────────────────────────────────
    const ua = request.headers.get("user-agent");
    if (isSuspiciousRequest(ua)) {
      console.warn(`[CreateOrder] Blocked suspicious UA: ${ua?.slice(0, 50)}`);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ─── Validate Input ────────────────────────────────
    const rawBody = await request.json();
    const parsed = createOrderSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const supabase = createAdminClient();

    // ─── Server-Side Calculations & Verification ───────
    // Fetch showtime
    const { data: showtime, error: stErr } = await supabase
      .from("showtimes")
      .select("*")
      .eq("id", input.showtimeId)
      .single();

    if (stErr || !showtime) {
      return NextResponse.json({ error: "Showtime not found" }, { status: 404 });
    }

    // Recalculate subtotal
    const serverSubtotal = calculateSubtotal(input.selectedSeats, showtime.screen_name, {
      premium: showtime.price_premium,
      gold: showtime.price_gold,
      recliner: showtime.price_recliner,
      base: showtime.price,
    });

    if (!validateAmount(input.subtotal, serverSubtotal)) {
      console.error(`[CreateOrder] Amount mismatch: client=${input.subtotal} server=${serverSubtotal} ip=${ip}`);
      return NextResponse.json(
        { error: "Price mismatch. Please refresh and try again." },
        { status: 400 }
      );
    }

    // Recalculate verifiedDiscount and serverFinalAmount
    const { verifiedDiscount, promoCodeUsed } = await validatePromoCodeAndCalculateDiscount(
      input.promoCode,
      serverSubtotal
    );

    const serverFinalAmount = Math.max(0, serverSubtotal - verifiedDiscount);

    // Mismatch check (never trust client amounts)
    if (Math.abs(input.finalAmount - serverFinalAmount) > 0.01) {
      console.error(`[CreateOrder] Final amount mismatch: client=${input.finalAmount} server=${serverFinalAmount} ip=${ip}`);
      return NextResponse.json(
        { error: "Amount mismatch. Please refresh and try again." },
        { status: 400 }
      );
    }

    // ─── Idempotency: Detect duplicate / retry ─────────
    const idempotencyKey = generateIdempotencyKey(
      input.phone,
      input.showtimeId,
      input.selectedSeats
    );

    // Already paid?
    const { data: successTxn } = await supabase
      .from("payment_transactions")
      .select("booking_id")
      .eq("idempotency_key", idempotencyKey)
      .eq("status", "success")
      .limit(1)
      .maybeSingle();

    if (successTxn) {
      return NextResponse.json(
        { error: "This booking has already been paid.", bookingId: successTxn.booking_id },
        { status: 409 }
      );
    }

    // Active pending payment? Expire it and retry with same booking.
    const { data: pendingTxn } = await supabase
      .from("payment_transactions")
      .select("order_id, booking_id, status")
      .eq("idempotency_key", idempotencyKey)
      .in("status", ["initiated", "pending"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pendingTxn) {
      await supabase
        .from("payment_transactions")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .eq("order_id", pendingTxn.order_id);

      const newOrderId = generateOrderId();
      const callbackUrl = `${APP_URL}/api/paytm/callback`;

      await supabase.from("payment_transactions").insert({
        booking_id: pendingTxn.booking_id,
        order_id: newOrderId,
        txn_amount: serverFinalAmount,
        status: "initiated",
        ip_address: ip,
        idempotency_key: idempotencyKey,
      });

      await supabase
        .from("bookings")
        .update({
          paytm_order_id: newOrderId,
          payment_status: "initiated",
          subtotal: serverSubtotal,
          discount: verifiedDiscount,
          final_amount: serverFinalAmount,
          promo_code_used: promoCodeUsed,
        })
        .eq("booking_id", pendingTxn.booking_id);

      try {
        const { txnToken } = await initiateTransaction({
          orderId: newOrderId,
          amount: serverFinalAmount.toFixed(2),
          custId: `CUST_${input.phone}`,
          callbackUrl,
        });

        await supabase
          .from("payment_transactions")
          .update({ status: "pending", updated_at: new Date().toISOString() })
          .eq("order_id", newOrderId);

        console.log(`[CreateOrder] Retry: booking=${pendingTxn.booking_id}, order=${newOrderId}`);

        return NextResponse.json({
          txnToken,
          orderId: newOrderId,
          mid: process.env.PAYTM_MID,
          amount: serverFinalAmount.toFixed(2),
          bookingId: pendingTxn.booking_id,
        });
      } catch (paytmErr) {
        await supabase
          .from("payment_transactions")
          .update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("order_id", newOrderId);
        const msg = paytmErr instanceof Error ? paytmErr.message : "Payment initiation failed";
        return NextResponse.json({ error: msg }, { status: 502 });
      }
    }

    // ─── Fresh Booking Flow ────────────────────────────

    // Check seat availability
    const booked = (showtime.booked_seats as string[]) || [];
    const conflicts = input.selectedSeats.filter((s) => booked.includes(s));
    if (conflicts.length > 0) {
      return NextResponse.json(
        { error: `Seats already booked: ${conflicts.join(", ")}` },
        { status: 409 }
      );
    }

    // Lock seats atomically
    let lockSuccess = false;
    const { error: lockErr } = await supabase.rpc("book_seats_safe", {
      p_showtime_id: input.showtimeId,
      p_seats: input.selectedSeats,
    });

    if (!lockErr) {
      lockSuccess = true;
    } else {
      console.warn("[CreateOrder] RPC book_seats_safe failed, trying manual fallback:", lockErr.message);
      try {
        const { data: stData, error: fetchErr } = await supabase
          .from("showtimes")
          .select("booked_seats")
          .eq("id", input.showtimeId)
          .single();

        if (!fetchErr && stData) {
          const currentBooked = (stData.booked_seats as string[]) || [];
          const manualConflicts = input.selectedSeats.filter((s) => currentBooked.includes(s));
          if (manualConflicts.length === 0) {
            const updatedSeats = [...new Set([...currentBooked, ...input.selectedSeats])];
            const { error: updateErr } = await supabase
              .from("showtimes")
              .update({ booked_seats: updatedSeats })
              .eq("id", input.showtimeId);

            if (!updateErr) {
              lockSuccess = true;
            }
          }
        }
      } catch (fallbackErr) {
        console.error("[CreateOrder] Manual seat lock fallback failed:", fallbackErr);
      }
    }

    if (!lockSuccess) {
      return NextResponse.json(
        { error: "Selected seats are no longer available" },
        { status: 409 }
      );
    }

    // Create booking record
    const bookingId = generateBookingId();
    const orderId = generateOrderId();

    const { error: bookErr } = await supabase.from("bookings").insert({
      booking_id: bookingId,
      showtime_id: input.showtimeId,
      customer_name: input.customerName,
      phone: input.phone,
      email: input.email || "",
      selected_seats: input.selectedSeats,
      subtotal: serverSubtotal,
      discount: verifiedDiscount,
      final_amount: serverFinalAmount,
      promo_code_used: promoCodeUsed,
      payment_mode: "paytm",
      payment_status: "initiated",
      booking_status: "pending",
      paytm_order_id: orderId,
    });

    if (bookErr) {
      console.error("[CreateOrder] Booking insert failed:", bookErr.message);
      await supabase.rpc("release_seats_safe", {
        p_showtime_id: input.showtimeId,
        p_seats: input.selectedSeats,
      });
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
    }

    // Create payment transaction record
    await supabase.from("payment_transactions").insert({
      booking_id: bookingId,
      order_id: orderId,
      txn_amount: serverFinalAmount,
      status: "initiated",
      ip_address: ip,
      idempotency_key: idempotencyKey,
    });

    // Initiate Paytm transaction
    const callbackUrl = `${APP_URL}/api/paytm/callback`;

    try {
      const { txnToken } = await initiateTransaction({
        orderId,
        amount: serverFinalAmount.toFixed(2),
        custId: `CUST_${input.phone}`,
        callbackUrl,
      });

      await supabase
        .from("payment_transactions")
        .update({ status: "pending", updated_at: new Date().toISOString() })
        .eq("order_id", orderId);

      console.log(`[CreateOrder] OK: booking=${bookingId} order=${orderId} ₹${serverFinalAmount}`);

      return NextResponse.json({
        txnToken,
        orderId,
        mid: process.env.PAYTM_MID,
        amount: serverFinalAmount.toFixed(2),
        bookingId,
      });
    } catch (paytmErr) {
      // Full rollback
      console.error("[CreateOrder] Paytm initiate failed:", paytmErr);

      await supabase.rpc("release_seats_safe", {
        p_showtime_id: input.showtimeId,
        p_seats: input.selectedSeats,
      });

      await supabase
        .from("bookings")
        .update({ booking_status: "cancelled", payment_status: "failed" })
        .eq("booking_id", bookingId);

      await supabase
        .from("payment_transactions")
        .update({
          status: "failed",
          gateway_response: { error: paytmErr instanceof Error ? paytmErr.message : "Unknown" },
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId);

      const msg = paytmErr instanceof Error ? paytmErr.message : "Payment gateway error";
      return NextResponse.json({ error: msg }, { status: 502 });
    }
  } catch (err) {
    console.error("[CreateOrder] Unhandled:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
