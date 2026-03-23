import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function GlassCard({ className, children, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl bg-[rgba(6,12,28,0.55)] border border-[rgba(100,130,255,0.18)] backdrop-blur-xl shadow-[0_0_40px_rgba(79,127,255,0.08)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
