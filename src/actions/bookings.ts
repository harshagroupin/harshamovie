"use server";

import { verifyAdmin, createAdminClient } from "@/lib/supabase/admin";
import type { Booking, DashboardStats } from "@/lib/types";
import { generateBookingId } from "@/lib/utils";
import { updateBookedSeats } from "./showtimes";
import { revalidatePath } from "next/cache";

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

  const { data, error } = await supabase
    .from("bookings")
    .insert([{
      booking_id: bookingId,
      showtime_id: input.showtimeId,
      customer_name: input.customerName,
      phone: input.phone,
      email: input.email,
      selected_seats: input.selectedSeats,
      subtotal: input.subtotal,
      discount: input.discount,
      final_amount: input.finalAmount,
      promo_code_used: input.promoCodeUsed,
      payment_mode: input.paymentMode,
      payment_status: "completed",
      booking_status: "confirmed",
    }])
    .select()
    .single();

  if (error) throw new Error(error.message);

  await updateBookedSeats(input.showtimeId, input.selectedSeats);

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

  // Free the seats using the admin client
  const { data: showtime } = await supabase
    .from("showtimes")
    .select("booked_seats")
    .eq("id", booking.showtime_id)
    .single();

  if (showtime) {
    const currentBooked = (showtime.booked_seats as string[]) || [];
    const updatedSeats = currentBooked.filter((s) => !(booking.selected_seats as string[]).includes(s));
    await supabase
      .from("showtimes")
      .update({ booked_seats: updatedSeats })
      .eq("id", booking.showtime_id);
  }

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

