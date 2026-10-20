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

/** Цвет иконки: насыщеннее и темнее цвета карточки, чтобы предмет не сливался с фоном шапки. */
export function iconColor(hex: string): string {
  const rgb = toRgb(hex);
  const gray = 0.3 * rgb[0] + 0.59 * rgb[1] + 0.11 * rgb[2];
  const vivid = rgb.map((v) => Math.min(255, Math.max(0, gray + (v - gray) * 1.45))) as RGB;
  return toHex(mix(vivid, [0, 0, 0], 0.2));
}

/**
 * Фон карточки и цвет иконки. Иконка всегда перекрашивается в тон карточки: в цвет, выбранный автором,
 * а если его нет — в цвет направления. Свой цвет на фоне чуть приглушён.
 */
export function eventPalette(event: Pick<SportEvent, "card_color" | "sport">): { background: string; tint: string } {
  if (!isHexColor(event.card_color)) return { background: event.sport.color, tint: iconColor(event.sport.color) };
  return { background: mutedColor(event.card_color), tint: iconColor(event.card_color) };
}
