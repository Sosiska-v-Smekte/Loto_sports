import { CheckCircle2, Circle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export interface Choice<T extends string> {
  value: T;
  title: string;
  description?: string;
  icon?: LucideIcon;
}

interface ChoiceCardsProps<T extends string> {
  legend: string;
  name: string;
  value: T;
  onChange: (value: T) => void;
  choices: Choice<T>[];
  columns?: 2 | 4;
}

/** Крупные карточки-переключатели на нативных radio: работают с клавиатуры и экранным диктором. */
export function ChoiceCards<T extends string>({ legend, name, value, onChange, choices, columns = 2 }: ChoiceCardsProps<T>) {
  return (
    <fieldset>
      <legend className="text-[15px] font-medium">{legend}</legend>
      <div className={cn("mt-2 grid gap-3", columns === 4 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2")}>
        {choices.map((choice) => {
          const checked = choice.value === value;
          const Icon = choice.icon;
          const Mark = checked ? CheckCircle2 : Circle;
          return (
            <label
              key={choice.value}
              className={cn(
                "pressable relative flex cursor-pointer gap-3 rounded-[20px] border-2 bg-white/70 p-4 has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary",
                checked ? "border-primary bg-primary-soft" : "border-line hover:border-[#d3c6ad]",
              )}
            >
              <input
                type="radio"
                name={name}
                value={choice.value}
                checked={checked}
                onChange={() => onChange(choice.value)}
                className="sr-only"
              />
              {Icon && <Icon className="mt-0.5 size-6 shrink-0 text-primary" aria-hidden />}
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{choice.title}</span>
                {choice.description && <span className="mt-1 block text-[15px] leading-snug text-muted">{choice.description}</span>}
              </span>
              <Mark className={cn("size-5 shrink-0", checked ? "text-primary" : "text-line")} aria-hidden />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
