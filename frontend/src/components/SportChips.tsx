import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { Sport } from "@/api/types";
import { useAccessibility } from "@/features/accessibility";
import { cn } from "@/lib/cn";
import { SportIllustration } from "./SportIllustration";
import { Pill } from "./ui/Pill";
import { Skeleton } from "./ui/Skeleton";

interface SportChipsProps {
  sports: Sport[] | undefined;
  value: number | null;
  onChange: (sportId: number | null) => void;
}

/** Сколько направлений простой режим показывает до кнопки «Ещё» */
const SIMPLE_VISIBLE = 5;

export function SportChips({ sports, value, onChange }: SportChipsProps) {
  // В простом режиме направления переносятся по строкам, без прокрутки вбок.
  // Длинный список свёрнут: иначе до событий нужно долго листать
  const { simple } = useAccessibility().settings;
  const [expanded, setExpanded] = useState(false);
  if (!sports) {
    return (
      <div className="flex gap-2 overflow-hidden" aria-hidden>
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton key={i} className="h-11 w-32 shrink-0 rounded-full" />
        ))}
      </div>
    );
  }
  return (
    <div
      role="group"
      aria-label="Направления"
      className={cn(
        "flex gap-2",
        simple
          ? "flex-wrap"
          : "no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 sm:[mask-image:linear-gradient(to_right,black_92%,transparent)]",
      )}
    >
      <Pill active={value === null} onClick={() => onChange(null)}>
        Все направления
      </Pill>
      {sports.map((sport, index) => (
        <Pill
          key={sport.id}
          active={value === sport.id}
          onClick={() => onChange(value === sport.id ? null : sport.id)}
          icon={<SportIllustration sport={sport} compact className="text-[24px]" />}
          className={cn(simple && !expanded && index >= SIMPLE_VISIBLE && value !== sport.id && "hidden")}
        >
          {sport.name}
        </Pill>
      ))}
      {simple && !expanded && sports.length > SIMPLE_VISIBLE && (
        <Pill onClick={() => setExpanded(true)} icon={<ChevronDown className="size-5" aria-hidden />}>
          Ещё {sports.length - SIMPLE_VISIBLE}
        </Pill>
      )}
    </div>
  );
}
