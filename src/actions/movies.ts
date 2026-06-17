"use server";

import { createAdminClient, verifyAdmin } from "@/lib/supabase/admin";
import type { Movie } from "@/lib/types";
import { revalidatePath } from "next/cache";

/**
 * Public-facing reads use the admin (service-role) client to bypass RLS.
 * This is safe because these functions run exclusively on the server and
 * never expose the service-role key to the browser.
 */

export async function getMovies(): Promise<Movie[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("movies")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[getMovies] Database error:", error);
      throw new Error(error.message);
    }
    return data || [];
  } catch (e) {
    console.error("[getMovies] Catch error:", e);
    return [];
  }
}

export async function getFeaturedMovies(): Promise<Movie[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("movies")
      .select("*")
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[getFeaturedMovies] Database error:", error);
      throw new Error(error.message);
    }
    return data || [];
  } catch (e) {
    console.error("[getFeaturedMovies] Catch error:", e);
    return [];
  }
}

export async function getMovieBySlug(slug: string): Promise<Movie | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("movies")
      .select("*")
      .eq("slug", slug)
      .single();
    if (error) {
      console.error(`[getMovieBySlug] Database error for slug "${slug}":`, error);
      return null;
    }
    return data;
  } catch (e) {
    console.error(`[getMovieBySlug] Catch error for slug "${slug}":`, e);
    return null;
  }
}

export async function getMovieById(id: string): Promise<Movie | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("movies")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function getAllMoviesAdmin(): Promise<Movie[]> {
  await verifyAdmin();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("movies")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createMovie(movie: Partial<Movie>): Promise<Movie> {
  await verifyAdmin();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("movies")
    .insert([movie])
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  return data;
}

export async function updateMovie(id: string, updates: Partial<Movie>): Promise<Movie> {
  await verifyAdmin();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("movies")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  return data;
}

export async function deleteMovie(id: string): Promise<void> {
  await verifyAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("movies").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function toggleMovieFeatured(id: string, featured: boolean): Promise<void> {
  await verifyAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("movies")
    .update({ is_featured: featured })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function toggleMovieActive(id: string, active: boolean): Promise<void> {
  await verifyAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("movies")
    .update({ is_active: active })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

