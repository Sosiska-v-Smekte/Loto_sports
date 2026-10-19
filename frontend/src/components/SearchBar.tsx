import { ChevronDown, MapPin, Search, X } from "lucide-react";
import { useEffect, useState } from "react";

interface SearchBarProps {
  query: string;
  onQueryChange: (value: string) => void;
  city: string;
  cities: string[];
  onCityChange: (value: string) => void;
}

/** Поиск по названию, описанию, направлению и адресу + выбор города. Ввод применяется с задержкой. */
export function SearchBar({ query, onQueryChange, city, cities, onCityChange }: SearchBarProps) {
  const [draft, setDraft] = useState(query);

  useEffect(() => setDraft(query), [query]);

  useEffect(() => {
    if (draft === query) return;
    const timer = window.setTimeout(() => onQueryChange(draft), 300);
    return () => window.clearTimeout(timer);
  }, [draft, query, onQueryChange]);

  const options = cities.includes(city) ? cities : [city, ...cities];

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-5 top-1/2 size-[22px] -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Поиск по активностям и площадкам…"
          aria-label="Поиск по активностям и площадкам"
          className="h-[52px] w-full rounded-full border border-line bg-surface-muted/90 pl-14 pr-12 text-[17px] placeholder:text-[#7d7366] focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/25 sm:text-lg [&::-webkit-search-cancel-button]:hidden"
        />
        {draft && (
          <button
            type="button"
            onClick={() => {
              setDraft("");
              onQueryChange("");
            }}
            aria-label="Очистить поиск"
            className="pressable absolute right-1.5 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full hover:bg-line/60"
          >
            <X className="size-5" aria-hidden />
          </button>
        )}
      </div>
      <div className="relative sm:w-[260px]">
        <MapPin className="pointer-events-none absolute left-5 top-1/2 size-[22px] -translate-y-1/2 text-muted" aria-hidden />
        <select
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          aria-label="Город"
          className="h-[52px] w-full appearance-none rounded-full border border-line bg-surface-muted/90 pl-14 pr-12 text-[17px] focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/25 sm:text-lg"
        >
          {options.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-5 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
      </div>
    </div>
  );
}
