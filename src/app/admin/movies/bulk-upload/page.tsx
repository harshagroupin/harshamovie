"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Upload, FileSpreadsheet, CheckCircle2, XCircle,
  AlertTriangle, Download, Trash2, Loader2, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTransition } from "@/components/shared/page-transition";
import { bulkUploadMoviesAndShowtimes } from "@/actions/bulk-upload";
import { toast } from "sonner";

// Dynamic import xlsx to avoid SSR issues
async function parseExcelFile(file: File) {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  const movieSheet = workbook.SheetNames[0];
  const showtimeSheet = workbook.SheetNames[1];

  const movies: Record<string, unknown>[] = movieSheet
    ? JSON.parse(JSON.stringify(XLSX.utils.sheet_to_json(workbook.Sheets[movieSheet])))
    : [];

  const showtimes: Record<string, unknown>[] = showtimeSheet
    ? JSON.parse(JSON.stringify(XLSX.utils.sheet_to_json(workbook.Sheets[showtimeSheet])))
    : [];

  return { movies, showtimes };
}

async function generateTemplate() {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  // Sheet 1: Movies
  const movieHeaders = [
    "title", "description", "language", "rating", "duration",
    "release_date", "genre", "poster_url", "banner_url",
    "trailer_url", "is_featured", "is_active"
  ];
  const movieSample = [
    "Pushpa 3", "Pushpa returns in this action packed sequel",
    "Hindi", "UA", 165, "2026-07-15",
    "Action, Drama, Thriller", "", "", "", "false", "true"
  ];
  const movieData = [movieHeaders, movieSample];
  const movieWs = XLSX.utils.aoa_to_sheet(movieData);
  // Set column widths
  movieWs["!cols"] = movieHeaders.map((h) => ({ wch: Math.max(h.length + 4, 18) }));
  XLSX.utils.book_append_sheet(wb, movieWs, "Movies");

  // Sheet 2: Showtimes
  const stHeaders = [
    "movie_title", "screen_name", "show_date", "show_time",
    "price_premium", "price_gold", "price_recliner"
  ];
  const stSample = ["Pushpa 3", "Audi 1", "2026-07-15", "14:30", 200, 300, 450];
  const stData = [stHeaders, stSample];
  const stWs = XLSX.utils.aoa_to_sheet(stData);
  stWs["!cols"] = stHeaders.map((h) => ({ wch: Math.max(h.length + 4, 16) }));
  XLSX.utils.book_append_sheet(wb, stWs, "Showtimes");

  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bulk_upload_template.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}

interface ParsedData {
  movies: Record<string, unknown>[];
  showtimes: Record<string, unknown>[];
}

type UploadResult = Awaited<ReturnType<typeof bulkUploadMoviesAndShowtimes>>;

export default function BulkUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedData | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error("Please upload a valid Excel file (.xlsx or .xls)");
      return;
    }
    setFileName(file.name);
    setResult(null);
    try {
      const data = await parseExcelFile(file);
      setParsed(data);
      toast.success(`Parsed ${data.movies.length} movies and ${data.showtimes.length} showtimes`);
    } catch (err) {
      toast.error("Failed to parse Excel file. Please check the format.");
      console.error(err);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleUpload = async () => {
    if (!parsed) return;
    setUploading(true);
    try {
      const res = await bulkUploadMoviesAndShowtimes(parsed.movies, parsed.showtimes);
      setResult(res);
      if (res.moviesCreated > 0 || res.showtimesCreated > 0) {
        toast.success(`Created ${res.moviesCreated} movies and ${res.showtimesCreated} showtimes!`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
    setUploading(false);
  };

  const handleClear = () => {
    setParsed(null);
    setFileName(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <PageTransition>
      <div className="max-w-4xl">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Movies
        </button>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold">Bulk Upload</h1>
            <p className="text-sm text-muted mt-1">Upload movies and showtimes from an Excel file</p>
          </div>
          <Button
            variant="outline"
            onClick={generateTemplate}
            className="gap-2 rounded-xl"
          >
            <Download className="w-4 h-4" /> Download Template
          </Button>
        </div>

        {/* Instructions */}
        <Card className="bg-surface border-border mb-6">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-[#0B70D5] shrink-0 mt-0.5" />
              <div className="text-sm text-muted space-y-1.5">
                <p><strong className="text-foreground">Sheet 1 (Movies):</strong> title, description, language, rating, duration, release_date, genre (comma-separated), poster_url, banner_url, trailer_url, is_featured, is_active</p>
                <p><strong className="text-foreground">Sheet 2 (Showtimes):</strong> movie_title, screen_name, show_date, show_time, price_premium, price_gold, price_recliner</p>
                <p className="text-xs text-[#8E8E93]">Required fields: <strong>title, language, duration, release_date</strong> for movies. <strong>movie_title, screen_name, show_date, show_time, prices</strong> for showtimes. Missing optional fields are ignored.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Zone */}
        {!parsed && (
          <Card className="bg-surface border-border mb-6">
            <CardContent className="p-0">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center py-16 px-6 rounded-xl cursor-pointer transition-all border-2 border-dashed ${
                  dragOver
                    ? "border-[#0B70D5] bg-[#E2F1FE]/30"
                    : "border-[#D0D0D4] hover:border-[#0B70D5]/50 hover:bg-[#F8F9FA]"
                }`}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                  dragOver ? "bg-[#0B70D5]/10" : "bg-[#F3F4F6]"
                }`}>
                  <Upload className={`w-8 h-8 ${dragOver ? "text-[#0B70D5]" : "text-[#9CA3AF]"}`} />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  Drop your Excel file here or click to browse
                </p>
                <p className="text-xs text-muted mt-1.5">.xlsx or .xls files only</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview */}
        <AnimatePresence>
          {parsed && !result && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              {/* File info */}
              <Card className="bg-surface border-border mb-6">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{fileName}</p>
                      <p className="text-xs text-muted">{parsed.movies.length} movies · {parsed.showtimes.length} showtimes</p>
                    </div>
                  </div>
                  <button onClick={handleClear} className="p-2 rounded-lg hover:bg-[#F5F5F6] text-muted hover:text-foreground transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </CardContent>
              </Card>

              {/* Movies Preview Table */}
              {parsed.movies.length > 0 && (
                <Card className="bg-surface border-border mb-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#E2F1FE] text-[#0B70D5] text-xs flex items-center justify-center font-bold">{parsed.movies.length}</span>
                      Movies to import
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-[#E8E8EA]">
                            <th className="px-4 py-2.5 text-left font-semibold text-[#8E8E93]">#</th>
                            <th className="px-4 py-2.5 text-left font-semibold text-[#8E8E93]">Title</th>
                            <th className="px-4 py-2.5 text-left font-semibold text-[#8E8E93]">Language</th>
                            <th className="px-4 py-2.5 text-left font-semibold text-[#8E8E93]">Duration</th>
                            <th className="px-4 py-2.5 text-left font-semibold text-[#8E8E93]">Release Date</th>
                            <th className="px-4 py-2.5 text-left font-semibold text-[#8E8E93]">Genre</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsed.movies.slice(0, 20).map((m, i) => (
                            <tr key={i} className="border-b border-[#F0F0F2] last:border-0">
                              <td className="px-4 py-2.5 text-[#8E8E93]">{i + 1}</td>
                              <td className="px-4 py-2.5 font-medium text-foreground">{String(m.title || "—")}</td>
                              <td className="px-4 py-2.5 text-muted">{String(m.language || "—")}</td>
                              <td className="px-4 py-2.5 text-muted">{String(m.duration || "—")} min</td>
                              <td className="px-4 py-2.5 text-muted">{String(m.release_date || "—")}</td>
                              <td className="px-4 py-2.5 text-muted truncate max-w-[150px]">{String(m.genre || "—")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {parsed.movies.length > 20 && (
                        <p className="text-xs text-muted text-center py-3">...and {parsed.movies.length - 20} more</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Showtimes Preview Table */}
              {parsed.showtimes.length > 0 && (
                <Card className="bg-surface border-border mb-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#FFF3E0] text-[#F57C00] text-xs flex items-center justify-center font-bold">{parsed.showtimes.length}</span>
                      Showtimes to import
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-[#E8E8EA]">
                            <th className="px-4 py-2.5 text-left font-semibold text-[#8E8E93]">#</th>
                            <th className="px-4 py-2.5 text-left font-semibold text-[#8E8E93]">Movie</th>
                            <th className="px-4 py-2.5 text-left font-semibold text-[#8E8E93]">Screen</th>
                            <th className="px-4 py-2.5 text-left font-semibold text-[#8E8E93]">Date</th>
                            <th className="px-4 py-2.5 text-left font-semibold text-[#8E8E93]">Time</th>
                            <th className="px-4 py-2.5 text-left font-semibold text-[#8E8E93]">Premium</th>
                            <th className="px-4 py-2.5 text-left font-semibold text-[#8E8E93]">Gold</th>
                            <th className="px-4 py-2.5 text-left font-semibold text-[#8E8E93]">Recliner</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsed.showtimes.slice(0, 20).map((s, i) => (
                            <tr key={i} className="border-b border-[#F0F0F2] last:border-0">
                              <td className="px-4 py-2.5 text-[#8E8E93]">{i + 1}</td>
                              <td className="px-4 py-2.5 font-medium text-foreground">{String(s.movie_title || "—")}</td>
                              <td className="px-4 py-2.5 text-muted">{String(s.screen_name || "—")}</td>
                              <td className="px-4 py-2.5 text-muted">{String(s.show_date || "—")}</td>
                              <td className="px-4 py-2.5 text-muted">{String(s.show_time || "—")}</td>
                              <td className="px-4 py-2.5 text-muted">₹{String(s.price_premium || "—")}</td>
                              <td className="px-4 py-2.5 text-muted">₹{String(s.price_gold || "—")}</td>
                              <td className="px-4 py-2.5 text-muted">₹{String(s.price_recliner || "—")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {parsed.showtimes.length > 20 && (
                        <p className="text-xs text-muted text-center py-3">...and {parsed.showtimes.length - 20} more</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  size="lg"
                  className="rounded-xl gap-2"
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" /> Upload All
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-xl"
                  onClick={handleClear}
                  disabled={uploading}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-emerald-700">{result.moviesCreated}</p>
                  <p className="text-xs text-emerald-600 font-medium">Movies Created</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-emerald-700">{result.showtimesCreated}</p>
                  <p className="text-xs text-emerald-600 font-medium">Showtimes Created</p>
                </div>
                {result.moviesSkipped.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                    <AlertTriangle className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-amber-700">{result.moviesSkipped.length}</p>
                    <p className="text-xs text-amber-600 font-medium">Movies Skipped</p>
                  </div>
                )}
                {result.showtimesSkipped.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                    <AlertTriangle className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-amber-700">{result.showtimesSkipped.length}</p>
                    <p className="text-xs text-amber-600 font-medium">Showtimes Skipped</p>
                  </div>
                )}
              </div>

              {/* Skipped rows detail */}
              {result.moviesSkipped.length > 0 && (
                <Card className="bg-surface border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-amber-700 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Skipped Movies
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-[#E8E8EA]">
                            <th className="px-4 py-2 text-left font-semibold text-[#8E8E93]">Row</th>
                            <th className="px-4 py-2 text-left font-semibold text-[#8E8E93]">Title</th>
                            <th className="px-4 py-2 text-left font-semibold text-[#8E8E93]">Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.moviesSkipped.map((s, i) => (
                            <tr key={i} className="border-b border-[#F0F0F2] last:border-0">
                              <td className="px-4 py-2">{s.row}</td>
                              <td className="px-4 py-2 font-medium">{s.title}</td>
                              <td className="px-4 py-2 text-amber-600">{s.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {result.showtimesSkipped.length > 0 && (
                <Card className="bg-surface border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-amber-700 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Skipped Showtimes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-[#E8E8EA]">
                            <th className="px-4 py-2 text-left font-semibold text-[#8E8E93]">Row</th>
                            <th className="px-4 py-2 text-left font-semibold text-[#8E8E93]">Movie</th>
                            <th className="px-4 py-2 text-left font-semibold text-[#8E8E93]">Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.showtimesSkipped.map((s, i) => (
                            <tr key={i} className="border-b border-[#F0F0F2] last:border-0">
                              <td className="px-4 py-2">{s.row}</td>
                              <td className="px-4 py-2 font-medium">{s.title}</td>
                              <td className="px-4 py-2 text-amber-600">{s.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions after result */}
              <div className="flex gap-3 pt-2">
                <Button className="rounded-xl gap-2" onClick={() => router.push("/admin/movies")}>
                  Go to Movies
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={handleClear}>
                  Upload Another File
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
