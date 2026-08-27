"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, RefreshCw } from "lucide-react";
import { uploadImage } from "@/lib/adminApi";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  aspect?: "square" | "16/9" | "4/3";
  size?: "sm" | "md" | "full";
  /** Short, low-height variant (single-line placeholder, no format/size subtitle, smaller icon)
   * for tight inline contexts like a payment-row field, where the standard dropzone reads too tall. */
  compact?: boolean;
}

const aspectMap = {
  square: "aspect-square",
  "16/9": "aspect-video",
  "4/3": "aspect-[4/3]",
};

const sizeMap = {
  sm: "max-w-[200px]",
  md: "max-w-xs",
  full: "",
};

const ALLOWED_TYPES = ["image/png", "image/jpeg"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

/** Longest edge after client-side downscaling — admin images render at card/banner sizes, so
 * anything beyond this is upload time and bandwidth for pixels nobody sees. */
const MAX_DIMENSION = 1600;
/** Files at or below this skip compression entirely — not worth the canvas round trip. */
const COMPRESS_THRESHOLD_BYTES = 400 * 1024;

/**
 * Downscales/re-encodes the image in the browser before upload (JPEG stays JPEG at q0.82,
 * PNG stays PNG so transparency survives). Falls back to the original file whenever anything
 * fails or the "compressed" result isn't actually smaller — so worst case is exactly the old
 * behaviour.
 */
async function compressImage(file: File): Promise<File> {
  if (file.size <= COMPRESS_THRESHOLD_BYTES) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, file.type, file.type === "image/jpeg" ? 0.82 : undefined),
    );
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name, { type: file.type });
  } catch {
    return file;
  }
}

export default function ImageUpload({
  value,
  onChange,
  label = "Upload image",
  aspect = "16/9",
  size = "full",
  compact = false,
}: ImageUploadProps) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handle = async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only PNG or JPG images are supported");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("Image must be 5 MB or smaller");
      return;
    }
    setError("");
    setUploading(true);
    const compressed = await compressImage(file);
    const res = await uploadImage(compressed);
    setUploading(false);
    if (res.success) onChange(res.data.url);
  };

  return (
    <div className={sizeMap[size]}>
      <div
        className={`relative w-full ${compact ? "h-9" : aspectMap[aspect]} rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 overflow-hidden flex items-center justify-center text-slate-500 hover:border-blue-400 transition-colors`}
      >
        {value ? (
          <>
            <Image
              src={value}
              alt="preview"
              fill
              sizes="400px"
              className="object-cover"
              unoptimized
            />
            <div className={`absolute z-10 flex items-center gap-1.5 ${compact ? "top-1 right-1" : "top-2 right-2"}`}>
              <button
                type="button"
                onClick={() => ref.current?.click()}
                className={`rounded-full bg-white/90 text-slate-700 shadow-md flex items-center justify-center hover:bg-white ${compact ? "w-5 h-5" : "w-7 h-7"}`}
                aria-label="Replace image"
                title="Replace"
              >
                <RefreshCw className={compact ? "w-2.5 h-2.5" : "w-3.5 h-3.5"} />
              </button>
              <button
                type="button"
                onClick={() => onChange("")}
                className={`rounded-full bg-white/90 text-slate-700 shadow-md flex items-center justify-center hover:bg-white ${compact ? "w-5 h-5" : "w-7 h-7"}`}
                aria-label="Remove image"
                title="Remove"
              >
                <X className={compact ? "w-3 h-3" : "w-4 h-4"} />
              </button>
            </div>
          </>
        ) : compact ? (
          <button
            type="button"
            onClick={() => ref.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            {uploading ? "Uploading…" : label}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => ref.current?.click()}
            className="flex flex-col items-center gap-2 px-4 py-6 text-xs font-medium"
          >
            <Upload className="w-6 h-6 text-slate-400" />
            {uploading ? "Uploading…" : label}
            <span className="text-[10px] text-slate-400">PNG, JPG up to 5 MB</span>
          </button>
        )}
        <input
          ref={ref}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handle(f);
            e.target.value = "";
          }}
        />
      </div>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
