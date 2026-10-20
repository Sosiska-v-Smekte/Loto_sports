import { useEffect, useState } from "react";
import type { Sport } from "@/api/types";
import { cn } from "@/lib/cn";
import { recolorIcon } from "@/lib/recolor";

/**
 * 3D-иконки направлений из Figma-пака «Sports 3D Icon Pack» и боулинг из присланных картинок,
 * файлы в public/sport-icons. Направлению без своей иконки в паке подобран предмет по смыслу.
 */
const ICONS: Record<string, string> = {
  football: "football",
  basketball: "basketball",
  volleyball: "whistle",
  tennis: "tennis",
  "table-tennis": "table-tennis",
  chess: "chess",
  running: "stopwatch",
  yoga: "dumbbell",
  swimming: "swimming",
  cycling: "bottle",
  bowling: "bowling",
  boxing: "boxing",
  hockey: "hockey",
  badminton: "badminton",
};

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
 * картинка занимает 1em × 1em. Для пользовательских направлений показываем трофей.
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
  const base = (sport.slug && ICONS[sport.slug]) || "custom";
  const file = (compact && COMPACT[base]) || base;
  const src = `/sport-icons/${file}.webp`;
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
