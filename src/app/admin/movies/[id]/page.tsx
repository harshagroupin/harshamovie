"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTransition } from "@/components/shared/page-transition";
import { ImageUpload } from "@/components/ui/image-upload";
import { getMovieById, updateMovie } from "@/actions/movies";
import { slugify } from "@/lib/utils";
import { GENRES, LANGUAGES, RATINGS } from "@/lib/constants";
import { toast } from "sonner";
import type { Movie } from "@/lib/types";

export default function EditMoviePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({
    title: "", description: "", poster_url: "", banner_url: "",
    trailer_url: "", duration: "120", language: "Hindi", rating: "UA",
    release_date: "", is_featured: false, is_active: true, genre: [] as string[],
  });

  useEffect(() => {
    async function fetchMovie() {
      const movie = await getMovieById(id);
      if (movie) {
        setForm({
          title: movie.title, description: movie.description,
          poster_url: movie.poster_url, banner_url: movie.banner_url,
          trailer_url: movie.trailer_url, duration: String(movie.duration),
          language: movie.language, rating: movie.rating,
          release_date: movie.release_date, is_featured: movie.is_featured,
          is_active: movie.is_active, genre: movie.genre || [],
        });
      }
      setFetching(false);
    }
    fetchMovie();
  }, [id]);

  const updateField = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));
  const toggleGenre = (g: string) => {
    setForm((prev) => ({
      ...prev,
      genre: prev.genre.includes(g) ? prev.genre.filter((x) => x !== g) : [...prev.genre, g],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setLoading(true);
    try {
      await updateMovie(id, { ...form, slug: slugify(form.title), duration: parseInt(form.duration) || 120 });
      toast.success("Movie updated!");
      router.push("/admin/movies");
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    }
    setLoading(false);
  };

  if (fetching) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <PageTransition>
      <div className="max-w-3xl">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="font-display text-2xl font-bold mb-6">Edit Movie</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="bg-surface border-border">
            <CardHeader><CardTitle className="text-base">Basic Info</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2"><Label>Title *</Label><Input value={form.title} onChange={(e) => updateField("title", e.target.value)} /></div>
                <div className="space-y-2 md:col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} rows={4} /></div>
                <div className="space-y-2"><Label>Duration (min)</Label><Input type="number" value={form.duration} onChange={(e) => updateField("duration", e.target.value)} /></div>
                <div className="space-y-2"><Label>Release Date</Label><Input type="date" value={form.release_date} onChange={(e) => updateField("release_date", e.target.value)} /></div>
                <div className="space-y-2"><Label>Language</Label><Select value={form.language} onValueChange={(v) => updateField("language", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Rating</Label><Select value={form.rating} onValueChange={(v) => updateField("rating", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{RATINGS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="space-y-2"><Label>Genres</Label><div className="flex flex-wrap gap-2">{GENRES.map((g) => (<button key={g} type="button" onClick={() => toggleGenre(g)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${form.genre.includes(g) ? "bg-accent/20 border-accent text-accent" : "bg-surface-light border-border text-muted"}`}>{g}</button>))}</div></div>
            </CardContent>
          </Card>

          <Card className="bg-surface border-border">
            <CardHeader><CardTitle className="text-base">Media</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Poster Image</Label>
                  <ImageUpload 
                    value={form.poster_url} 
                    onChange={(url) => updateField("poster_url", url)} 
                    label="Upload Poster"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Banner Image</Label>
                  <ImageUpload 
                    value={form.banner_url} 
                    onChange={(url) => updateField("banner_url", url)} 
                    label="Upload Banner"
                  />
                </div>
              </div>
              <div className="space-y-2 mt-4"><Label>Trailer URL</Label><Input value={form.trailer_url} onChange={(e) => updateField("trailer_url", e.target.value)} /></div>
            </CardContent>
          </Card>

          <Card className="bg-surface border-border">
            <CardHeader><CardTitle className="text-base">Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between"><div><p className="text-sm font-medium">Active</p><p className="text-xs text-muted">Show on public site</p></div><Switch checked={form.is_active} onCheckedChange={(v) => updateField("is_active", v)} /></div>
              <div className="flex items-center justify-between"><div><p className="text-sm font-medium">Featured</p><p className="text-xs text-muted">Show in hero carousel</p></div><Switch checked={form.is_featured} onCheckedChange={(v) => updateField("is_featured", v)} /></div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" size="lg" className="rounded-xl" disabled={loading}>{loading ? "Saving..." : "Update Movie"}</Button>
            <Button type="button" variant="outline" size="lg" className="rounded-xl" onClick={() => router.back()}>Cancel</Button>
          </div>
        </form>
      </div>
    </PageTransition>
  );
}
