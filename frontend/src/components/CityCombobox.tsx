import { ChevronDown, MapPin } from "lucide-react";
import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { useCities } from "@/features/events";
import { cn } from "@/lib/cn";
import { FieldShell } from "./ui/Field";

interface CityComboboxProps {
  value: string;
  onChange: (city: string) => void;
  /** Подпись поля в формах; без неё — компактный вариант для фильтра на главной */
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
}

const normalize = (value: string) => value.trim().toLowerCase().replace(/ё/g, "е");

/**
 * Выбор города только из справочника: можно искать по началу или части названия,
 * но произвольный текст не принимается — при уходе с поля возвращается последний выбранный город.
 */
export function CityCombobox({ label, ...props }: CityComboboxProps) {
  if (!label) return <CityInput {...props} compact />;
  return (
    <FieldShell label={label} hint={props.hint} error={props.error} required={props.required}>
      {(field) => <CityInput {...props} {...field} />}
    </FieldShell>
  );
}

interface CityInputProps extends Omit<CityComboboxProps, "label"> {
  id?: string;
  describedBy?: string;
  invalid?: boolean;
  compact?: boolean;
}

function CityInput({ value, onChange, id, describedBy, invalid = false, compact = false }: CityInputProps) {
  const cities = useCities();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const options = useMemo(() => {
    const all = cities.data ?? [];
    const needle = normalize(query);
    if (!needle) return all;
    // Сначала города, начинающиеся с введённого текста, потом содержащие его
    const starts = all.filter((c) => normalize(c).startsWith(needle));
    const contains = all.filter((c) => !normalize(c).startsWith(needle) && normalize(c).includes(needle));
    return [...starts, ...contains];
  }, [cities.data, query]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const choose = (city: string) => {
    onChange(city);
    close();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) setOpen(true);
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (options.length ? (i + step + options.length) % options.length : 0));
    } else if (e.key === "Enter" && open) {
      e.preventDefault();
      if (options[active]) choose(options[active]);
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      close();
    }
  };

  const onBlur = () => {
    // Точное совпадение с городом из списка принимаем, всё остальное откатываем
    const exact = (cities.data ?? []).find((c) => normalize(c) === normalize(query));
    if (open && exact) onChange(exact);
    close();
  };

  const activeId = open && options[active] ? `${listId}-${active}` : undefined;

  return (
    <div className="relative">
      <MapPin
        className={cn("pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted", compact ? "left-5 size-[22px]" : "left-4 size-5")}
        aria-hidden
      />
      <input
        id={id}
        role="combobox"
        aria-label={id ? undefined : "Город"}
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeId}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        autoComplete="off"
        value={open ? query : value}
        placeholder={open ? value || "Начните вводить город" : "Выберите город"}
        onFocus={() => {
          setOpen(true);
          setActive(Math.max(0, (cities.data ?? []).indexOf(value)));
        }}
        onClick={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        className={cn(
          "neu-inset w-full rounded-full border text-ink placeholder:text-[#7d7366] focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/25",
          compact ? "h-[52px] bg-surface-muted/90 pl-14 pr-12 text-[17px] sm:text-lg" : "min-h-12 bg-surface-muted pl-11 pr-11",
          invalid ? "border-danger-ink" : "border-line",
        )}
      />
      <ChevronDown
        className={cn("pointer-events-none absolute top-1/2 size-5 -translate-y-1/2 text-muted", compact ? "right-5" : "right-4")}
        aria-hidden
      />
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Города"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 max-h-72 overflow-y-auto rounded-2xl border border-line bg-surface p-1.5 shadow-pop"
        >
          {cities.isPending && <li className="px-3 py-2.5 text-muted">Загружаем города…</li>}
          {cities.isSuccess && options.length === 0 && (
            <li className="px-3 py-2.5 text-muted">Такого города нет в списке</li>
          )}
          {options.map((city, index) => (
            <li
              key={city}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={city === value}
              // mousedown, а не click: иначе поле потеряет фокус раньше, чем сработает выбор
              onMouseDown={(e) => {
                e.preventDefault();
                choose(city);
              }}
              onMouseEnter={() => setActive(index)}
              ref={index === active ? (el) => el?.scrollIntoView({ block: "nearest" }) : undefined}
              className={cn(
                "flex min-h-11 cursor-pointer items-center rounded-xl px-3",
                index === active && "bg-surface-muted",
                city === value && "font-semibold text-primary",
              )}
            >
              {city}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
