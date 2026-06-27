import { NextRequest, NextResponse } from "next/server";
import { getTransactionStatus } from "@/lib/paytm";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyRateLimiter, getClientIp } from "@/lib/rate-limit";
import { verifyOrderSchema } from "@/lib/validators/payment";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // ─── Rate Limiting ─────────────────────────────────
    const ip = getClientIp(request);
    const rateCheck = verifyRateLimiter.check(ip);
    if (!rateCheck.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // ─── Validate ──────────────────────────────────────
    const rawBody = await request.json();
    const parsed = verifyOrderSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { orderId } = parsed.data;
    const supabase = createAdminClient();

    // ─── Get Transaction ───────────────────────────────
    const { data: txn } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (!txn) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // ─── Detect if this is a Voucher order ─────────────
    const isVoucherOrder = orderId.startsWith("VCH");

    // Fetch showtime_id from bookings (only for movie orders)
    let showtimeId: string | null = null;
    if (!isVoucherOrder) {
      const { data: bookingInfo } = await supabase
        .from("bookings")
        .select("showtime_id")
        .eq("booking_id", txn.booking_id)
        .single();
      showtimeId = bookingInfo?.showtime_id || null;
    }

    // Already finalized — return cached
    if (txn.status === "success") {
      return NextResponse.json({ status: "success", bookingId: txn.booking_id, showtimeId });
    }
    if (txn.status === "failed" || txn.status === "expired") {
      return NextResponse.json({
        status: "failed",
        bookingId: txn.booking_id,
        showtimeId,
        message: "Payment was not successful",
      });
    }

    // ─── Query Paytm Transaction Status API ────────────
    const statusResult = await getTransactionStatus(orderId);
    const txnStatus = statusResult?.body?.resultInfo?.resultStatus;
    const txnId = statusResult?.body?.txnId;

    if (txnStatus === "TXN_SUCCESS") {
      await supabase
        .from("payment_transactions")
        .update({
          status: "success",
          txn_id: txnId,
          gateway_response: statusResult.body,
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId);

      if (isVoucherOrder) {
        const { data: userVoucher } = await supabase
          .from("user_vouchers")
          .update({ payment_status: "completed" })
          .eq("paytm_order_id", orderId)
          .select("voucher_id")
          .maybeSingle();

        if (userVoucher?.voucher_id) {
          await supabase.rpc("increment_voucher_usage", {
            p_voucher_id: userVoucher.voucher_id,
          });
        }

        console.log(`[Paytm Verify] VOUCHER SUCCESS: order=${orderId}`);
        return NextResponse.json({ status: "success", bookingId: txn.booking_id, isVoucher: true });
      }

      await supabase
        .from("bookings")
        .update({
          payment_status: "completed",
          booking_status: "confirmed",
          paytm_order_id: orderId,
        })
        .eq("booking_id", txn.booking_id);

      // Promo code
      const { data: booking } = await supabase
        .from("bookings")
        .select("promo_code_used")
        .eq("booking_id", txn.booking_id)
        .single();

      if (booking?.promo_code_used) {
        await supabase.rpc("increment_promo_usage", {
          promo_code: booking.promo_code_used,
        });
      }

      console.log(`[Paytm Verify] SUCCESS: order=${orderId}`);
      return NextResponse.json({ status: "success", bookingId: txn.booking_id, showtimeId });
    }

    if (txnStatus === "PENDING") {
      await supabase
        .from("payment_transactions")
        .update({
          status: "pending",
          gateway_response: statusResult.body,
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId);

      if (isVoucherOrder) {
        await supabase
          .from("user_vouchers")
          .update({ payment_status: "pending" })
          .eq("paytm_order_id", orderId);
      }

      return NextResponse.json({
        status: "pending",
        bookingId: txn.booking_id,
        showtimeId,
        isVoucher: isVoucherOrder,
        message: "Payment is being processed. Please wait.",
      });
    }

    // Failed
    await supabase
      .from("payment_transactions")
      .update({
        status: "failed",
        txn_id: txnId,
        gateway_response: statusResult.body,
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderId);

    if (isVoucherOrder) {
      await supabase
        .from("user_vouchers")
        .update({ payment_status: "failed" })
        .eq("paytm_order_id", orderId);

      console.log(`[Paytm Verify] VOUCHER FAILED: order=${orderId}`);
      return NextResponse.json({
        status: "failed",
        isVoucher: true,
        message: statusResult?.body?.resultInfo?.resultMsg || "Payment failed",
      });
    }

    // Release seats (movie bookings only)
    const { data: booking } = await supabase
      .from("bookings")
      .select("showtime_id, selected_seats, booking_status")
      .eq("booking_id", txn.booking_id)
      .single();

    if (booking && booking.booking_status !== "cancelled") {
      await supabase.rpc("release_seats_safe", {
        p_showtime_id: booking.showtime_id,
        p_seats: booking.selected_seats as string[],
      });

      await supabase
        .from("bookings")
        .update({ payment_status: "failed", booking_status: "cancelled" })
        .eq("booking_id", txn.booking_id);
    }

    console.log(`[Paytm Verify] FAILED: order=${orderId}`);
    return NextResponse.json({
      status: "failed",
      bookingId: txn.booking_id,
      showtimeId,
      message: statusResult?.body?.resultInfo?.resultMsg || "Payment failed",
    });
  } catch (err) {
    console.error("[Paytm Verify] Error:", err);
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 });
  }
}

