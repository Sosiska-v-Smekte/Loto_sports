import { useId } from "react";
import type { Sport } from "@/api/types";
import { cn } from "@/lib/cn";
import { ICONS, Medal } from "./sport-icons/icons";

/**
 * Объёмная иллюстрация направления (SVG с градиентами, бликами и тенями).
 * Размер задаётся через font-size (text-[80px] и т. п.): иконка занимает 1em × 1em.
 * Для пользовательских направлений без своей картинки показываем медаль.
 */
export function SportIllustration({ sport, className }: { sport: Sport; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const Icon = (sport.slug && ICONS[sport.slug]) || Medal;
  return (
    <span aria-hidden className={cn("illustration pointer-events-none inline-block select-none", className)}>
      <svg viewBox="0 0 120 120" width="1em" height="1em" className="block overflow-visible">
        <Icon id={(name) => `${uid}-${name}`} />
      </svg>
    </span>
  );
}
