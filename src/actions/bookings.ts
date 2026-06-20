"use server";

import { verifyAdmin, createAdminClient } from "@/lib/supabase/admin";
import type { Booking, DashboardStats } from "@/lib/types";
import { generateBookingId } from "@/lib/utils";
import { updateBookedSeats } from "./showtimes";
import { revalidatePath } from "next/cache";
import { calculateSubtotal } from "@/lib/seat-layouts";
import { getTransactionStatus } from "@/lib/paytm";

interface CreateBookingInput {
  showtimeId: string;
  customerName: string;
  phone: string;
  email: string;
  selectedSeats: string[];
  subtotal: number;
  discount: number;
  finalAmount: number;
  promoCodeUsed: string | null;
  paymentMode: "cash";
}

export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const bookingId = generateBookingId();
  const supabase = createAdminClient();

  let isAdmin = false;
  try {
    await verifyAdmin();
    isAdmin = true;
  } catch (e) {
    isAdmin = false;
  }

  if (!input.selectedSeats || input.selectedSeats.length === 0) {
    throw new Error("No seats selected.");
  }

  // 1. Fetch showtime to validate securely
  const { data: showtime, error: stError } = await supabase
    .from("showtimes")
    .select("*")
    .eq("id", input.showtimeId)
    .single();

  if (stError || !showtime) throw new Error("Showtime not found or database is unresponsive.");

  // 2. Validate price securely
  const expectedSubtotal = calculateSubtotal(input.selectedSeats, showtime.screen_name, {
    premium: showtime.price_premium,
    gold: showtime.price_gold,
    recliner: showtime.price_recliner,
    base: showtime.price
  });

  if (input.subtotal < expectedSubtotal) {
    throw new Error("Invalid booking amount detected. Potential fraud.");
  }

  // 3. Lock seats first to prevent race conditions and partial bookings
  await updateBookedSeats(input.showtimeId, input.selectedSeats);

  // 4. Create the booking record
  const { data, error } = await supabase
    .from("bookings")
    .insert([{
      booking_id: bookingId,
      showtime_id: input.showtimeId,
      customer_name: input.customerName,
      phone: input.phone,
      email: input.email,
      selected_seats: input.selectedSeats,
      subtotal: input.subtotal, // Could use expectedSubtotal here, but trusting UI calculated subtotal if valid
      discount: input.discount,
      final_amount: input.finalAmount,
      promo_code_used: input.promoCodeUsed,
      payment_mode: input.paymentMode,
      payment_status: isAdmin ? "completed" : "pending",
      booking_status: isAdmin ? "confirmed" : "pending",
    }])
    .select()
    .single();

  if (error) {
    // Rollback: unlock the seats concurrently-safely using the RPC
    await supabase.rpc("release_seats_safe", {
      p_showtime_id: input.showtimeId,
      p_seats: input.selectedSeats,
    });
    throw new Error(error.message);
  }

  if (input.promoCodeUsed) {
    const { error: promoError } = await supabase.rpc("increment_promo_usage", {
      promo_code: input.promoCodeUsed,
    });

    if (promoError) {
      console.error("Promo increment failed:", promoError);
    }
  }

  revalidatePath("/", "layout");
  return data;
}

export async function approveBooking(id: string): Promise<void> {
  await verifyAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("bookings")
    .update({ booking_status: "confirmed", payment_status: "completed" })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function getBookings(): Promise<Booking[]> {
  await verifyAdmin();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, showtime:showtimes(*, movie:movies(title, poster_url))")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getBookingById(bookingId: string): Promise<Booking | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("bookings")
      .select("*, showtime:showtimes(*, movie:movies(*))")
      .eq("booking_id", bookingId)
      .single();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function cancelBooking(id: string): Promise<void> {
  await verifyAdmin();
  const supabase = createAdminClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("showtime_id, selected_seats")
    .eq("id", id)
    .single();

  if (!booking) throw new Error("Booking not found");

  const { error } = await supabase
    .from("bookings")
    .update({ booking_status: "cancelled" })
    .eq("id", id);
  if (error) throw new Error(error.message);

  // Free the seats concurrently-safely using the RPC
  await supabase.rpc("release_seats_safe", {
    p_showtime_id: booking.showtime_id,
    p_seats: booking.selected_seats as string[],
  });

  revalidatePath("/", "layout");
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await verifyAdmin();
  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  const [moviesRes, bookingsRes, todayRes, revenueRes] = await Promise.all([
    supabase.from("movies").select("id", { count: "exact", head: true }),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("booking_status", "confirmed"),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("booking_status", "confirmed").gte("created_at", `${today}T00:00:00`),
    supabase.from("bookings").select("final_amount").eq("booking_status", "confirmed"),
  ]);

  const totalRevenue = (revenueRes.data || []).reduce((sum, b) => sum + (b.final_amount || 0), 0);

  return {
    totalMovies: moviesRes.count || 0,
    totalBookings: bookingsRes.count || 0,
    todayBookings: todayRes.count || 0,
    totalRevenue,
  };
}

export async function getRecentBookings(limit: number = 10): Promise<Booking[]> {
  await verifyAdmin();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, showtime:showtimes(*, movie:movies(title))")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getUserBookings(email: string): Promise<Booking[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, showtime:showtimes(*, movie:movies(title, poster_url))")
    .eq("email", email)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function cancelPendingBooking(orderId: string): Promise<{ success: boolean; status: string; bookingId: string | null; showtimeId: string | null; message: string }> {
  const supabase = createAdminClient();

  // Find transaction
  const { data: txn, error: tErr } = await supabase
    .from("payment_transactions")
    .select("*")
    .eq("order_id", orderId)
    .single();

  if (tErr || !txn) {
    return { success: false, status: "failed", bookingId: null, showtimeId: null, message: "Transaction not found" };
  }

  const bookingId = txn.booking_id;

  // Get booking details
  const { data: booking, error: bErr } = await supabase
    .from("bookings")
    .select("showtime_id, selected_seats, booking_status, promo_code_used")
    .eq("booking_id", bookingId)
    .single();

  const showtimeId = booking?.showtime_id || null;

  // Already successful or failed/expired
  if (txn.status === "success") {
    return { success: false, status: "success", bookingId, showtimeId, message: "Payment is already successful." };
  }

  if (txn.status === "failed" || txn.status === "expired") {
    return { success: true, status: "failed", bookingId, showtimeId, message: "Payment has already failed or expired." };
  }

  // ─── Perform one final Paytm transaction status check ───
  try {
    const statusResult = await getTransactionStatus(orderId);
    const txnStatus = statusResult?.body?.resultInfo?.resultStatus;
    const txnId = statusResult?.body?.txnId || txn.txn_id;

    if (txnStatus === "TXN_SUCCESS") {
      // Confirm the booking
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
        .eq("booking_id", bookingId);

      if (booking?.promo_code_used) {
        await supabase.rpc("increment_promo_usage", {
          promo_code: booking.promo_code_used,
        });
      }

      revalidatePath("/", "layout");
      return { success: false, status: "success", bookingId, showtimeId, message: "Payment is successful! Confirming your booking." };
    }
  } catch (paytmErr) {
    console.error("[CancelPendingBooking] Paytm verification error before cancel:", paytmErr);
  }

  // If not TXN_SUCCESS, cancel the booking and release seats
  await supabase
    .from("payment_transactions")
    .update({
      status: "failed",
      updated_at: new Date().toISOString(),
    })
    .eq("order_id", orderId);

  if (booking && booking.booking_status !== "cancelled") {
    await supabase.rpc("release_seats_safe", {
      p_showtime_id: booking.showtime_id,
      p_seats: booking.selected_seats as string[],
    });

    await supabase
      .from("bookings")
      .update({
        payment_status: "failed",
        booking_status: "cancelled",
      })
      .eq("booking_id", bookingId);
  }

  revalidatePath("/", "layout");
  return { success: true, status: "failed", bookingId, showtimeId, message: "Booking cancelled successfully. Seats released." };
}

