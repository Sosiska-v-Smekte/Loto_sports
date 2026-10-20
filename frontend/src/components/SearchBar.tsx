import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { CityCombobox } from "./CityCombobox";

interface SearchBarProps {
  query: string;
  onQueryChange: (value: string) => void;
  city: string;
  onCityChange: (value: string) => void;
}

export function SearchBar({ query, onQueryChange, city, onCityChange }: SearchBarProps) {
  const [draft, setDraft] = useState(query);

  useEffect(() => setDraft(query), [query]);

  useEffect(() => {
    if (draft === query) return;
    const timer = window.setTimeout(() => onQueryChange(draft), 300);
    return () => window.clearTimeout(timer);
  }, [draft, query, onQueryChange]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-5 top-1/2 size-[22px] -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Поиск занятий и площадок"
          aria-label="Поиск по активностям и площадкам"
          className="search-inset h-[52px] w-full text-ellipsis rounded-full border border-line/70 pl-14 pr-4 text-[17px] [&:not(:placeholder-shown)]:pr-12 placeholder:text-[#7d7366] focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/25 sm:text-lg [&::-webkit-search-cancel-button]:hidden"
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
      <div className="sm:w-[260px]">
        <CityCombobox value={city} onChange={onCityChange} />
      </div>
    </div>
  );
}
