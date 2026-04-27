"use server";

import { verifyAdmin, createAdminClient } from "@/lib/supabase/admin";
import type { Showtime } from "@/lib/types";
import { revalidatePath } from "next/cache";

/**
 * Public-facing reads use the admin (service-role) client to bypass RLS.
 * This is safe because these functions run exclusively on the server.
 */

export async function getShowtimesByMovie(movieId: string): Promise<Showtime[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("showtimes")
      .select("*")
      .eq("movie_id", movieId)
      .gte("show_date", new Date().toISOString().split("T")[0])
      .order("show_date", { ascending: true })
      .order("show_time", { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  } catch (e) {
    console.error("[getShowtimesByMovie] Error:", e);
    return [];
  }
}

export async function getShowtimeById(id: string): Promise<Showtime | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("showtimes")
      .select("*, movie:movies(*)")
      .eq("id", id)
      .single();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function getAllShowtimes(): Promise<any[]> {
  await verifyAdmin();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("showtimes")
    .select("*, movie:movies(title)")
    .order("show_date", { ascending: true })
    .order("show_time", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createShowtime(showtime: Partial<Showtime>): Promise<Showtime> {
  await verifyAdmin();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("showtimes")
    .insert([showtime])
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  return data;
}

export async function updateShowtime(id: string, updates: Partial<Showtime>): Promise<Showtime> {
  await verifyAdmin();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("showtimes")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  return data;
}

export async function deleteShowtime(id: string): Promise<void> {
  await verifyAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("showtimes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function updateBookedSeats(id: string, seats: string[]): Promise<void> {
  const supabase = createAdminClient();
  const { data: showtime } = await supabase
    .from("showtimes")
    .select("booked_seats")
    .eq("id", id)
    .single();

  if (!showtime) throw new Error("Showtime not found");

  const currentBooked = (showtime.booked_seats as string[]) || [];
  const updatedSeats = [...new Set([...currentBooked, ...seats])];

  const { error } = await supabase
    .from("showtimes")
    .update({ booked_seats: updatedSeats })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function freeSeats(showtimeId: string, seatsToFree: string[]): Promise<void> {
  const supabase = createAdminClient();
  const { data: showtime } = await supabase
    .from("showtimes")
    .select("booked_seats")
    .eq("id", showtimeId)
    .single();

  if (!showtime) throw new Error("Showtime not found");

  const currentBooked = (showtime.booked_seats as string[]) || [];
  const updatedSeats = currentBooked.filter((s) => !seatsToFree.includes(s));

  const { error } = await supabase
    .from("showtimes")
    .update({ booked_seats: updatedSeats })
    .eq("id", showtimeId);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

