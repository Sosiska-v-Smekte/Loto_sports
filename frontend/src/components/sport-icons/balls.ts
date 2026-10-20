import { arc, circleAround, meanDepth, normalize, panelPath, rotator, seamPath, type Ball, type V3 } from "./sphere";

/** Все мячи рисуются в одном круге viewBox 0 0 120 120. */
export const BALL: Ball = { cx: 60, cy: 60, r: 46 };

export interface Panel {
  d: string;
  fill: string;
}

/* ---------- Футбольный мяч: усечённый икосаэдр ---------- */

const PHI = (1 + Math.sqrt(5)) / 2;
const ICOSA: V3[] = (
  [
    [0, 1, PHI], [0, -1, PHI], [0, 1, -PHI], [0, -1, -PHI],
    [1, PHI, 0], [-1, PHI, 0], [1, -PHI, 0], [-1, -PHI, 0],
    [PHI, 0, 1], [-PHI, 0, 1], [PHI, 0, -1], [-PHI, 0, -1],
  ] as V3[]
).map(normalize);

const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const mix = (a: V3, b: V3, t: number): V3 => normalize([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);

function buildFootball() {
  // Поворот подобран так, чтобы пятиугольник смотрел почти на зрителя, чуть влево-вверх
  const rot = rotator(-30, 18, 8);
  const verts = ICOSA.map(rot);
  const edgeDot = Math.max(...ICOSA.slice(1).map((v) => dot(ICOSA[0], v)));
  const neighbors = verts.map((v) => verts.filter((n) => n !== v && dot(v, n) > edgeDot - 1e-6));

  const patches: { d: string; depth: number }[] = [];
  const seams: string[] = [];
  verts.forEach((v, i) => {
    const ns = neighbors[i];
    // Соседи по кругу вокруг вершины
    const ref = ns[0];
    const ordered = [...ns].sort((a, b) => angleAround(v, ref, a) - angleAround(v, ref, b));
    const corners = ordered.map((n) => mix(v, n, 1 / 3));
    const outline = corners.flatMap((c, k) => arc(c, corners[(k + 1) % corners.length], 6));
    const d = panelPath(BALL, outline);
    if (d) patches.push({ d, depth: meanDepth(outline) });
    ordered.forEach((n) => {
      // Шов шестиугольников: средняя треть ребра икосаэдра (каждое ребро — один раз)
      if (verts.indexOf(n) > i) seams.push(seamPath(BALL, arc(mix(v, n, 1 / 3), mix(v, n, 2 / 3), 8).concat([mix(v, n, 2 / 3)])));
    });
  });
  patches.sort((a, b) => a.depth - b.depth);
  return { patches: patches.map((p) => p.d), seams: seams.filter(Boolean).join("") };
}

function angleAround(axis: V3, ref: V3, p: V3) {
  const proj = (q: V3): V3 => {
    const k = dot(q, axis);
    return [q[0] - axis[0] * k, q[1] - axis[1] * k, q[2] - axis[2] * k];
  };
  const a = proj(ref);
  const b = proj(p);
  const cross: V3 = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  return Math.atan2(dot(cross, axis), dot(a, b));
}

export const FOOTBALL = buildFootball();

/* ---------- Баскетбольный мяч ---------- */

function buildBasketball() {
  const rot = rotator(20, -38, -15);
  const lines = [
    circleAround([1, 0, 0], 90, 96),
    circleAround([0, 1, 0], 90, 96),
    // Дуги-«скобки» по бокам пересекают только один из больших кругов
    circleAround([1, 0, 0], 52, 96),
    circleAround([-1, 0, 0], 52, 96),
  ];
  return lines.map((l) => seamPath(BALL, l.map(rot), true)).join("");
}

export const BASKETBALL = buildBasketball();

/* ---------- Волейбольный мяч: 6 граней куба × 3 полосы ---------- */

const VB_COLORS = { yellow: "#ffd23c", blue: "#2f6fe0", white: "#fbfaf6" };

function buildVolleyball() {
  const rot = rotator(-24, 32, 10);
  const panels: { d: string; depth: number; fill: string }[] = [];
  const faces: { n: V3; u: V3; v: V3; colors: string[] }[] = [
    { n: [1, 0, 0], u: [0, 1, 0], v: [0, 0, 1], colors: [VB_COLORS.white, VB_COLORS.yellow, VB_COLORS.white] },
    { n: [-1, 0, 0], u: [0, 1, 0], v: [0, 0, 1], colors: [VB_COLORS.white, VB_COLORS.yellow, VB_COLORS.white] },
    { n: [0, 1, 0], u: [0, 0, 1], v: [1, 0, 0], colors: [VB_COLORS.blue, VB_COLORS.white, VB_COLORS.blue] },
    { n: [0, -1, 0], u: [0, 0, 1], v: [1, 0, 0], colors: [VB_COLORS.blue, VB_COLORS.white, VB_COLORS.blue] },
    { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0], colors: [VB_COLORS.yellow, VB_COLORS.blue, VB_COLORS.yellow] },
    { n: [0, 0, -1], u: [1, 0, 0], v: [0, 1, 0], colors: [VB_COLORS.yellow, VB_COLORS.blue, VB_COLORS.yellow] },
  ];
  const cube = (f: (typeof faces)[number], a: number, b: number): V3 => [
    f.n[0] + f.u[0] * a + f.v[0] * b,
    f.n[1] + f.u[1] * a + f.v[1] * b,
    f.n[2] + f.u[2] * a + f.v[2] * b,
  ];
  const STEPS = 12;
  for (const f of faces) {
    [-1, -1 / 3, 1 / 3].forEach((a0, k) => {
      const a1 = a0 + 2 / 3;
      const corners: [number, number][] = [
        [a0, -1],
        [a1, -1],
        [a1, 1],
        [a0, 1],
      ];
      // Рёбра идут прямо по грани куба и уже потом «надуваются» на сферу
      const outline = corners.flatMap(([a, b], i) => {
        const [na, nb] = corners[(i + 1) % 4];
        return Array.from({ length: STEPS }, (_, s) => {
          const t = s / STEPS;
          return rot(normalize(cube(f, a + (na - a) * t, b + (nb - b) * t)));
        });
      });
      const d = panelPath(BALL, outline);
      if (d) panels.push({ d, depth: meanDepth(outline), fill: f.colors[k] });
    });
  }
  panels.sort((a, b) => a.depth - b.depth);
  return panels.map(({ d, fill }) => ({ d, fill }));
}

export const VOLLEYBALL: Panel[] = buildVolleyball();

/* ---------- Теннисный мяч: классическая кривая шва ---------- */

export function tennisSeam(ball: Ball, angles: [number, number, number] = [-20, 30, -15]) {
  const rot = rotator(...angles);
  const a = 0.68;
  const b = 1 - a;
  const c = 2 * Math.sqrt(a * b);
  const pts: V3[] = Array.from({ length: 160 }, (_, i) => {
    const t = (i / 160) * Math.PI * 2;
    return rot([a * Math.cos(t) + b * Math.cos(3 * t), a * Math.sin(t) - b * Math.sin(3 * t), c * Math.sin(2 * t)]);
  });
  return seamPath(ball, pts, true);
}
