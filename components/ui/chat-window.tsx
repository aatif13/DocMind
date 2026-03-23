"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Sparkles, Square, Plus } from "lucide-react";
import { GlassCard } from "./glass-card";
import { GlassButton } from "./glass-button";
import { MessageBubble, Message } from "./message-bubble";
import { Document } from "./doc-sidebar";

interface ChatWindowProps {
  document: Document;
}

export function ChatWindow({ document }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamedResponse]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsLoading(true);
    setStreamedResponse("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input, documentId: document.id }),
      });

      if (!res.ok) throw new Error("Failed to send message");

      const sourcesHeader = res.headers.get("X-Sources");
      const sources = sourcesHeader ? JSON.parse(sourcesHeader) : [];

      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let responseText = "";

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            responseText += chunk;
            setStreamedResponse(responseText);
          }
        }

        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: "assistant", content: responseText, sources },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: "Sorry, an error occurred." },
      ]);
    } finally {
      setIsLoading(false);
      setStreamedResponse("");
    }
  };

  const clearChat = () => setMessages([]);

  return (
    <div className="flex flex-col h-full w-full relative">
      <GlassCard className="flex-shrink-0 p-4 rounded-b-none border-t-0 border-r-0 border-l-0 border-b border-[rgba(100,130,255,0.18)] flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4 w-[60%]">
          <Link href="/dashboard" className="p-2 hover:bg-[rgba(100,130,255,0.1)] rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-[rgba(140,160,210,0.8)]" />
          </Link>
          <div className="flex flex-col truncate">
            <h2 className="text-sm font-medium text-[rgba(220,230,255,0.95)] truncate">{document.name}</h2>
            <span className="text-xs font-mono text-[rgba(100,120,180,0.50)]">{document.chunk_count} chunks</span>
          </div>
        </div>
        <GlassButton variant="secondary" onClick={clearChat} className="h-9 px-3 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New chat</span>
        </GlassButton>
      </GlassCard>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
        <div className="w-full max-w-[720px] mx-auto flex flex-col">
          {messages.length === 0 && !isLoading && !streamedResponse ? (
            <div className="flex flex-col items-center justify-center py-20 translate-y-10 animate-fade-in">
              <Sparkles className="w-12 h-12 text-[rgba(79,127,255,0.4)] mb-6" />
              <h3 className="text-xl font-light text-[rgba(220,230,255,0.95)] mb-8">Ask anything about this document.</h3>
              <div className="flex flex-col gap-3 w-full max-w-sm">
                {["Summarize the main points of this document.", "What are the key takeaways?", "Can you find any dates or deadlines to remember?"].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(suggestion); textareaRef.current?.focus(); }}
                    className="p-3 text-sm text-[rgba(140,160,210,0.80)] bg-[rgba(6,12,28,0.4)] border border-[rgba(100,130,255,0.15)] rounded-xl hover:bg-[rgba(79,127,255,0.1)] hover:border-[rgba(79,127,255,0.3)] transition-all text-left"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {(isLoading || streamedResponse) && (
                <MessageBubble message={{ id: "streaming", role: "assistant", content: streamedResponse }} isStreaming />
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 p-4 md:p-6 w-full max-w-[760px] mx-auto sticky bottom-0 z-20">
        <GlassCard className="p-2 pl-4 flex flex-col focus-within:border-[rgba(79,127,255,0.4)] focus-within:shadow-[0_0_20px_rgba(79,127,255,0.15)] transition-all">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              className="flex-1 bg-transparent border-none text-[rgba(220,230,255,0.95)] focus:ring-0 resize-none py-2 text-[15px] placeholder:text-[rgba(100,120,180,0.50)] min-h-[44px] max-h-[120px]"
              rows={1}
            />
            {isLoading ? (
              <GlassButton variant="secondary" className="h-[44px] w-[44px] p-0 flex items-center justify-center flex-shrink-0">
                <Square className="w-5 h-5 text-[rgba(140,160,210,0.8)] fill-current" />
              </GlassButton>
            ) : (
              <GlassButton
                className="h-[44px] w-[44px] p-0 flex items-center justify-center flex-shrink-0"
                disabled={!input.trim()}
                onClick={handleSend}
              >
                <Send className="w-5 h-5 ml-1" />
              </GlassButton>
            )}
          </div>
          <div className="text-[11px] text-[rgba(100,120,180,0.40)] w-full text-center mt-2 mb-1">
            <kbd className="font-mono bg-[rgba(6,12,28,0.5)] px-1 rounded border border-[rgba(100,130,255,0.1)]">Enter</kbd> to send · <kbd className="font-mono bg-[rgba(6,12,28,0.5)] px-1 rounded border border-[rgba(100,130,255,0.1)]">Shift + Enter</kbd> for new line
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
