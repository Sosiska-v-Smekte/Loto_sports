import { useId } from "react";
import { dayjs, toIsoDate } from "@/lib/dates";
import { Pill } from "./ui/Pill";

interface SimpleDatePickerProps {
  value: string | null;
  onChange: (date: string | null) => void;
}

const OTHER_DAY = "col-span-3 flex min-h-14 items-center gap-2 whitespace-nowrap rounded-full px-5 text-lg font-medium";
const DAY_BUTTON = "min-h-14 justify-center !px-3 !text-lg sm:!px-6";

export function SimpleDatePicker({ value, onChange }: SimpleDatePickerProps) {
  const inputId = useId();
  const today = toIsoDate(dayjs());
  const tomorrow = toIsoDate(dayjs().add(1, "day"));
  const other = value !== null && value !== today && value !== tomorrow;

  return (
    <div role="group" aria-label="Когда" className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center">
      <Pill active={value === null} onClick={() => onChange(null)} className={DAY_BUTTON}>
        Все дни
      </Pill>
      <Pill active={value === today} onClick={() => onChange(today)} className={DAY_BUTTON}>
        Сегодня
      </Pill>
      <Pill active={value === tomorrow} onClick={() => onChange(tomorrow)} className={DAY_BUTTON}>
        Завтра
      </Pill>
      <label
        htmlFor={inputId}
        className={
          other
            ? `${OTHER_DAY} neu-primary bg-primary text-white`
            : `${OTHER_DAY} neu-control border border-line/70 bg-surface-muted`
        }
      >
        <span className="shrink-0">Другой день:</span>
        <input
          id={inputId}
          type="date"
          min={today}
          value={other ? value : ""}
          onChange={(e) => onChange(e.target.value || null)}
          className="min-w-0 flex-1 rounded-lg bg-transparent font-semibold text-inherit [color-scheme:light] sm:flex-none"
        />
      </label>
    </div>
  );
}
