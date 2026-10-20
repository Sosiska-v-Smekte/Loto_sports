import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { dayjs } from "@/lib/dates";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

interface MyCalendarProps {
  /** Дни в формате YYYY-MM-DD, отмеченные точкой */
  busyDays: Set<string>;
  selected: string | null;
  onSelect: (day: string | null) => void;
}

export function MyCalendar({ busyDays, selected, onSelect }: MyCalendarProps) {
  const [month, setMonth] = useState(() => dayjs().startOf("month"));
  const today = dayjs().format("YYYY-MM-DD");
  // Сдвиг до понедельника: в dayjs воскресенье = 0
  const lead = (month.day() + 6) % 7;
  const cells = Array.from({ length: Math.ceil((lead + month.daysInMonth()) / 7) * 7 }, (_, i) => month.add(i - lead, "day"));

  return (
    <div className="neu-raised rounded-card border border-line/70 bg-surface p-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Предыдущий месяц"
          onClick={() => setMonth((m) => m.subtract(1, "month"))}
          className="pressable grid size-10 place-items-center rounded-full hover:bg-surface-muted"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <p className="font-semibold capitalize" aria-live="polite">
          {month.format("MMMM YYYY")}
        </p>
        <button
          type="button"
          aria-label="Следующий месяц"
          onClick={() => setMonth((m) => m.add(1, "month"))}
          className="pressable grid size-10 place-items-center rounded-full hover:bg-surface-muted"
        >
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </div>
      <div className="mt-2 grid grid-cols-7 text-center text-sm text-muted" aria-hidden>
        {WEEKDAYS.map((d) => (
          <span key={d} className="py-1">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5 text-center" role="grid" aria-label="Календарь активностей">
        {cells.map((day) => {
          const key = day.format("YYYY-MM-DD");
          const inMonth = day.month() === month.month();
          const busy = busyDays.has(key);
          const isToday = key === today;
          const isSelected = key === selected;
          return (
            <button
              key={key}
              type="button"
              role="gridcell"
              aria-selected={isSelected}
              aria-label={`${day.format("D MMMM")}${busy ? ", есть активности" : ""}`}
              onClick={() => onSelect(isSelected ? null : key)}
              className={cn(
                "relative mx-auto grid size-10 place-items-center rounded-full text-[15px] tabular-nums transition-colors",
                inMonth ? "text-ink" : "text-muted/60",
                isToday && "neu-primary bg-primary font-semibold text-white",
                !isToday && isSelected && "bg-level ring-2 ring-primary",
                !isToday && !isSelected && "hover:bg-surface-muted",
              )}
            >
              {day.date()}
              {busy && (
                <span
                  aria-hidden
                  className={cn("absolute bottom-1 size-1.5 rounded-full", isToday ? "bg-white" : "bg-primary")}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
