import React, { useState } from "react";
import { ChevronDown, ChevronUp, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "./glass-card";

export interface SourceChunk {
  id: string;
  content: string;
  chunk_index: number;
  similarity: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceChunk[];
}

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const [showSources, setShowSources] = useState(false);
  const isUser = message.role === "user";

  return (
    <div className={cn("flex w-full mb-6", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("flex max-w-[85%] gap-4", isUser ? "flex-row-reverse" : "flex-row")}>
        <div className="flex-shrink-0 mt-1">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-[rgba(79,127,255,0.2)] flex items-center justify-center border border-[rgba(79,127,255,0.4)]">
              <User className="w-4 h-4 text-[rgba(140,180,255,0.90)]" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-[rgba(6,12,28,0.8)] flex items-center justify-center border border-[rgba(100,130,255,0.4)] shadow-[0_0_15px_rgba(100,130,255,0.2)]">
              <Bot className="w-4 h-4 text-[rgba(220,230,255,0.95)]" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div
            className={cn(
              "p-4 rounded-2xl whitespace-pre-wrap leading-relaxed text-[15px]",
              isUser
                ? "bg-[rgba(79,127,255,0.12)] border border-[rgba(79,127,255,0.25)] text-[rgba(220,230,255,0.95)] rounded-tr-sm"
                : "bg-[rgba(6,12,28,0.55)] border border-[rgba(100,130,255,0.18)] text-[rgba(200,210,240,0.90)] rounded-tl-sm backdrop-blur-md shadow-[0_0_30px_rgba(79,127,255,0.05)]"
            )}
          >
            {message.content}
            {isStreaming && <span className="animate-pulse ml-1 text-blue-400">▋</span>}
          </div>

          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="mt-1">
              <button
                onClick={() => setShowSources(!showSources)}
                className="flex items-center gap-1.5 text-xs text-[rgba(100,120,180,0.60)] hover:text-[rgba(140,160,210,0.90)] transition-colors"
              >
                {showSources ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {message.sources.length} sources used
              </button>

              {showSources && (
                <div className="flex flex-col gap-2 mt-3">
                  {message.sources.map((src, i) => (
                    <GlassCard key={i} className="p-3 bg-[rgba(6,12,28,0.4)]">
                      <div className="text-[10px] tracking-wider uppercase text-[rgba(100,120,180,0.50)] mb-1 flex justify-between">
                        <span>Chunk {src.chunk_index}</span>
                        <span className="text-[rgba(100,200,150,0.70)]">
                          {(src.similarity * 100).toFixed(1)}% match
                        </span>
                      </div>
                      <p className="text-xs font-mono text-[rgba(100,120,180,0.80)] line-clamp-3">
                        {src.content}
                      </p>
                    </GlassCard>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
