import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

interface ScrollArrowProps {
  direction: "prev" | "next";
  label: string;
  onClick: () => void;
  className?: string;
}

export function ScrollArrow({ direction, label, onClick, className }: ScrollArrowProps) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "pressable neu-control absolute z-10 hidden size-11 place-items-center rounded-full border border-line/70 bg-surface sm:grid",
        direction === "prev" ? "-left-3" : "-right-1",
        className,
      )}
    >
      <Icon className="size-5" aria-hidden />
    </button>
  );
}
