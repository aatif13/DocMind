import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2, FileText, CloudRain, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "./glass-card";
import { GlassButton } from "./glass-button";

export interface Document {
  id: string;
  name: string;
  size_bytes: number;
  chunk_count: number;
  status: "processing" | "ready" | "error";
  created_at: string;
}

interface DocSidebarProps {
  user: { name?: string | null; image?: string | null; email?: string | null };
  documents: Document[];
  onSignOut: () => void;
  onDeleteDoc: (id: string) => void;
  activeDocId?: string;
}

export function DocSidebar({
  user,
  documents,
  onSignOut,
  onDeleteDoc,
  activeDocId,
}: DocSidebarProps) {
  function formatBytes(bytes: number) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
  }

  return (
    <GlassCard className="flex flex-col h-full w-[280px] rounded-r-2xl rounded-l-none border-l-0">
      <div className="p-4 border-b border-[rgba(100,130,255,0.18)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          {user?.image ? (
            <Image
              src={user.image}
              alt="Avatar"
              width={32}
              height={32}
              className="rounded-full border border-[rgba(100,130,255,0.4)]"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[rgba(100,130,255,0.2)]" />
          )}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-[rgba(220,230,255,0.95)] truncate w-32">
              {user?.name || "User"}
            </span>
            <button
              onClick={onSignOut}
              className="text-xs text-[rgba(100,120,180,0.60)] hover:text-[rgba(255,120,120,0.90)] transition-colors text-left"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="text-xs tracking-widest uppercase text-[rgba(100,120,180,0.50)] mb-4">
          Your Documents
        </div>

        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center text-[rgba(100,120,180,0.50)]">
            <CloudRain className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No documents yet.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {documents.map((doc) => (
              <Link key={doc.id} href={`/chat/${doc.id}`}>
                <div
                  className={cn(
                    "group flex flex-col p-2.5 rounded-xl cursor-pointer transition-colors relative",
                    activeDocId === doc.id
                      ? "bg-[rgba(79,127,255,0.15)]"
                      : "hover:bg-[rgba(79,127,255,0.08)]"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-4 h-4 flex-shrink-0 text-[rgba(140,160,210,0.70)]" />
                      <span className="text-sm text-[rgba(220,230,255,0.95)] truncate">
                        {doc.name}
                      </span>
                    </div>
                    {doc.status === "processing" ? (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse mt-1" title="Processing" />
                    ) : doc.status === "ready" ? (
                      <span className="w-2 h-2 rounded-full bg-green-400 mt-1" title="Ready" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-red-400 mt-1" title="Error" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 ml-6">
                    <span className="text-xs font-mono text-[rgba(100,200,150,0.80)]">
                      {formatBytes(doc.size_bytes)}
                    </span>
                    <span className="text-xs text-[rgba(100,120,180,0.50)]">
                      {formatDate(doc.created_at)}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (confirm("Delete document?")) onDeleteDoc(doc.id);
                    }}
                    className="absolute right-2 top-2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-[rgba(255,80,80,0.15)] rounded-md transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-[rgba(255,120,120,0.80)]" />
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[rgba(100,130,255,0.18)]">
        <Link href="/dashboard" className="w-full">
          <GlassButton className="w-full flex items-center justify-center gap-2">
            <UploadCloud className="w-4 h-4" />
            Upload PDF
          </GlassButton>
        </Link>
      </div>
    </GlassCard>
  );
}
