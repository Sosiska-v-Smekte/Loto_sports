import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { Sport } from "@/api/types";
import { useAccessibility } from "@/features/accessibility";
import { cn } from "@/lib/cn";
import { edgeFade, useHorizontalScroll } from "@/lib/useHorizontalScroll";
import { SportIllustration } from "./SportIllustration";
import { Pill } from "./ui/Pill";
import { ScrollArrow } from "./ui/ScrollArrow";
import { Skeleton } from "./ui/Skeleton";

interface SportChipsProps {
  sports: Sport[] | undefined;
  value: number | null;
  onChange: (sportId: number | null) => void;
}

const SIMPLE_VISIBLE = 5;

export function SportChips({ sports, value, onChange }: SportChipsProps) {
  const { simple } = useAccessibility().settings;
  const [expanded, setExpanded] = useState(false);
  const { ref, edges, scrollBy, handlers } = useHorizontalScroll<HTMLDivElement>();
  if (!sports) {
    return (
      <div className="flex gap-2 overflow-hidden" aria-hidden>
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton key={i} className="h-11 w-32 shrink-0 rounded-full" />
        ))}
      </div>
    );
  }
  if (simple) {
    return (
      <div role="group" aria-label="Направления" className="flex flex-wrap gap-2">
        <Pill active={value === null} onClick={() => onChange(null)}>
          Все направления
        </Pill>
        {sports.map((sport, index) => (
          <Pill
            key={sport.id}
            active={value === sport.id}
            onClick={() => onChange(value === sport.id ? null : sport.id)}
            icon={<SportIllustration sport={sport} compact className="text-[24px]" />}
            className={cn(!expanded && index >= SIMPLE_VISIBLE && value !== sport.id && "hidden")}
          >
            {sport.name}
          </Pill>
        ))}
        {!expanded && sports.length > SIMPLE_VISIBLE && (
          <Pill onClick={() => setExpanded(true)} icon={<ChevronDown className="size-5" aria-hidden />}>
            Ещё {sports.length - SIMPLE_VISIBLE}
          </Pill>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {!edges.start && <ScrollArrow direction="prev" label="Предыдущие направления" onClick={() => scrollBy(-1)} className="top-0" />}
      <div
        ref={ref}
        {...handlers}
        role="group"
        aria-label="Направления"
        className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0 sm:pr-12"
        style={{ maskImage: edgeFade(edges), WebkitMaskImage: edgeFade(edges) }}
      >
        <Pill active={value === null} onClick={() => onChange(null)}>
          Все направления
        </Pill>
        {sports.map((sport) => (
          <Pill
            key={sport.id}
            active={value === sport.id}
            onClick={() => onChange(value === sport.id ? null : sport.id)}
            icon={<SportIllustration sport={sport} compact className="text-[24px]" />}
          >
            {sport.name}
          </Pill>
        ))}
      </div>
      {!edges.end && <ScrollArrow direction="next" label="Следующие направления" onClick={() => scrollBy(1)} className="top-0" />}
    </div>
  );
}
