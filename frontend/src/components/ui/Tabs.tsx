import { cn } from "@/lib/cn";

interface TabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  items: { value: T; label: string; count?: number }[];
  label: string;
  className?: string;
}

export function Tabs<T extends string>({ value, onChange, items, label, className }: TabsProps<T>) {
  return (
    <div role="tablist" aria-label={label} className={cn("no-scrollbar flex gap-2 overflow-x-auto", className)}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "pressable inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-5 font-medium",
              active ? "border-primary bg-primary text-white" : "border-line bg-surface-muted hover:bg-white",
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  "min-w-6 rounded-full px-1.5 text-sm tabular-nums",
                  active ? "bg-white/20" : "bg-level",
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
