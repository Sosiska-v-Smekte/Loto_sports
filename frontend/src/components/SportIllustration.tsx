import { useEffect, useState } from "react";
import type { Sport } from "@/api/types";
import { cn } from "@/lib/cn";
import { recolorIcon } from "@/lib/recolor";

/** Направления с 3D-иконкой в public/sport-icons (часть — рендеры из scripts/sport-icons, часть — из Figma). */
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

/** Адрес перекрашенной картинки для выбранного цвета; пока считается, возвращает null. */
function useRecoloredIcon(src: string, color: string | undefined): string | null {
  const [done, setDone] = useState<{ key: string; url: string } | null>(null);
  useEffect(() => {
    if (!color) return;
    let alive = true;
    recolorIcon(src, color).then((url) => {
      if (alive) setDone({ key: `${src}|${color}`, url });
    });
    return () => {
      alive = false;
    };
  }, [src, color]);
  return color && done?.key === `${src}|${color}` ? done.url : null;
}

/**
 * Объёмная иллюстрация направления. Размер задаётся через font-size (text-[80px] и т. п.):
 * картинка занимает 1em × 1em. Для пользовательских направлений показываем медаль.
 */
interface SportIllustrationProps {
  sport: Sport;
  className?: string;
  /** Маленькая иконка: для чипов и списков */
  compact?: boolean;
  /** Свой цвет карточки: иконка перекрашивается в него, светотень и детали сохраняются */
  tint?: string;
}

export function SportIllustration({ sport, className, compact, tint }: SportIllustrationProps) {
  const base = sport.slug && ICONS.has(sport.slug) ? sport.slug : "custom";
  const slug = (compact && COMPACT[base]) || base;
  const src = `/sport-icons/${slug}.webp`;
  const recolorTo = !compact && tint ? tint : undefined;
  const recolored = useRecoloredIcon(src, recolorTo);
  return (
    <span aria-hidden className={cn("illustration pointer-events-none inline-block select-none", className)}>
      {recolorTo && !recolored ? (
        <span className="block size-[1em]" />
      ) : (
        <img src={recolored ?? src} alt="" width={384} height={384} draggable={false} className="block size-[1em] max-w-none" />
      )}
    </span>
  );
}
