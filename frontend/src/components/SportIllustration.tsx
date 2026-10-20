import type { Sport } from "@/api/types";
import { cn } from "@/lib/cn";

/** Направления, для которых есть 3D-рендер в public/sport-icons (см. scripts/sport-icons). */
const RENDERED = new Set([
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
]);

/**
 * Объёмная иллюстрация направления. Размер задаётся через font-size (text-[80px] и т. п.):
 * картинка занимает 1em × 1em. Для пользовательских направлений показываем медаль.
 */
export function SportIllustration({ sport, className }: { sport: Sport; className?: string }) {
  const slug = sport.slug && RENDERED.has(sport.slug) ? sport.slug : "custom";
  return (
    <span aria-hidden className={cn("illustration pointer-events-none inline-block select-none", className)}>
      <img src={`/sport-icons/${slug}.webp`} alt="" width={384} height={384} draggable={false} className="block size-[1em] max-w-none" />
    </span>
  );
}
