import { useId } from "react";
import { cn } from "@/lib/cn";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, hint, disabled }: SwitchProps) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p id={`${id}-label`} className="font-medium leading-snug">
          {label}
        </p>
        {hint && <p className="text-sm text-muted">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "pressable relative h-8 w-14 shrink-0 rounded-full border transition-colors disabled:opacity-60",
          checked ? "border-primary bg-primary" : "border-line bg-surface-muted",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute top-0.5 size-6 rounded-full bg-white shadow-soft transition-[left]",
            checked ? "left-[30px]" : "left-0.5",
          )}
        />
        {/* Подпись состояния словом: не только положение и цвет */}
        <span className="sr-only">{checked ? "Включено" : "Выключено"}</span>
      </button>
    </div>
  );
}
