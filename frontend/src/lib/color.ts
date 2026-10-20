import type { SportEvent } from "@/api/types";

/** Палитра выбора цвета карточки. Отдельна от PALETTE в backend/app/services/sports.py: там цвета направлений. */
export const CARD_COLORS = [
  { hex: "#F6D46A", name: "Жёлтый" },
  { hex: "#F7B267", name: "Оранжевый" },
  { hex: "#F5BE92", name: "Персиковый" },
  { hex: "#F29A94", name: "Коралловый" },
  { hex: "#F2A9C8", name: "Розовый" },
  { hex: "#D9A3E3", name: "Пурпурный" },
  { hex: "#CDB8EE", name: "Сиреневый" },
  { hex: "#8DA9E8", name: "Васильковый" },
  { hex: "#AFC3EE", name: "Голубой" },
  { hex: "#9FD8F0", name: "Небесный" },
  { hex: "#8FD3D0", name: "Бирюзовый" },
  { hex: "#A9D8C6", name: "Мятный" },
  { hex: "#C3D69A", name: "Зелёный" },
  { hex: "#DDE8A0", name: "Лаймовый" },
  { hex: "#E9CF9F", name: "Песочный" },
  { hex: "#CFCBC4", name: "Серый" },
] as const;

const HEX = /^#[0-9a-f]{6}$/i;

type RGB = [number, number, number];

const toRgb = (hex: string): RGB => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as RGB;
const toHex = (rgb: RGB) => `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
const mix = (a: RGB, b: RGB, t: number): RGB => a.map((v, i) => v + (b[i] - v) * t) as RGB;

export const isHexColor = (value: string | null | undefined): value is string => Boolean(value && HEX.test(value));

/** Фон карточки: цвет чуть блеклее исходного (часть насыщенности уходит в серый, немного света добавляется). */
export function mutedColor(hex: string): string {
  const rgb = toRgb(hex);
  const gray = 0.3 * rgb[0] + 0.59 * rgb[1] + 0.11 * rgb[2];
  return toHex(mix(mix(rgb, [gray, gray, gray], 0.22), [255, 255, 255], 0.1));
}

/** Цвет иконки: заметно темнее и насыщеннее цвета карточки, чтобы предмет не сливался с фоном шапки. */
export function iconColor(hex: string): string {
  const rgb = toRgb(hex);
  const gray = 0.3 * rgb[0] + 0.59 * rgb[1] + 0.11 * rgb[2];
  const vivid = rgb.map((v) => Math.min(255, Math.max(0, gray + (v - gray) * 1.6))) as RGB;
  return toHex(mix(vivid, [0, 0, 0], 0.4));
}

function hueOf([r, g, b]: RGB): { hue: number; sat: number } {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return { hue: 0, sat: 0 };
  const d = max - min;
  let hue = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  hue *= 60;
  return { hue, sat: d / max };
}

/**
 * Цвета карточек для людей с нарушением цветовосприятия: пастельные тона палитры Okabe–Ito. Их различают
 * при протанопии, дейтеранопии и тританопии, а соседние тона отличаются ещё и яркостью.
 * Близкие оттенки (красный, зелёный, оранжевый) сводятся к нескольким хорошо различимым.
 */
const SAFE_CARD_COLORS: { from: number; hex: string }[] = [
  { from: 0, hex: "#F2B08A" }, // красные и коралловые → киноварь
  { from: 20, hex: "#F4C766" }, // оранжевые и персиковые → оранжевый
  { from: 45, hex: "#F3E67A" }, // жёлтые и песочные → жёлтый
  { from: 75, hex: "#86CDB2" }, // зелёные и мятные → сине-зелёный
  { from: 170, hex: "#A7D6F2" }, // бирюзовые и небесные → небесный
  { from: 205, hex: "#8DB4DE" }, // синие → синий
  { from: 265, hex: "#E0B3CE" }, // сиреневые, пурпурные и розовые → красно-пурпурный
  { from: 345, hex: "#F2B08A" },
];

export function safeCardColor(hex: string): string {
  const { hue, sat } = hueOf(toRgb(hex));
  if (sat < 0.12) return "#D3D0CA";
  return [...SAFE_CARD_COLORS].reverse().find((c) => hue >= c.from)!.hex;
}

/**
 * Фон карточки и цвет иконки. Иконка всегда перекрашивается в тон карточки: в цвет, выбранный автором,
 * а если его нет — в цвет направления. Свой цвет на фоне чуть приглушён.
 * colorSafe: режим для людей с нарушением цветовосприятия, цвета заменяются различимыми.
 */
export function eventPalette(
  event: Pick<SportEvent, "card_color" | "sport">,
  colorSafe = false,
): { background: string; tint: string } {
  const own = isHexColor(event.card_color);
  const base = own ? event.card_color! : event.sport.color;
  if (colorSafe) {
    const safe = safeCardColor(base);
    return { background: safe, tint: iconColor(safe) };
  }
  return { background: own ? mutedColor(base) : base, tint: iconColor(base) };
}
