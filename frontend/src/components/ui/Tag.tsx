import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { TONE_CLASS, type Tone } from "@/lib/status";

interface TagProps {
  tone?: Tone;
  icon?: LucideIcon;
  size?: "sm" | "md";
  className?: string;
  children: ReactNode;
}

export function Tag({ tone = "level", icon: Icon, size = "sm", className, children }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-full font-medium",
        size === "sm" ? "px-3 py-1 text-sm" : "px-4 py-1.5 text-[15px]",
        TONE_CLASS[tone],
        className,
      )}
    >
      {Icon && <Icon className={size === "sm" ? "size-4 shrink-0" : "size-[18px] shrink-0"} aria-hidden />}
      <span className="truncate">{children}</span>
    </span>
  );
}
