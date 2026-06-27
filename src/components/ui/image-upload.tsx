"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "./button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Image from "next/image";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
  label?: string;
  aspectRatio?: string; // e.g. "aspect-[2/3]" or "aspect-[3/1]"
  widthClass?: string;  // e.g. "max-w-[200px]" or "max-w-[400px] w-full"
}

export function ImageUpload({ 
  value, 
  onChange, 
  bucket = "movies", 
  label = "Upload Image",
  aspectRatio = "aspect-[2/3]",
  widthClass = "max-w-[200px]"
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type and size
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploading(true);
    const supabase = createClient();

    try {
      // Create a unique file name
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onChange(publicUrl);
      toast.success("Image uploaded successfully!");
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "Failed to upload image. Make sure the storage bucket exists and is public.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    onChange("");
  };

  return (
    <div className="space-y-4 w-full">
      {value ? (
        <div className={`relative ${widthClass} ${aspectRatio} rounded-xl overflow-hidden border border-border group bg-surface-secondary`}>
          <Image src={value} alt="Uploaded" fill className="object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={handleRemove}
              className="w-8 h-8 rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`relative ${widthClass} ${aspectRatio} rounded-xl border-2 border-dashed border-border bg-surface-secondary hover:bg-surface-hover hover:border-accent transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer p-4`}
        >
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-muted animate-spin" />
              <span className="text-xs text-muted font-medium">Uploading...</span>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-surface shadow-sm border border-border flex items-center justify-center">
                <Upload className="w-5 h-5 text-muted" />
              </div>
              <div className="text-center">
                <span className="text-sm font-medium text-foreground block">{label}</span>
                <span className="text-xs text-muted">Click to browse (Max 5MB)</span>
              </div>
            </>
          )}
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        accept="image/*"
        className="hidden"
      />
      
      {/* Fallback to direct URL input if needed */}
      <div className="flex items-center gap-2 mt-2 max-w-[400px]">
        <span className="text-xs text-[#8E8E93] whitespace-nowrap">Or URL:</span>
        <input 
          type="text" 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-[#E8E8EA] rounded-lg text-[#131316] outline-none focus:border-[#0B70D5] focus:ring-1 focus:ring-[#0B70D5]/20 transition-all"
        />
      </div>
    </div>
  );
}
