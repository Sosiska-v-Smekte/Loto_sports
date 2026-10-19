import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface PillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: ReactNode;
}

/** Переключаемая таблетка: чипы фильтров, вкладки. Состояние передаётся через aria-pressed. */
export function Pill({ active, icon, className, children, ...rest }: PillProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "pressable inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-[15px] font-medium",
        active
          ? "border-primary bg-primary text-white"
          : "border-line bg-surface-muted text-ink hover:border-[#d3c6ad] hover:bg-white",
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
