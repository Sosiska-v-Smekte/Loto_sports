import { useMemo } from "react";
import { dayjs, toIsoDate } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { edgeFade, useHorizontalScroll } from "@/lib/useHorizontalScroll";
import { ScrollArrow } from "./ui/ScrollArrow";

const DAYS_AHEAD = 42;

interface DateStripProps {
  value: string | null;
  onChange: (date: string | null) => void;
}

/** Лента дат на 6 недель вперёд. Повторный клик по выбранному дню снимает фильтр. */
export function DateStrip({ value, onChange }: DateStripProps) {
  const { ref, edges, scrollBy, handlers } = useHorizontalScroll<HTMLDivElement>();

  const days = useMemo(() => {
    const today = dayjs().startOf("day");
    return Array.from({ length: DAYS_AHEAD }, (_, i) => today.add(i, "day"));
  }, []);

  return (
    <div className="relative">
      {!edges.start && <ScrollArrow direction="prev" label="Предыдущие дни" onClick={() => scrollBy(-1)} className="top-[38px]" />}
      <div
        ref={ref}
        {...handlers}
        role="group"
        aria-label="Выбор даты"
        className="no-scrollbar flex snap-x snap-mandatory gap-1 overflow-x-auto pr-12 sm:gap-1.5"
        style={{ maskImage: edgeFade(edges), WebkitMaskImage: edgeFade(edges) }}
      >
        {days.map((day, index) => {
          const iso = toIsoDate(day);
          const selected = value === iso;
          const isToday = index === 0;
          const weekend = day.day() === 0 || day.day() === 6;
          const showMonth = index === 0 || day.date() === 1;
          return (
            <div key={iso} className="flex shrink-0 snap-start flex-col">
              <span className="h-7 w-0 whitespace-nowrap pl-2 text-[13px] font-medium uppercase tracking-[0.06em] text-muted">
                {showMonth ? day.format("MMMM") : ""}
              </span>
              <button
                type="button"
                onClick={() => onChange(selected ? null : iso)}
                aria-pressed={selected}
                data-weekend={weekend || undefined}
                aria-label={`${isToday ? "Сегодня, " : ""}${day.format("dddd, D MMMM")}`}
                className={cn(
                  "pressable relative flex h-[66px] w-[50px] flex-col items-center justify-center rounded-2xl leading-none sm:w-[54px]",
                  selected
                    ? "neu-primary bg-primary text-white"
                    : cn(isToday && "bg-today", "hover:bg-surface-muted", weekend ? "text-weekend" : "text-ink"),
                )}
              >
                <span className="text-[22px] font-medium tabular-nums sm:text-[24px]">{day.date()}</span>
                <span className="mt-1.5 text-[13px] font-medium uppercase">{day.format("dd")}</span>
              </button>
            </div>
          );
        })}
      </div>
      {!edges.end && <ScrollArrow direction="next" label="Следующие дни" onClick={() => scrollBy(1)} className="top-[38px]" />}
    </div>
  );
}
