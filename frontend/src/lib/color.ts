import type { SportEvent } from "@/api/types";

/** Палитра карточек. Значения совпадают с PALETTE в backend/app/services/sports.py. */
export const CARD_COLORS = [
  { hex: "#F6D46A", name: "Жёлтый" },
  { hex: "#F2A9C8", name: "Розовый" },
  { hex: "#AFC3EE", name: "Голубой" },
  { hex: "#C3D69A", name: "Зелёный" },
  { hex: "#F5BE92", name: "Персиковый" },
  { hex: "#CDB8EE", name: "Сиреневый" },
  { hex: "#A9D8C6", name: "Мятный" },
  { hex: "#E9CF9F", name: "Песочный" },
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

/** Тона для иконки: светлая сторона и тень одного цвета, из них собирается объём. */
export function iconTones(hex: string): { light: string; dark: string } {
  const rgb = toRgb(hex);
  return { light: toHex(mix(rgb, [255, 255, 255], 0.35)), dark: toHex(mix(rgb, [0, 0, 0], 0.4)) };
}

/**
 * Фон карточки и цвет иконки. Если автор выбрал свой цвет, фон приглушён, а иконка перекрашивается в его тона;
 * иначе карточка выглядит как раньше: цвет направления и 3D-иконка.
 */
export function eventPalette(event: Pick<SportEvent, "card_color" | "sport">): { background: string; tint?: string } {
  if (!isHexColor(event.card_color)) return { background: event.sport.color };
  return { background: mutedColor(event.card_color), tint: event.card_color };
}
