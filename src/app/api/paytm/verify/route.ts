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

    // Already finalized — return cached
    if (txn.status === "success") {
      return NextResponse.json({ status: "success", bookingId: txn.booking_id });
    }
    if (txn.status === "failed" || txn.status === "expired") {
      return NextResponse.json({
        status: "failed",
        bookingId: txn.booking_id,
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
      return NextResponse.json({ status: "success", bookingId: txn.booking_id });
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

      return NextResponse.json({
        status: "pending",
        bookingId: txn.booking_id,
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

    // Release seats
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
      message: statusResult?.body?.resultInfo?.resultMsg || "Payment failed",
    });
  } catch (err) {
    console.error("[Paytm Verify] Error:", err);
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 });
  }
}
