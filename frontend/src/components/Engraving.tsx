import type { CSSProperties } from "react";
import { findPattern } from "@/lib/engraving";

/**
 * Гравировка цветной плашки. Узор вырезан в цвете самой плашки: тёмная линия и светлый блик на пиксель ниже,
 * поэтому подходит к любому цвету карточки. Родителю нужны relative и isolate: слой лежит под содержимым.
 */
export function Engraving({ pattern }: { pattern: string | null | undefined }) {
  const info = findPattern(pattern);
  if (!info) return null;
  const mask: CSSProperties = {
    maskImage: `url(${info.src})`,
    WebkitMaskImage: `url(${info.src})`,
    maskSize: info.size,
    WebkitMaskSize: info.size,
    maskRepeat: info.repeat,
    WebkitMaskRepeat: info.repeat,
    maskPosition: "center",
    WebkitMaskPosition: "center",
  };
  return (
    <span aria-hidden className="engraving pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]">
      <span className="absolute inset-0 translate-y-px bg-white/55" style={mask} />
      <span className="absolute inset-0 bg-black/[0.13]" style={mask} />
    </span>
  );
}
