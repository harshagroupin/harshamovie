"use server";

import { verifyAdmin, createAdminClient } from "@/lib/supabase/admin";
import type { Voucher, UserVoucher, Booking } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { getTransactionStatus } from "@/lib/paytm";

// ─── ADMIN ACTIONS ───────────────────────────────────

export async function getVouchers(): Promise<Voucher[]> {
  await verifyAdmin();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("vouchers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getVouchers error:", error.code, error.message);
    return [];
  }
  return data || [];
}

export async function createVoucher(voucher: Partial<Voucher>): Promise<Voucher> {
  await verifyAdmin();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("vouchers")
    .insert([{ ...voucher, code: voucher.code?.toUpperCase() }])
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  return data;
}

export async function updateVoucher(id: string, updates: Partial<Voucher>): Promise<Voucher> {
  await verifyAdmin();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("vouchers")
    .update({ ...updates, code: updates.code?.toUpperCase() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  return data;
}

export async function deleteVoucher(id: string): Promise<void> {
  await verifyAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("vouchers").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

// ─── PUBLIC ACTIONS ──────────────────────────────────

export async function getVoucherById(id: string): Promise<Voucher | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("vouchers")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    console.error("getVoucherById error:", error.code, error.message);
    return null;
  }
  return data;
}

export async function getActiveVouchers(): Promise<Voucher[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("vouchers")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getActiveVouchers error:", error.code, error.message);
    return [];
  }
  return data || [];
}

export async function getUserVouchers(email: string): Promise<UserVoucher[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("user_vouchers")
    .select("*, voucher:vouchers(*)")
    .eq("email", email)
    .eq("payment_status", "completed")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getUserVouchers error:", error.code, error.message);
    return [];
  }
  return data || [];
}

export async function getUserVoucherById(id: string): Promise<UserVoucher | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("user_vouchers")
    .select("*, voucher:vouchers(*)")
    .eq("id", id)
    .single();
  if (error) {
    console.error("getUserVoucherById error:", error.code, error.message);
    return null;
  }
  return data;
}

export async function getUserVoucherByOrderId(orderId: string): Promise<UserVoucher | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("user_vouchers")
    .select("*, voucher:vouchers(*)")
    .eq("paytm_order_id", orderId)
    .single();
  if (error) {
    console.error("getUserVoucherByOrderId error:", error.code, error.message);
    return null;
  }
  return data;
}

// ─── TICKET & VOUCHER VERIFICATION ACTIONS ───────────

export async function getBookingDetailsForVerification(query: string): Promise<Booking | null> {
  await verifyAdmin();
  const supabase = createAdminClient();
  
  // Search by booking_id or paytm_order_id
  const { data, error } = await supabase
    .from("bookings")
    .select("*, showtime:showtimes(*, movie:movies(*))")
    .or(`booking_id.eq.${query.trim()},paytm_order_id.eq.${query.trim()}`)
    .maybeSingle();

  if (error) {
    console.error("getBookingDetailsForVerification error:", error.message);
    return null;
  }
  return data;
}

export async function getVoucherDetailsForVerification(query: string): Promise<UserVoucher | null> {
  await verifyAdmin();
  const supabase = createAdminClient();

  // Search by voucher_code or paytm_order_id
  const { data, error } = await supabase
    .from("user_vouchers")
    .select("*, voucher:vouchers(*)")
    .or(`voucher_code.eq.${query.trim().toUpperCase()},paytm_order_id.eq.${query.trim()}`)
    .maybeSingle();

  if (error) {
    console.error("getVoucherDetailsForVerification error:", error.message);
    return null;
  }
  return data;
}

export async function cancelPendingVoucher(orderId: string): Promise<{ success: boolean; status: string; message: string }> {
  const supabase = createAdminClient();

  // Find transaction
  const { data: txn, error: tErr } = await supabase
    .from("payment_transactions")
    .select("*")
    .eq("order_id", orderId)
    .single();

  if (tErr || !txn) {
    return { success: false, status: "failed", message: "Transaction not found" };
  }

  // Already successful or failed/expired
  if (txn.status === "success") {
    return { success: false, status: "success", message: "Payment is already successful." };
  }

  if (txn.status === "failed" || txn.status === "expired") {
    return { success: true, status: "failed", message: "Payment has already failed or expired." };
  }

  // One final verification with Paytm
  try {
    const statusResult = await getTransactionStatus(orderId);
    const txnStatus = statusResult?.body?.resultInfo?.resultStatus;
    const txnId = statusResult?.body?.txnId || txn.txn_id;

    if (txnStatus === "TXN_SUCCESS") {
      // Complete transaction
      await supabase
        .from("payment_transactions")
        .update({
          status: "success",
          txn_id: txnId,
          gateway_response: statusResult.body,
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId);

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

      revalidatePath("/", "layout");
      return { success: false, status: "success", message: "Payment is successful! Voucher confirmed." };
    }
  } catch (paytmErr) {
    console.error("[CancelPendingVoucher] Paytm verification error before cancel:", paytmErr);
  }

  // If not successful, cancel order
  await supabase
    .from("payment_transactions")
    .update({
      status: "failed",
      updated_at: new Date().toISOString(),
    })
    .eq("order_id", orderId);

  await supabase
    .from("user_vouchers")
    .update({
      payment_status: "failed",
    })
    .eq("paytm_order_id", orderId);

  revalidatePath("/", "layout");
  return { success: true, status: "failed", message: "Order cancelled." };
}

export async function redeemVoucherAction(query: string): Promise<{
  success: boolean;
  message: string;
  voucher: UserVoucher | null;
}> {
  try {
    await verifyAdmin();
    const supabase = createAdminClient();

    const { data: userVoucher, error: findErr } = await supabase
      .from("user_vouchers")
      .select("*, voucher:vouchers(*)")
      .or(`voucher_code.eq.${query.trim().toUpperCase()},paytm_order_id.eq.${query.trim()}`)
      .maybeSingle();

    if (findErr || !userVoucher) {
      return { success: false, message: "Voucher not found.", voucher: null };
    }

    if (userVoucher.payment_status !== "completed") {
      return { success: false, message: "Cannot redeem an unpaid voucher.", voucher: null };
    }

    if (userVoucher.is_redeemed) {
      const redeemedTime = userVoucher.redeemed_at 
        ? new Date(userVoucher.redeemed_at).toLocaleString("en-IN")
        : "N/A";
      return { 
        success: false, 
        message: `Voucher was already redeemed on ${redeemedTime}.`, 
        voucher: userVoucher 
      };
    }

    const { data: updatedVoucher, error: updateErr } = await supabase
      .from("user_vouchers")
      .update({
        is_redeemed: true,
        redeemed_at: new Date().toISOString()
      })
      .eq("id", userVoucher.id)
      .select("*, voucher:vouchers(*)")
      .single();

    if (updateErr || !updatedVoucher) {
      console.error("Redeem update error:", updateErr);
      return { 
        success: false, 
        message: `Failed to mark voucher as redeemed: ${updateErr?.message || "Make sure you ran the SQL columns migration."}`, 
        voucher: null 
      };
    }

    return { 
      success: true, 
      message: "Voucher redeemed successfully!", 
      voucher: updatedVoucher 
    };
  } catch (error: any) {
    return { success: false, message: error.message || "An error occurred.", voucher: null };
  }
}
