import type { Sport } from "@/api/types";
import { cn } from "@/lib/cn";

/** Направления с 3D-иконкой в public/sport-icons (часть — рендеры из scripts/sport-icons). */
const ICONS = new Set([
  "football",
  "basketball",
  "volleyball",
  "tennis",
  "table-tennis",
  "chess",
  "running",
  "yoga",
  "swimming",
  "cycling",
  "bowling",
  "boxing",
  "hockey",
  "badminton",
]);

/** В маленьком размере (чипы) сложная композиция не читается — показываем один предмет. */
const COMPACT: Record<string, string> = { bowling: "bowling-pin" };

/**
 * Объёмная иллюстрация направления. Размер задаётся через font-size (text-[80px] и т. п.):
 * картинка занимает 1em × 1em. Для пользовательских направлений показываем медаль.
 */
interface SportIllustrationProps {
  sport: Sport;
  className?: string;
  /** Маленькая иконка: для чипов и списков */
  compact?: boolean;
}

export function SportIllustration({ sport, className, compact }: SportIllustrationProps) {
  const base = sport.slug && ICONS.has(sport.slug) ? sport.slug : "custom";
  const slug = (compact && COMPACT[base]) || base;
  return (
    <span aria-hidden className={cn("illustration pointer-events-none inline-block select-none", className)}>
      <img src={`/sport-icons/${slug}.webp`} alt="" width={384} height={384} draggable={false} className="block size-[1em] max-w-none" />
    </span>
  );
}
