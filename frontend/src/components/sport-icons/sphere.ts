/**
 * Мини-движок для мячей: швы и панели задаются на единичной сфере в 3D,
 * поворачиваются и проецируются на плоскость. Так линии ложатся по поверхности,
 * а не нарисованы «плоско» поверх круга.
 */
export type V3 = [number, number, number];

export const normalize = ([x, y, z]: V3): V3 => {
  const l = Math.hypot(x, y, z) || 1;
  return [x / l, y / l, z / l];
};

const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** Поворот на углы (в градусах) вокруг осей X, затем Y, затем Z. */
export function rotator(ax: number, ay: number, az: number) {
  const [rx, ry, rz] = [ax, ay, az].map((d) => (d * Math.PI) / 180);
  return ([x, y, z]: V3): V3 => {
    const y1 = y * Math.cos(rx) - z * Math.sin(rx);
    const z1 = y * Math.sin(rx) + z * Math.cos(rx);
    const x2 = x * Math.cos(ry) + z1 * Math.sin(ry);
    const z2 = -x * Math.sin(ry) + z1 * Math.cos(ry);
    return [x2 * Math.cos(rz) - y1 * Math.sin(rz), x2 * Math.sin(rz) + y1 * Math.cos(rz), z2];
  };
}

/** Точки отрезка a→b, «натянутого» на сферу. */
export function arc(a: V3, b: V3, steps = 10): V3[] {
  return Array.from({ length: steps }, (_, i) => normalize(lerp(a, b, i / steps)));
}

export interface Ball {
  cx: number;
  cy: number;
  r: number;
}

const fmt = (n: number) => n.toFixed(2);
const project = ({ cx, cy, r }: Ball, p: V3) => `${fmt(cx + p[0] * r)} ${fmt(cy - p[1] * r)}`;

/** Видимая часть линии на сфере: участки на обратной стороне отбрасываются. */
export function seamPath(ball: Ball, points: V3[], closed = false): string {
  const pts = closed ? [...points, points[0]] : points;
  let d = "";
  let drawing = false;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (p[2] >= 0) {
      if (!drawing && i > 0 && pts[i - 1][2] < 0) {
        // Точка пересечения с краем диска, чтобы шов уходил ровно за горизонт
        const q = pts[i - 1];
        const t = q[2] / (q[2] - p[2]);
        d += `M${project(ball, normalize(lerp(q, p, t)))}L${project(ball, p)}`;
      } else {
        d += `${drawing ? "L" : "M"}${project(ball, p)}`;
      }
      drawing = true;
    } else if (drawing) {
      const q = pts[i - 1];
      const t = q[2] / (q[2] - p[2]);
      d += `L${project(ball, normalize(lerp(q, p, t)))}`;
      drawing = false;
    }
  }
  return d;
}

/** Залитая панель на сфере. Точки за горизонтом прижимаются к краю диска. */
export function panelPath(ball: Ball, points: V3[]): string | null {
  if (points.every((p) => p[2] < 0)) return null;
  const flat = points.map((p): V3 => {
    if (p[2] >= 0) return p;
    const l = Math.hypot(p[0], p[1]) || 1;
    return [p[0] / l, p[1] / l, 0];
  });
  return `M${flat.map((p) => project(ball, p)).join("L")}Z`;
}

export const meanDepth = (points: V3[]) => points.reduce((s, p) => s + p[2], 0) / points.length;

/** Окружность на сфере вокруг оси axis с угловым радиусом angle (в градусах). */
export function circleAround(axis: V3, angle: number, steps = 72): V3[] {
  const a = normalize(axis);
  const helper: V3 = Math.abs(a[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  const u = normalize([
    a[1] * helper[2] - a[2] * helper[1],
    a[2] * helper[0] - a[0] * helper[2],
    a[0] * helper[1] - a[1] * helper[0],
  ]);
  const v: V3 = [a[1] * u[2] - a[2] * u[1], a[2] * u[0] - a[0] * u[2], a[0] * u[1] - a[1] * u[0]];
  const th = (angle * Math.PI) / 180;
  return Array.from({ length: steps }, (_, i) => {
    const t = (i / steps) * Math.PI * 2;
    return normalize([
      a[0] * Math.cos(th) + Math.sin(th) * (u[0] * Math.cos(t) + v[0] * Math.sin(t)),
      a[1] * Math.cos(th) + Math.sin(th) * (u[1] * Math.cos(t) + v[1] * Math.sin(t)),
      a[2] * Math.cos(th) + Math.sin(th) * (u[2] * Math.cos(t) + v[2] * Math.sin(t)),
    ]);
  });
}
