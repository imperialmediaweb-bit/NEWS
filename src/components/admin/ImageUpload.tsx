"use client";

import { useState, useRef } from "react";
import { Upload, X, Link as LinkIcon, Loader2 } from "lucide-react";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
}

export default function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"upload" | "url">(value && value.startsWith("http") ? "url" : "upload");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        onChange(data.url);
      } else {
        setError(data.error || "Upload failed");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleUpload(file);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-1">Featured Image</label>

      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`text-xs px-3 py-1 rounded-full transition-colors ${mode === "upload" ? "bg-[var(--accent)] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          <Upload size={12} className="inline mr-1" /> Upload
        </button>
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`text-xs px-3 py-1 rounded-full transition-colors ${mode === "url" ? "bg-[var(--accent)] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          <LinkIcon size={12} className="inline mr-1" /> URL
        </button>
      </div>

      {error && (
        <div className="text-red-500 text-xs mb-2 bg-red-50 p-2 rounded">{error}</div>
      )}

      {mode === "upload" ? (
        <div
          onClick={() => fileRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-[var(--accent)] transition-colors"
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
          />
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">Uploading...</span>
            </div>
          ) : (
            <>
              <Upload size={24} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Click or drag image here</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP, GIF (max 10MB)</p>
            </>
          )}
        </div>
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
        />
      )}

      {value && (
        <div className="mt-3 relative inline-block">
          <img
            src={value}
            alt="Preview"
            className="max-h-[150px] rounded-lg object-cover"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
