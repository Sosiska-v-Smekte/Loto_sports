import { useEffect, useState } from "react";
import type { Sport } from "@/api/types";
import { cn } from "@/lib/cn";
import { recolorIcon } from "@/lib/recolor";

const ICONS: Record<string, string> = {
  football: "football",
  basketball: "basketball",
  volleyball: "volleyball",
  tennis: "tennis",
  "table-tennis": "table-tennis",
  chess: "chess",
  running: "running-shoes",
  yoga: "dumbbell",
  swimming: "swim-goggles",
  cycling: "bottle",
  bowling: "bowling",
  boxing: "boxing",
  hockey: "hockey",
  badminton: "badminton",
  billiards: "eight-ball",
};

/** Натуральный цвет предмета, которым заменяется фиолетовый акцент иконок Figma-пака. */
const NATURAL: Record<string, string> = {
  boxing: "#D32F2F",
  "table-tennis": "#D63A2F",
  tennis: "#2F6FD1",
  bottle: "#2E9E57",
  badminton: "#D8A15E",
  dumbbell: "#9CA3AF",
  chess: "#3A3A3F",
};

/** В маленьком размере (чипы) сложная композиция не читается — показываем один предмет. */
const COMPACT: Record<string, string> = { bowling: "bowling-pin" };

export function sportIconSource(sport: Pick<Sport, "slug">, compact = false) {
  const base = (sport.slug && ICONS[sport.slug]) || "custom";
  const file = (compact && COMPACT[base]) || base;
  return { src: `/sport-icons/${file}.webp`, color: NATURAL[file] as string | undefined };
}

/** Адрес перекрашенной картинки; пока считается (или цвет не нужен), возвращает null. */
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

/** Размер задаётся через font-size: картинка занимает 1em × 1em. */
interface SportIllustrationProps {
  sport: Sport;
  className?: string;
  compact?: boolean;
}

export function SportIllustration({ sport, className, compact }: SportIllustrationProps) {
  const base = (sport.slug && ICONS[sport.slug]) || "custom";
  const file = (compact && COMPACT[base]) || base;
  const src = `/sport-icons/${file}.webp`;
  const recolorTo = NATURAL[file];
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
