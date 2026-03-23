"use client";
import React, { useState, useCallback } from "react";
import { UploadCloud, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "./glass-card";

interface UploadZoneProps {
  onUploadStart: (file: File) => void;
  status: "idle" | "parsing" | "chunking" | "embedding" | "ready";
  progress?: number;
}

export function UploadZone({ onUploadStart, status, progress = 0 }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      setError(null);
      const file = e.dataTransfer.files[0];
      handleFileSelection(file);
    },
    [onUploadStart]
  );

  const handleFileSelection = (file: File | undefined) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Only PDF files are accepted.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("File exceeds 20MB limit.");
      return;
    }
    onUploadStart(file);
  };

  const statusMap = {
    idle: "Drop PDF here",
    parsing: "Parsing PDF...",
    chunking: "Chunking text...",
    embedding: "Generating embeddings...",
    ready: "Ready",
  };

  return (
    <GlassCard
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={onDrop}
      className={cn(
        "flex flex-col items-center justify-center border-dashed p-12 w-full max-w-xl transition-all",
        isDragOver
          ? "border-[rgba(79,127,255,0.60)] shadow-[0_0_30px_rgba(79,127,255,0.2)] animate-pulse"
          : "border-[rgba(100,130,255,0.25)]"
      )}
    >
      {status === "idle" ? (
        <>
          <UploadCloud className="w-12 h-12 text-[rgba(79,127,255,0.6)] mb-4" />
          <h3 className="text-xl font-light tracking-widest text-[rgba(220,230,255,0.95)] uppercase mb-2">
            Drop PDF here
          </h3>
          <p className="text-sm text-[rgba(140,160,210,0.70)] mb-6">or click to browse</p>
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            id="file-upload"
            onChange={(e) => {
              setError(null);
              handleFileSelection(e.target.files?.[0]);
            }}
          />
          <label
            htmlFor="file-upload"
            className="px-6 py-2.5 rounded-xl text-sm font-medium tracking-wide bg-[rgba(79,127,255,0.15)] border border-[rgba(79,127,255,0.35)] text-[rgba(140,180,255,0.90)] hover:bg-[rgba(79,127,255,0.25)] hover:border-[rgba(79,127,255,0.60)] transition-all duration-200 cursor-pointer"
          >
            Browse Files
          </label>
        </>
      ) : (
        <div className="w-full flex flex-col items-center py-6">
          <FileText className="w-12 h-12 text-[rgba(79,127,255,0.8)] mb-4 animate-pulse" />
          <h3 className="text-lg font-light tracking-wide text-[rgba(220,230,255,0.95)] mb-6">
            {statusMap[status]}
          </h3>
          <div className="w-full bg-[rgba(6,12,28,0.8)] h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 shadow-[0_0_10px_rgba(79,127,255,0.8)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      {error && <p className="mt-4 text-sm text-[rgba(255,120,120,0.80)]">{error}</p>}
    </GlassCard>
  );
}
