import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { dayjs, toIsoDate } from "@/lib/dates";
import { cn } from "@/lib/cn";

const DAYS_AHEAD = 42;

interface DateStripProps {
  value: string | null;
  onChange: (date: string | null) => void;
}

/** Лента дат на 6 недель вперёд. Повторный клик по выбранному дню снимает фильтр. */
export function DateStrip({ value, onChange }: DateStripProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const days = useMemo(() => {
    const today = dayjs().startOf("day");
    return Array.from({ length: DAYS_AHEAD }, (_, i) => today.add(i, "day"));
  }, []);

  const updateEdges = () => {
    const el = scroller.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
  };

  useEffect(() => {
    updateEdges();
    window.addEventListener("resize", updateEdges);
    return () => window.removeEventListener("resize", updateEdges);
  }, []);

  const scrollBy = (direction: 1 | -1) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.66, behavior: "smooth" });
  };

  const arrowClass =
    "pressable absolute top-[38px] z-10 hidden size-11 place-items-center rounded-full border border-line bg-surface shadow-soft hover:bg-white sm:grid";

  return (
    <div className="relative">
      {!edges.start && (
        <button type="button" onClick={() => scrollBy(-1)} aria-label="Предыдущие дни" className={cn(arrowClass, "-left-3")}>
          <ChevronLeft className="size-5" aria-hidden />
        </button>
      )}
      <div
        ref={scroller}
        onScroll={updateEdges}
        role="group"
        aria-label="Выбор даты"
        className="no-scrollbar flex snap-x snap-mandatory gap-1 overflow-x-auto pr-12 sm:gap-1.5"
      >
        {days.map((day, index) => {
          const iso = toIsoDate(day);
          const selected = value === iso;
          const isToday = index === 0;
          const weekend = day.day() === 0 || day.day() === 6;
          const showMonth = index === 0 || day.date() === 1;
          return (
            <div key={iso} className="flex shrink-0 snap-start flex-col">
              {/* Ширина 0: подпись месяца не раздвигает колонку дня */}
              <span className="h-7 w-0 whitespace-nowrap pl-2 text-[13px] font-medium uppercase tracking-[0.06em] text-muted">
                {showMonth ? day.format("MMMM") : ""}
              </span>
              <button
                type="button"
                onClick={() => onChange(selected ? null : iso)}
                aria-pressed={selected}
                aria-label={`${isToday ? "Сегодня, " : ""}${day.format("dddd, D MMMM")}`}
                className={cn(
                  "pressable flex h-[66px] w-[50px] flex-col items-center justify-center rounded-2xl leading-none sm:w-[54px]",
                  selected
                    ? "bg-primary text-white shadow-soft"
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
      {!edges.end && (
        <button type="button" onClick={() => scrollBy(1)} aria-label="Следующие дни" className={cn(arrowClass, "-right-1")}>
          <ChevronRight className="size-5" aria-hidden />
        </button>
      )}
    </div>
  );
}
