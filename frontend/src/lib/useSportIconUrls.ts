import { useEffect, useState } from "react";
import type { Sport } from "@/api/types";
import { sportIconSource } from "@/components/SportIllustration";
import { recolorIcon } from "./recolor";

/**
 * Готовые адреса иконок направлений (с натуральным цветом) для мест, где нельзя поставить компонент, —
 * например, маркеры карты, которые Leaflet рисует строкой HTML. До перекраски отдаётся исходная картинка.
 */
export function useSportIconUrls(sports: Pick<Sport, "id" | "slug">[]): Record<string, string> {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = [...new Set(sports.map((s) => s.slug ?? ""))].sort().join("|");
  useEffect(() => {
    let alive = true;
    for (const slug of key.split("|")) {
      const { src, color } = sportIconSource({ slug: slug || null }, true);
      if (!color) continue;
      recolorIcon(src, color).then((url) => alive && setUrls((prev) => ({ ...prev, [src]: url })));
    }
    return () => {
      alive = false;
    };
  }, [key]);
  return urls;
}
