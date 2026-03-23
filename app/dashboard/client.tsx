"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { signOut } from "next-auth/react";
import { DocSidebar, Document } from "@/components/ui/doc-sidebar";
import { UploadZone } from "@/components/ui/upload-zone";
import { GlassCard } from "@/components/ui/glass-card";

export default function DashboardClient({ user, initialDocuments }: { user: any; initialDocuments: Document[] }) {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "parsing" | "chunking" | "embedding" | "ready">("idle");
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadStart = async (file: File) => {
    setUploadStatus("parsing");
    setUploadProgress(10);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Fake progress steps while upload happens
      const progressInterval = setInterval(() => {
        setUploadProgress((p) => {
          if (p < 40) return p + 5;
          if (p < 70) {
            setUploadStatus("chunking");
            return p + 2;
          }
          if (p < 90) {
            setUploadStatus("embedding");
            return p + 1;
          }
          return p;
        });
      }, 500);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      
      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const newDoc = await res.json();
      setUploadProgress(100);
      setUploadStatus("ready");
      
      setTimeout(() => {
        setUploadStatus("idle");
        setUploadProgress(0);
        router.push(`/chat/${newDoc.documentId}`);
      }, 1000);

    } catch (err) {
      console.error(err);
      setUploadStatus("idle");
      setUploadProgress(0);
      alert("Failed to process document");
    }
  };

  return (
    <>
      <DocSidebar
        user={user}
        documents={documents}
        onSignOut={handleSignOut}
        onDeleteDoc={handleDelete}
      />
      
      <div className="flex-1 h-full flex items-center justify-center p-4">
        <GlassCard className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
          {uploadStatus !== "idle" ? (
            <UploadZone status={uploadStatus} progress={uploadProgress} onUploadStart={() => {}} />
          ) : documents.length === 0 ? (
            <UploadZone status={uploadStatus} progress={uploadProgress} onUploadStart={handleUploadStart} />
          ) : (
            <div className="flex flex-col items-center text-center max-w-md animate-fade-in">
              <FileText className="w-16 h-16 text-[rgba(79,127,255,0.4)] mb-6" />
              <h2 className="text-2xl font-light tracking-wide text-[rgba(220,230,255,0.95)] mb-3">
                Select a document to begin
              </h2>
              <p className="text-[rgba(140,160,210,0.70)] mb-8">
                Choose a document from the sidebar to start asking questions, or upload a new one.
              </p>
              <UploadZone status={uploadStatus} progress={uploadProgress} onUploadStart={handleUploadStart} />
            </div>
          )}
        </GlassCard>
      </div>
    </>
  );
}
