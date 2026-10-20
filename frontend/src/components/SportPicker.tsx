import { Plus, Search } from "lucide-react";
import { useId, useState } from "react";
import type { Sport } from "@/api/types";
import { cn } from "@/lib/cn";
import { SportIllustration } from "./SportIllustration";
import { Pill } from "./ui/Pill";
import { Skeleton } from "./ui/Skeleton";

export type SportChoice = { sportId: number; name: string } | { customName: string } | null;

interface SportPickerProps {
  sports: Sport[] | undefined;
  value: SportChoice;
  onChange: (value: SportChoice) => void;
  error?: string;
}

// Та же нормализация, что на бэкенде: регистр, лишние пробелы, «ё»
const normalize = (value: string) => value.replace(/\s+/g, " ").trim().toLowerCase().replace(/ё/g, "е");

/** Выбор направления из каталога с поиском или ввод своего — новое направление не требует правки кода. */
export function SportPicker({ sports, value, onChange, error }: SportPickerProps) {
  const [search, setSearch] = useState("");
  const id = useId();
  const needle = normalize(search);
  const filtered = sports?.filter((s) => normalize(s.name).includes(needle)) ?? [];
  const exact = sports?.find((s) => normalize(s.name) === needle);
  const customSelected = value && "customName" in value ? value.customName : null;

  return (
    <fieldset className="flex flex-col gap-2" aria-describedby={error ? `${id}-error` : undefined}>
      <legend className="text-[15px] font-medium">
        Направление <span className="text-weekend" aria-hidden>*</span>
      </legend>
      <div className="relative">
        <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Найдите в каталоге или впишите своё"
          aria-label="Поиск направления"
          maxLength={60}
          className={cn(
            "min-h-12 w-full rounded-full border bg-white/80 pl-12 pr-5 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/25",
            error ? "border-danger-ink" : "border-line",
          )}
        />
      </div>
      <div className="flex flex-wrap gap-2 pt-1">
        {!sports && Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-11 w-28 rounded-full" />)}
        {filtered.map((sport) => (
          <Pill
            key={sport.id}
            active={value !== null && "sportId" in value && value.sportId === sport.id}
            onClick={() => onChange({ sportId: sport.id, name: sport.name })}
            icon={<SportIllustration sport={sport} compact className="text-[24px]" />}
          >
            {sport.name}
          </Pill>
        ))}
        {needle.length >= 2 && !exact && (
          <Pill
            active={customSelected !== null && normalize(customSelected) === needle}
            onClick={() => onChange({ customName: search.trim() })}
            icon={<Plus className="size-4" aria-hidden />}
            className="border-dashed"
          >
            Добавить своё: «{search.trim()}»
          </Pill>
        )}
        {sports && filtered.length === 0 && needle.length < 2 && (
          <p className="text-muted">Введите хотя бы две буквы, чтобы добавить своё направление.</p>
        )}
      </div>
      {customSelected && (
        <p className="text-sm text-muted">
          Новое направление «{customSelected}» появится в каталоге после публикации.
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm font-medium text-danger-ink">
          {error}
        </p>
      )}
    </fieldset>
  );
}
