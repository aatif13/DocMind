import React from "react";
import { cn } from "@/lib/utils";

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "destructive" | "secondary";
}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:bg-opacity-15",
          variant === "primary" &&
            "px-6 py-2.5 rounded-xl text-sm font-medium tracking-wide bg-[rgba(79,127,255,0.15)] border border-[rgba(79,127,255,0.35)] text-[rgba(140,180,255,0.90)] hover:bg-[rgba(79,127,255,0.25)] hover:border-[rgba(79,127,255,0.60)] hover:shadow-[0_0_20px_rgba(79,127,255,0.20)]",
          variant === "secondary" &&
            "px-4 py-2 rounded-xl text-sm font-medium tracking-wide bg-transparent border border-[rgba(100,130,255,0.18)] text-[rgba(140,160,210,0.80)] hover:bg-[rgba(100,130,255,0.10)] hover:text-white hover:border-[rgba(100,130,255,0.38)]",
          variant === "destructive" &&
            "px-4 py-2 rounded-lg text-xs tracking-widest uppercase border border-[rgba(255,80,80,0.20)] text-[rgba(255,120,120,0.60)] hover:border-[rgba(255,80,80,0.40)] hover:text-[rgba(255,120,120,0.90)]",
          className
        )}
        {...props}
      />
    );
  }
);
GlassButton.displayName = "GlassButton";
