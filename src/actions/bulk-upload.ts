"use server";

import { createAdminClient, verifyAdmin } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";

interface BulkMovieRow {
  title: string;
  description?: string;
  language: string;
  rating?: string;
  duration: number;
  release_date: string;
  genre?: string;
  poster_url?: string;
  banner_url?: string;
  trailer_url?: string;
  is_featured?: boolean;
  is_active?: boolean;
}

interface BulkShowtimeRow {
  movie_title: string;
  screen_name: string;
  show_date: string;
  show_time: string;
  price_premium: number;
  price_gold: number;
  price_recliner: number;
}

interface BulkUploadResult {
  moviesCreated: number;
  moviesSkipped: { row: number; title: string; reason: string }[];
  showtimesCreated: number;
  showtimesSkipped: { row: number; title: string; reason: string }[];
}

function parseDate(val: string | number | undefined): string | null {
  if (!val) return null;
  
  // If it's a number (Excel serial date)
  if (typeof val === "number") {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + val * 86400000);
    return date.toISOString().split("T")[0];
  }

  const str = String(val).trim();
  
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  
  // DD/MM/YYYY or DD-MM-YYYY
  const match = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match) {
    const [, d, m, y] = match;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // MM/DD/YYYY 
  const match2 = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match2) {
    return str; // already handled above
  }

  // Try native Date parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split("T")[0];
  
  return null;
}

function parseTime(val: string | number | undefined): string | null {
  if (!val) return null;
  
  // Excel time (decimal, e.g. 0.75 = 18:00)
  if (typeof val === "number") {
    const totalMinutes = Math.round(val * 24 * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  const str = String(val).trim();
  // HH:MM or H:MM
  if (/^\d{1,2}:\d{2}$/.test(str)) return str;
  // HH:MM:SS
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(str)) return str.slice(0, 5);
  
  return null;
}

function parseBool(val: unknown): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val === 1;
  const str = String(val || "").toLowerCase().trim();
  return str === "true" || str === "yes" || str === "1";
}

export async function bulkUploadMoviesAndShowtimes(
  movies: Record<string, unknown>[],
  showtimes: Record<string, unknown>[]
): Promise<BulkUploadResult> {
  await verifyAdmin();
  const supabase = createAdminClient();

  const result: BulkUploadResult = {
    moviesCreated: 0,
    moviesSkipped: [],
    showtimesCreated: 0,
    showtimesSkipped: [],
  };

  // Title → movie ID map (for showtime linking)
  const titleToId: Record<string, string> = {};

  // ─── Process Movies ──────────────────────────────────────
  for (let i = 0; i < movies.length; i++) {
    const raw = movies[i];
    const rowNum = i + 2; // Excel row (1=header, 2=first data)
    
    const title = String(raw.title || "").trim();
    const duration = parseInt(String(raw.duration || "0"));
    const releaseDate = parseDate(raw.release_date as string | number);
    const language = String(raw.language || "").trim();

    // Validate required fields
    if (!title) {
      result.moviesSkipped.push({ row: rowNum, title: title || "(empty)", reason: "Title is missing" });
      continue;
    }
    if (!duration || duration <= 0) {
      result.moviesSkipped.push({ row: rowNum, title, reason: "Duration is missing or invalid" });
      continue;
    }
    if (!releaseDate) {
      result.moviesSkipped.push({ row: rowNum, title, reason: "Release date is missing or invalid" });
      continue;
    }
    if (!language) {
      result.moviesSkipped.push({ row: rowNum, title, reason: "Language is missing" });
      continue;
    }

    // Check for duplicate title in DB
    const slug = slugify(title);
    const { data: existing } = await supabase
      .from("movies")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      titleToId[title.toLowerCase()] = existing.id;
      result.moviesSkipped.push({ row: rowNum, title, reason: "Movie already exists" });
      continue;
    }

    // Parse optional fields
    const genreStr = String(raw.genre || "").trim();
    const genre = genreStr ? genreStr.split(",").map(g => g.trim()).filter(Boolean) : [];

    const movieData = {
      title,
      slug,
      description: String(raw.description || "").trim(),
      language,
      rating: String(raw.rating || "UA").trim(),
      duration,
      release_date: releaseDate,
      genre,
      poster_url: String(raw.poster_url || "").trim(),
      banner_url: String(raw.banner_url || "").trim(),
      trailer_url: String(raw.trailer_url || "").trim(),
      is_featured: parseBool(raw.is_featured),
      is_active: raw.is_active !== undefined ? parseBool(raw.is_active) : true,
    };

    const { data, error } = await supabase
      .from("movies")
      .insert([movieData])
      .select("id")
      .single();

    if (error) {
      result.moviesSkipped.push({ row: rowNum, title, reason: error.message });
    } else {
      result.moviesCreated++;
      titleToId[title.toLowerCase()] = data.id;
    }
  }

  // ─── Process Showtimes ───────────────────────────────────
  // Also fetch existing movies for title matching
  const { data: allMovies } = await supabase.from("movies").select("id, title");
  if (allMovies) {
    for (const m of allMovies) {
      if (!titleToId[m.title.toLowerCase()]) {
        titleToId[m.title.toLowerCase()] = m.id;
      }
    }
  }

  // Seat counts per screen (from seat-layouts or defaults)
  const SCREEN_SEATS: Record<string, { total: number; premium: number; gold: number; recliner: number }> = {
    "Audi 1": { total: 120, premium: 48, gold: 48, recliner: 24 },
    "Audi 2": { total: 120, premium: 48, gold: 48, recliner: 24 },
    "Audi 3": { total: 120, premium: 48, gold: 48, recliner: 24 },
  };

  for (let i = 0; i < showtimes.length; i++) {
    const raw = showtimes[i];
    const rowNum = i + 2;

    const movieTitle = String(raw.movie_title || "").trim();
    const screenName = String(raw.screen_name || "").trim();
    const showDate = parseDate(raw.show_date as string | number);
    const showTime = parseTime(raw.show_time as string | number);
    const pricePremium = parseFloat(String(raw.price_premium || "0"));
    const priceGold = parseFloat(String(raw.price_gold || "0"));
    const priceRecliner = parseFloat(String(raw.price_recliner || "0"));

    if (!movieTitle) {
      result.showtimesSkipped.push({ row: rowNum, title: movieTitle || "(empty)", reason: "Movie title is missing" });
      continue;
    }
    if (!screenName) {
      result.showtimesSkipped.push({ row: rowNum, title: movieTitle, reason: "Screen name is missing" });
      continue;
    }
    if (!showDate) {
      result.showtimesSkipped.push({ row: rowNum, title: movieTitle, reason: "Show date is missing or invalid" });
      continue;
    }
    if (!showTime) {
      result.showtimesSkipped.push({ row: rowNum, title: movieTitle, reason: "Show time is missing or invalid" });
      continue;
    }
    if (pricePremium <= 0 && priceGold <= 0 && priceRecliner <= 0) {
      result.showtimesSkipped.push({ row: rowNum, title: movieTitle, reason: "At least one price must be set" });
      continue;
    }

    const movieId = titleToId[movieTitle.toLowerCase()];
    if (!movieId) {
      result.showtimesSkipped.push({ row: rowNum, title: movieTitle, reason: `Movie "${movieTitle}" not found` });
      continue;
    }

    const seats = SCREEN_SEATS[screenName] || SCREEN_SEATS["Audi 1"];

    const showtimeData = {
      movie_id: movieId,
      screen_name: screenName,
      show_date: showDate,
      show_time: showTime,
      price: Math.min(pricePremium || 9999, priceGold || 9999, priceRecliner || 9999),
      price_premium: pricePremium,
      price_gold: priceGold,
      price_recliner: priceRecliner,
      total_seats: seats.total,
      seats_premium: seats.premium,
      seats_gold: seats.gold,
      seats_recliner: seats.recliner,
      booked_seats: [],
    };

    const { error } = await supabase
      .from("showtimes")
      .insert([showtimeData]);

    if (error) {
      result.showtimesSkipped.push({ row: rowNum, title: movieTitle, reason: error.message });
    } else {
      result.showtimesCreated++;
    }
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/movies");
  revalidatePath("/admin/showtimes");

  return result;
}
