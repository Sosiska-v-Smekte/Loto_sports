import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface PillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: ReactNode;
}

export function Pill({ active, icon, className, children, ...rest }: PillProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "pressable inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-[15px] font-medium",
        active
          ? "neu-primary border-primary bg-primary text-white"
          : "neu-control border-line/70 bg-surface-muted text-ink",
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
