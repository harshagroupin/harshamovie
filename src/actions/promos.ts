"use server";

import { verifyAdmin, createAdminClient } from "@/lib/supabase/admin";
import type { PromoCode } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function validatePromoCode(code: string): Promise<{
  valid: boolean;
  discount: number;
  type: "percentage" | "fixed";
  message: string;
}> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("is_active", true)
      .single();

    if (error || !data) {
      return { valid: false, discount: 0, type: "percentage", message: "Invalid promo code" };
    }

    if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
      return { valid: false, discount: 0, type: "percentage", message: "Promo code has expired" };
    }

    if (data.usage_limit > 0 && data.times_used >= data.usage_limit) {
      return { valid: false, discount: 0, type: "percentage", message: "Promo code usage limit reached" };
    }

    return {
      valid: true,
      discount: data.discount_value,
      type: data.discount_type as "percentage" | "fixed",
      message: data.discount_type === "percentage"
        ? `${data.discount_value}% discount applied!`
        : `₹${data.discount_value} discount applied!`,
    };
  } catch {
    return { valid: false, discount: 0, type: "percentage", message: "Error validating promo code" };
  }
}

export async function getPromoCodes(): Promise<PromoCode[]> {
  await verifyAdmin();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("promo_codes")
    .select("*")
    .order("code", { ascending: true });
  if (error) {
    console.error("getPromoCodes error:", error.code, error.message);
    // Return empty array on any error rather than crashing the page
    return [];
  }
  return data || [];
}

export async function createPromoCode(promo: Partial<PromoCode>): Promise<PromoCode> {
  await verifyAdmin();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("promo_codes")
    .insert([{ ...promo, code: promo.code?.toUpperCase() }])
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  return data;
}

export async function updatePromoCode(id: string, updates: Partial<PromoCode>): Promise<PromoCode> {
  await verifyAdmin();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("promo_codes")
    .update({ ...updates, code: updates.code?.toUpperCase() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  return data;
}

export async function deletePromoCode(id: string): Promise<void> {
  await verifyAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("promo_codes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

