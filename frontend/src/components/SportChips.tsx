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

export function SportChips({ sports, value, onChange }: SportChipsProps) {
  // В простом режиме все направления видны сразу, без прокрутки вбок
  const { simple } = useAccessibility().settings;
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
  );
}
