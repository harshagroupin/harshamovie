import { NextRequest, NextResponse } from "next/server";
import { verifySignature, getTransactionStatus } from "@/lib/paytm";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // ─── Parse Paytm Form-Encoded Callback ─────────────
    const formData = await request.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    const orderId = params.ORDERID;
    const checksumHash = params.CHECKSUMHASH;

    console.log("[Paytm Callback]", {
      orderId,
      status: params.STATUS,
      txnId: params.TXNID,
      amount: params.TXNAMOUNT,
    });

    if (!orderId || !checksumHash) {
      console.error("[Paytm Callback] Missing orderId or checksum");
      return NextResponse.redirect(
        new URL("/booking/checkout?error=invalid_callback", APP_URL),
        { status: 303 }
      );
    }

    // ─── Verify Checksum Signature ─────────────────────
    const merchantKey = process.env.PAYTM_MERCHANT_KEY?.replace(/^['"]|['"]$/g, "")!;
    const verifyParams = { ...params };
    delete verifyParams.CHECKSUMHASH;

    const isValid = await verifySignature(verifyParams, merchantKey, checksumHash);
    if (!isValid) {
      console.error("[Paytm Callback] INVALID CHECKSUM:", orderId);
      const isVoucherOrder = orderId.startsWith("VCH");
      const errRedirect = isVoucherOrder
        ? `/booking/voucher-status?orderId=${orderId}&error=invalid_signature`
        : `/booking/payment-status?orderId=${orderId}&error=invalid_signature`;
      return NextResponse.redirect(
        new URL(errRedirect, APP_URL),
        { status: 303 }
      );
    }

    // ─── Server-side Transaction Verification ──────────
    const statusResult = await getTransactionStatus(orderId);
    const txnStatus = statusResult?.body?.resultInfo?.resultStatus;
    const txnId = statusResult?.body?.txnId || params.TXNID;

    const supabase = createAdminClient();

    // Get payment transaction
    const { data: txn } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (!txn) {
      console.error("[Paytm Callback] Transaction not found:", orderId);
      return NextResponse.redirect(
        new URL("/booking/checkout?error=transaction_not_found", APP_URL),
        { status: 303 }
      );
    }

    // ─── Detect if this is a Voucher order ─────────────
    const isVoucherOrder = orderId.startsWith("VCH");

    // Already processed — skip
    if (txn.status === "success") {
      if (isVoucherOrder) {
        return NextResponse.redirect(
          new URL(`/booking/voucher-status?orderId=${orderId}`, APP_URL),
          { status: 303 }
        );
      }
      return NextResponse.redirect(
        new URL(`/booking/confirmation?id=${txn.booking_id}`, APP_URL),
        { status: 303 }
      );
    }

    if (txnStatus === "TXN_SUCCESS") {
      // ─── Payment Successful ──────────────────────────
      await supabase
        .from("payment_transactions")
        .update({
          status: "success",
          txn_id: txnId,
          gateway_response: statusResult.body || params,
          checksum: checksumHash,
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId);

      if (isVoucherOrder) {
        // Update user_vouchers table
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

        console.log(`[Paytm Callback] VOUCHER SUCCESS: order=${orderId}`);

        return NextResponse.redirect(
          new URL(`/booking/voucher-status?orderId=${orderId}`, APP_URL),
          { status: 303 }
        );
      }

      // ─── Movie Booking Success ────────────────────────
      await supabase
        .from("bookings")
        .update({
          payment_status: "completed",
          booking_status: "confirmed",
          paytm_order_id: orderId,
        })
        .eq("booking_id", txn.booking_id);

      // Increment promo usage on successful payment
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

      console.log(`[Paytm Callback] SUCCESS: order=${orderId} booking=${txn.booking_id}`);

      return NextResponse.redirect(
        new URL(`/booking/confirmation?id=${txn.booking_id}`, APP_URL),
        { status: 303 }
      );
    } else if (txnStatus === "PENDING") {
      // ─── Payment Pending ─────────────────────────────
      await supabase
        .from("payment_transactions")
        .update({
          status: "pending",
          txn_id: txnId,
          gateway_response: statusResult.body || params,
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId);

      if (isVoucherOrder) {
        await supabase
          .from("user_vouchers")
          .update({ payment_status: "pending" })
          .eq("paytm_order_id", orderId);
      }

      console.log(`[Paytm Callback] PENDING: order=${orderId}`);

      const pendingRedirect = isVoucherOrder
        ? `/booking/voucher-status?orderId=${orderId}&status=pending`
        : `/booking/payment-status?orderId=${orderId}&status=pending`;

      return NextResponse.redirect(
        new URL(pendingRedirect, APP_URL),
        { status: 303 }
      );
    } else {
      // ─── Payment Failed ──────────────────────────────
      await supabase
        .from("payment_transactions")
        .update({
          status: "failed",
          txn_id: txnId,
          gateway_response: statusResult.body || params,
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId);

      if (isVoucherOrder) {
        await supabase
          .from("user_vouchers")
          .update({ payment_status: "failed" })
          .eq("paytm_order_id", orderId);

        console.log(`[Paytm Callback] VOUCHER FAILED: order=${orderId}`);

        return NextResponse.redirect(
          new URL(`/booking/voucher-status?orderId=${orderId}&error=payment_failed`, APP_URL),
          { status: 303 }
        );
      }

      // Release locked seats (movie bookings only)
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

      console.log(
        `[Paytm Callback] FAILED: order=${orderId} reason=${statusResult?.body?.resultInfo?.resultMsg}`
      );

      return NextResponse.redirect(
        new URL(`/booking/payment-status?orderId=${orderId}&error=payment_failed`, APP_URL),
        { status: 303 }
      );
    }
  } catch (err) {
    console.error("[Paytm Callback] Unhandled:", err);
    return NextResponse.redirect(
      new URL("/booking/checkout?error=callback_error", APP_URL),
      { status: 303 }
    );
  }
}
