import { Check } from "lucide-react";
import type { Sport } from "@/api/types";
import { cn } from "@/lib/cn";
import { CARD_PATTERNS, SPORT_PATTERN, type CardPattern } from "@/lib/engraving";
import { Engraving } from "./Engraving";

interface CardPatternPickerProps {
  /** null означает без гравировки */
  value: CardPattern | null;
  onChange: (pattern: CardPattern | null) => void;
  sport: Sport | null;
  background: string;
}

export function CardPatternPicker({ value, onChange, sport, background }: CardPatternPickerProps) {
  const suggested = sport?.slug ? SPORT_PATTERN[sport.slug] : undefined;
  const patterns = [...CARD_PATTERNS].sort((a, b) => Number(b.id === suggested) - Number(a.id === suggested));
  const choices: { id: CardPattern | null; name: string }[] = [{ id: null, name: "Без гравировки" }, ...patterns];
  const selected = choices.find((c) => c.id === value) ?? choices[0];
  return (
    <fieldset>
      <legend className="text-[15px] font-medium">Гравировка карточки</legend>
      <div data-pattern-preview className="mt-2 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {choices.map((choice) => {
          const checked = choice.id === value;
          return (
            <label
              key={choice.name}
              className="pressable cursor-pointer rounded-2xl has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary"
            >
              <input
                type="radio"
                name="card-pattern"
                value={choice.id ?? ""}
                checked={checked}
                onChange={() => onChange(choice.id)}
                className="sr-only"
              />
              <span
                aria-hidden
                className={cn(
                  "tinted-3d relative isolate grid h-16 place-items-center overflow-hidden rounded-2xl border-2",
                  checked ? "border-ink ring-2 ring-primary ring-offset-2 ring-offset-page" : "border-white shadow-soft",
                )}
                style={{ backgroundColor: background }}
              >
                <Engraving pattern={choice.id} />
                {checked && <Check className="size-5 text-ink" />}
              </span>
              <span className="mt-1 block text-center text-[13px] leading-tight">
                {choice.name}
                {choice.id && choice.id === suggested && <span className="block text-muted">подходит к направлению</span>}
              </span>
            </label>
          );
        })}
      </div>
      <p className="mt-2 text-sm text-muted">{selected.name}</p>
    </fieldset>
  );
}
