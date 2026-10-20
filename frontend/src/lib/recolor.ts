/**
 * Перекраска 3D-иконки под цвет карточки. Основной цвет картинки заменяется выбранным, светотень и блики
 * сохраняются, поэтому объём и мелкие детали (швы, полосы, отверстия) остаются как в исходном рендере.
 * Считается в браузере через canvas и кэшируется по паре «иконка + цвет». Если основного цвета нет
 * (например, футбольный мяч чёрно-белый), возвращается исходная картинка.
 */

type HSL = [number, number, number]; // h — градусы, s и l — 0..1

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Корзины гистограммы (по 10°) с фиолетовым акцентом Figma-пака: 240–289°. */
const ACCENT_FROM = 24;
const ACCENT_TO = 28;

function rgbToHsl(r: number, g: number, b: number): HSL {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

function hueToChannel(p: number, q: number, t: number) {
  const x = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
  if (x < 1 / 6) return p + (q - p) * 6 * x;
  if (x < 1 / 2) return q;
  if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
  return p;
}

function hslToRgb([h, s, l]: HSL): [number, number, number] {
  if (s === 0) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const k = h / 360;
  return [hueToChannel(p, q, k + 1 / 3), hueToChannel(p, q, k), hueToChannel(p, q, k - 1 / 3)];
}

const circularDistance = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

/** Насыщенные пиксели, которые относятся к основному цвету иконки: плавный переход, без жёсткой границы. */
function weightOf(hue: number, sat: number, source: HSL) {
  const wHue = clamp01((45 - circularDistance(hue, source[0])) / 25);
  const wSat = clamp01((sat - 0.12) / 0.18);
  return wHue * wSat;
}

/**
 * Перекрашиваемый цвет иконки. У иконок Figma-пака это фиолетовый акцент (оттенок 240–289°), даже если на картинке
 * больше другого цвета (у тенниса — жёлтый мяч). Без фиолетового — самый частый оттенок среди насыщенных пикселей.
 * Null, если цветных пикселей мало.
 */
function dominantColour(px: Uint8ClampedArray): HSL | null {
  const bins = new Array<number>(36).fill(0);
  let coloured = 0;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < 200) continue;
    const [h, s, l] = rgbToHsl(px[i] / 255, px[i + 1] / 255, px[i + 2] / 255);
    if (s < 0.3 || l < 0.15 || l > 0.9) continue;
    bins[Math.floor(h / 10) % 36] += 1;
    coloured += 1;
  }
  if (coloured < 500) return null;
  const accent = bins.slice(ACCENT_FROM, ACCENT_TO + 1);
  const peak =
    accent.reduce((sum, n) => sum + n, 0) >= 500
      ? ACCENT_FROM + accent.indexOf(Math.max(...accent))
      : bins.indexOf(Math.max(...bins));
  const centre = peak * 10 + 5;
  let x = 0;
  let y = 0;
  let sat = 0;
  let light = 0;
  let count = 0;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < 200) continue;
    const [h, s, l] = rgbToHsl(px[i] / 255, px[i + 1] / 255, px[i + 2] / 255);
    if (s < 0.3 || l < 0.15 || l > 0.9 || circularDistance(h, centre) > 20) continue;
    x += Math.cos((h * Math.PI) / 180);
    y += Math.sin((h * Math.PI) / 180);
    sat += s;
    light += l;
    count += 1;
  }
  if (count === 0) return null;
  const hue = (Math.atan2(y, x) * 180) / Math.PI;
  return [(hue + 360) % 360, sat / count, light / count];
}

function paint(img: HTMLImageElement, hex: string): string | null {
  const { naturalWidth: width, naturalHeight: height } = img;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, width, height);
  const px = data.data;

  const source = dominantColour(px);
  if (!source) return null;

  const target = rgbToHsl(
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  );
  const sourceLight = Math.max(source[2], 0.05);

  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] === 0) continue;
    const [h, s, l] = rgbToHsl(px[i] / 255, px[i + 1] / 255, px[i + 2] / 255);
    const w = weightOf(h, s, source);
    if (w === 0) continue;
    // Светотень исходного пикселя переносится на новый цвет: тёмное остаётся тёмным, блик — светлым
    const [r, g, b] = hslToRgb([target[0], target[1], clamp01((l * target[2]) / sourceLight)]);
    px[i] += (r * 255 - px[i]) * w;
    px[i + 1] += (g * 255 - px[i + 1]) * w;
    px[i + 2] += (b * 255 - px[i + 2]) * w;
  }

  ctx.putImageData(data, 0, 0);
  return canvas.toDataURL("image/png");
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

const cache = new Map<string, Promise<string>>();

/** Адрес картинки той же иконки, перекрашенной в цвет hex (#RRGGBB). При ошибке или без основного цвета — исходный src. */
export function recolorIcon(src: string, hex: string): Promise<string> {
  const key = `${src}|${hex}`;
  let result = cache.get(key);
  if (!result) {
    result = loadImage(src)
      .then((img) => paint(img, hex) ?? src)
      .catch(() => src);
    cache.set(key, result);
  }
  return result;
}
