"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { uploadImage } from "@/lib/adminApi";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  aspect?: "square" | "16/9" | "4/3";
}

const aspectMap = {
  square: "aspect-square",
  "16/9": "aspect-video",
  "4/3": "aspect-[4/3]",
};

export default function ImageUpload({
  value,
  onChange,
  label = "Upload image",
  aspect = "16/9",
}: ImageUploadProps) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handle = async (file: File) => {
    setUploading(true);
    const res = await uploadImage(file);
    setUploading(false);
    if (res.success) onChange(res.data.url);
  };

  return (
    <div
      className={`relative w-full ${aspectMap[aspect]} rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 overflow-hidden flex items-center justify-center text-slate-500 hover:border-blue-400 transition-colors`}
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
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 text-slate-700 shadow-md flex items-center justify-center hover:bg-white"
            aria-label="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </>
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
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handle(f);
        }}
      />
    </div>
  );
}
