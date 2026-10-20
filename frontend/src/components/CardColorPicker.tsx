import { Check } from "lucide-react";
import type { Sport } from "@/api/types";
import { CARD_COLORS } from "@/lib/color";
import { cn } from "@/lib/cn";

interface CardColorPickerProps {
  /** #RRGGBB; null означает цвет направления */
  value: string | null;
  onChange: (color: string | null) => void;
  sport: Sport | null;
}

export function CardColorPicker({ value, onChange, sport }: CardColorPickerProps) {
  const choices = [{ hex: null, name: "Как у направления" }, ...CARD_COLORS];
  const selected = choices.find((c) => c.hex === value) ?? choices[0];
  return (
    <fieldset>
      <legend className="text-[15px] font-medium">Цвет карточки</legend>
      <div className="mt-2 flex flex-wrap gap-3">
        {choices.map((choice) => {
          const checked = choice.hex === value;
          return (
            <label
              key={choice.name}
              className="pressable relative cursor-pointer rounded-full has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary"
            >
              <input
                type="radio"
                name="card-color"
                value={choice.hex ?? ""}
                checked={checked}
                onChange={() => onChange(choice.hex)}
                className="sr-only"
              />
              <span
                aria-hidden
                className={cn(
                  "grid size-12 place-items-center rounded-full border-2 transition-shadow",
                  checked ? "border-ink ring-2 ring-primary ring-offset-2 ring-offset-page" : "border-white shadow-soft",
                  !choice.hex && "border-dashed border-line",
                )}
                style={{ backgroundColor: choice.hex ?? sport?.color ?? "#E9DFCC" }}
              >
                {checked && <Check className="size-5 text-ink" />}
              </span>
              <span className="sr-only">{choice.name}</span>
            </label>
          );
        })}
      </div>
      <p className="mt-2 text-sm text-muted">{selected.name}</p>
    </fieldset>
  );
}
