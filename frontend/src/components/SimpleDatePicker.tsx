import { CalendarDays } from "lucide-react";
import { useId } from "react";
import { dayjs, toIsoDate } from "@/lib/dates";
import { Pill } from "./ui/Pill";

interface SimpleDatePickerProps {
  value: string | null;
  onChange: (date: string | null) => void;
}

/** Выбор даты для простого режима: три понятные кнопки и обычный календарь вместо длинной ленты. */
export function SimpleDatePicker({ value, onChange }: SimpleDatePickerProps) {
  const inputId = useId();
  const today = toIsoDate(dayjs());
  const tomorrow = toIsoDate(dayjs().add(1, "day"));
  const other = value !== null && value !== today && value !== tomorrow;

  return (
    <div role="group" aria-label="Когда" className="flex flex-wrap items-center gap-2">
      <Pill active={value === null} onClick={() => onChange(null)} className="min-h-14 px-6 text-lg">
        Любой день
      </Pill>
      <Pill active={value === today} onClick={() => onChange(today)} className="min-h-14 px-6 text-lg">
        Сегодня
      </Pill>
      <Pill active={value === tomorrow} onClick={() => onChange(tomorrow)} className="min-h-14 px-6 text-lg">
        Завтра
      </Pill>
      <label
        htmlFor={inputId}
        className={
          other
            ? "neu-primary inline-flex min-h-14 items-center gap-2 rounded-full bg-primary px-5 text-lg font-medium text-white"
            : "neu-control inline-flex min-h-14 items-center gap-2 rounded-full border border-white/70 bg-surface-muted px-5 text-lg font-medium"
        }
      >
        <CalendarDays className="size-5 shrink-0" aria-hidden />
        Другой день:
        <input
          id={inputId}
          type="date"
          min={today}
          value={other ? value : ""}
          onChange={(e) => onChange(e.target.value || null)}
          className="rounded-lg bg-transparent font-semibold text-inherit [color-scheme:light]"
        />
      </label>
    </div>
  );
}
