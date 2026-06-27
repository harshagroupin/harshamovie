import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { initiateTransaction } from "@/lib/paytm";
import { paymentRateLimiter, getClientIp } from "@/lib/rate-limit";
import { isSuspiciousRequest } from "@/lib/payment-security";
import { APP_URL } from "@/lib/constants";
import crypto from "crypto";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createVoucherOrderSchema = z.object({
  voucherId: z.string().uuid("Invalid voucher ID"),
  customerName: z.string().min(2, "Name must be at least 2 characters").max(100).trim(),
  phone: z.string().regex(/^\d{10}$/, "Enter a valid 10-digit phone number"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  price: z.number().positive("Price must be positive"),
});

function generateVoucherOrderId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `VCH${ts}${rand}`;
}

function generateUniqueVoucherCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let part1 = "";
  let part2 = "";
  for (let i = 0; i < 4; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length));
    part2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `VCH-${part1}-${part2}`;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  try {
    // ─── Rate Limiting ─────────────────────────────────
    const rateCheck = paymentRateLimiter.check(ip);
    if (!rateCheck.success) {
      console.warn(`[CreateVoucherOrder] Rate limited: ${ip}`);
      return NextResponse.json(
        { error: "Too many requests. Please wait and try again." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    // ─── Bot Protection ────────────────────────────────
    const ua = request.headers.get("user-agent");
    if (isSuspiciousRequest(ua)) {
      console.warn(`[CreateVoucherOrder] Blocked suspicious UA: ${ua?.slice(0, 50)}`);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ─── Validate Input ────────────────────────────────
    const rawBody = await request.json();
    const parsed = createVoucherOrderSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const supabase = createAdminClient();

    // ─── Fetch Voucher & Verify Amount ─────────────────
    const { data: voucher, error: vErr } = await supabase
      .from("vouchers")
      .select("*")
      .eq("id", input.voucherId)
      .eq("is_active", true)
      .single();

    if (vErr || !voucher) {
      return NextResponse.json({ error: "Voucher not found or inactive" }, { status: 404 });
    }

    // ─── Validate Expiry Date ──────────────────────────
    if (voucher.expiry_date) {
      const expiry = new Date(voucher.expiry_date);
      if (expiry < new Date()) {
        return NextResponse.json({ error: "This promo / voucher has expired" }, { status: 400 });
      }
    }

    // ─── Validate Total Usage Limit ────────────────────
    if (voucher.usage_limit > 0 && voucher.times_used >= voucher.usage_limit) {
      return NextResponse.json({ error: "This promo / voucher has reached its usage limit" }, { status: 400 });
    }

    // ─── Validate Per-User Purchase Limit ──────────────
    if (voucher.limit_per_user > 0) {
      const { count, error: countErr } = await supabase
        .from("user_vouchers")
        .select("*", { count: "exact", head: true })
        .eq("voucher_id", voucher.id)
        .eq("email", input.email || "")
        .eq("payment_status", "completed");

      if (!countErr && count !== null && count >= voucher.limit_per_user) {
        return NextResponse.json(
          { error: `You have reached the purchase limit for this promo (Max ${voucher.limit_per_user}).` },
          { status: 400 }
        );
      }
    }

    // Verify price
    if (Math.abs(input.price - Number(voucher.price)) > 0.01) {
      console.error(`[CreateVoucherOrder] Price mismatch: client=${input.price} server=${voucher.price}`);
      return NextResponse.json(
        { error: "Price mismatch. Please try again." },
        { status: 400 }
      );
    }

    const orderId = generateVoucherOrderId();
    const callbackUrl = `${APP_URL}/api/paytm/callback`;

    // ─── Create User Voucher Record ───────────────────
    const { data: userVoucher, error: uvErr } = await supabase
      .from("user_vouchers")
      .insert({
        voucher_id: voucher.id,
        voucher_code: generateUniqueVoucherCode(),
        voucher_title: voucher.title,
        customer_name: input.customerName,
        phone: input.phone,
        email: input.email || "",
        price: voucher.price,
        payment_status: "initiated",
        payment_mode: "paytm",
        paytm_order_id: orderId,
      })
      .select()
      .single();

    if (uvErr || !userVoucher) {
      console.error("[CreateVoucherOrder] User voucher insert failed:", uvErr?.message);
      return NextResponse.json({ error: "Failed to create voucher record" }, { status: 500 });
    }

    // ─── Create Payment Transaction Record ─────────────
    // Note: booking_id stores the userVoucher.id (UUID) so callback route can reference it
    await supabase.from("payment_transactions").insert({
      booking_id: userVoucher.id,
      order_id: orderId,
      txn_amount: voucher.price,
      status: "initiated",
      ip_address: ip,
    });

    // ─── Initiate Paytm Transaction ───────────────────
    try {
      const { txnToken } = await initiateTransaction({
        orderId,
        amount: Number(voucher.price).toFixed(2),
        custId: `CUST_${input.phone}`,
        callbackUrl,
      });

      await supabase
        .from("payment_transactions")
        .update({ status: "pending", updated_at: new Date().toISOString() })
        .eq("order_id", orderId);

      console.log(`[CreateVoucherOrder] OK: userVoucher=${userVoucher.id} order=${orderId} ₹${voucher.price}`);

      return NextResponse.json({
        txnToken,
        orderId,
        mid: process.env.PAYTM_MID?.replace(/^['"]|['"]$/g, ""),
        amount: Number(voucher.price).toFixed(2),
        userVoucherId: userVoucher.id,
      });
    } catch (paytmErr) {
      console.error("[CreateVoucherOrder] Paytm initiate failed:", paytmErr);

      // Rollback
      await supabase
        .from("user_vouchers")
        .update({ payment_status: "failed" })
        .eq("id", userVoucher.id);

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
    console.error("[CreateVoucherOrder] Unhandled:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
