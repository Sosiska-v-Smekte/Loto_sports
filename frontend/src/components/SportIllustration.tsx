import type { Sport } from "@/api/types";
import { cn } from "@/lib/cn";

/**
 * Иллюстрация направления. 3D-картинок в репозитории нет, поэтому показываем крупный эмодзи
 * с тенью. Для пользовательских направлений бэкенд отдаёт нейтральную иконку.
 */
export function SportIllustration({ sport, className }: { sport: Sport; className?: string }) {
  return (
    <span aria-hidden className={cn("illustration pointer-events-none select-none", className)}>
      {sport.icon}
    </span>
  );
}
