/**
 * Рендер 3D-иконок направлений (three.js, PBR-освещение студии).
 * Как перегенерировать — см. README.md рядом. Каждая модель собирается из примитивов
 * и экспортируется в public/sport-icons/<slug>.webp с прозрачным фоном.
 */
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const RENDER = 1024;
const OUTPUT = 384;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(RENDER, RENDER);
renderer.setClearColor(0x000000, 0);
// Neutral сохраняет насыщенность цветов лучше ACES
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const pmrem = new THREE.PMREMGenerator(renderer);
const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

/* ---------------- Материалы ---------------- */

const plastic = (color, extra = {}) =>
  new THREE.MeshPhysicalMaterial({ color, roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.2, ...extra });
const matte = (color, extra = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.6, ...extra });
const metal = (color, extra = {}) => new THREE.MeshPhysicalMaterial({ color, metalness: 1, roughness: 0.28, ...extra });
const vertexColored = (extra = {}) =>
  new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.25, ...extra });

const mesh = (geo, mat) => new THREE.Mesh(geo, mat);
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const smooth = (geo) => {
  const g = mergeVertices(geo.index ? geo.toNonIndexed() : geo, 1e-4);
  g.computeVertexNormals();
  return g;
};

/** Капсула между двумя точками — трубки рамы, шнурки, перемычки. */
function rod(a, b, r, mat) {
  const len = a.distanceTo(b);
  const m = mesh(new THREE.CapsuleGeometry(r, len, 8, 24), mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize());
  return m;
}

function extrude(shape, depth, bevel, mat, segments = 8) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: segments,
    curveSegments: 64,
  });
  geo.translate(0, 0, -depth / 2);
  return mesh(geo, mat);
}

/* ---------------- Мячи: сфера с цветом и рельефом швов по вершинам ---------------- */

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function ballGeometry({ color, seam, depth = 0.025, width = 0.035 }) {
  const geo = new THREE.SphereGeometry(1, 360, 180);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const p = new THREE.Vector3();
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i).normalize();
    const d = seam(p); // угловое расстояние до ближайшего шва
    const groove = 1 - smoothstep(0, width, d);
    // Панели слегка «надуты» к центру, у шва — канавка
    const r = 1 - depth * groove + 0.006 * smoothstep(width, width * 4, d);
    pos.setXYZ(i, p.x * r, p.y * r, p.z * r);
    color(p, d, c);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

const PHI = (1 + Math.sqrt(5)) / 2;
const ICOSA = [
  [0, 1, PHI], [0, -1, PHI], [0, 1, -PHI], [0, -1, -PHI],
  [1, PHI, 0], [-1, PHI, 0], [1, -PHI, 0], [-1, -PHI, 0],
  [PHI, 0, 1], [-PHI, 0, 1], [PHI, 0, -1], [-PHI, 0, -1],
].map(([x, y, z]) => V(x, y, z).normalize());

function icosaFaces() {
  const edge = ICOSA[0].distanceTo(ICOSA.slice(1).reduce((a, b) => (ICOSA[0].distanceTo(a) < ICOSA[0].distanceTo(b) ? a : b)));
  const faces = [];
  for (let i = 0; i < 12; i++)
    for (let j = i + 1; j < 12; j++)
      for (let k = j + 1; k < 12; k++) {
        const [a, b, c] = [ICOSA[i], ICOSA[j], ICOSA[k]];
        if ([a.distanceTo(b), b.distanceTo(c), a.distanceTo(c)].every((d) => Math.abs(d - edge) < 1e-3))
          faces.push(a.clone().add(b).add(c).normalize());
      }
  return faces;
}

function football() {
  // Усечённый икосаэдр: 12 пятиугольников (вершины икосаэдра) и 20 шестиугольников (его грани)
  const hex = icosaFaces();
  const faces = [...ICOSA.map((n) => ({ n, k: 1 / 0.9045, pent: true })), ...hex.map((n) => ({ n, k: 1 / 0.8813, pent: false }))];
  // k нормирует расстояние до плоскости грани: точка относится к грани, плоскость которой ближе к сфере
  const classify = (p) => {
    let best = -Infinity;
    let second = -Infinity;
    let face = null;
    for (const f of faces) {
      const s = p.dot(f.n) * f.k;
      if (s > best) {
        second = best;
        best = s;
        face = f;
      } else if (s > second) second = s;
    }
    return { face, gap: best - second };
  };
  const geo = ballGeometry({
    seam: (p) => classify(p).gap * 1.6,
    color: (p, d, c) => {
      const { face } = classify(p);
      if (d < 0.012) c.set("#6f6b66");
      else c.set(face.pent ? "#1d1d22" : "#f6f4ef");
    },
    width: 0.03,
    depth: 0.02,
  });
  const ball = mesh(geo, vertexColored({ roughness: 0.3 }));
  ball.rotation.set(-0.5, 0.3, 0.15);
  return ball;
}

function basketball() {
  const ax = V(1, 0, 0);
  const geo = ballGeometry({
    seam: (p) =>
      Math.min(
        Math.abs(Math.asin(p.x)),
        Math.abs(Math.asin(p.y)),
        Math.abs(Math.acos(Math.min(1, p.dot(ax))) - 0.92),
        Math.abs(Math.acos(Math.min(1, -p.dot(ax))) - 0.92),
      ),
    color: (p, d, c) => (d < 0.02 ? c.set("#2b160b") : c.set("#e8692c")),
    width: 0.035,
    depth: 0.03,
  });
  const ball = mesh(geo, vertexColored({ roughness: 0.55, clearcoat: 0.25 }));
  ball.rotation.set(0.35, -0.65, -0.25);
  return ball;
}

function volleyball() {
  const COLORS = { x: ["#fbfaf5", "#ffcf2e", "#fbfaf5"], y: ["#2f6ee0", "#fbfaf5", "#2f6ee0"], z: ["#ffcf2e", "#2f6ee0", "#ffcf2e"] };
  const panel = (p) => {
    const a = [Math.abs(p.x), Math.abs(p.y), Math.abs(p.z)];
    const m = Math.max(...a);
    const axis = a.indexOf(m);
    const q = [p.x / m, p.y / m, p.z / m];
    // Полосы на соседних гранях идут поперёк друг друга
    const u = axis === 0 ? q[1] : axis === 1 ? q[2] : q[0];
    const v = axis === 0 ? q[2] : axis === 1 ? q[0] : q[1];
    return { axis: "xyz"[axis], u, v };
  };
  const geo = ballGeometry({
    seam: (p) => {
      const { u, v } = panel(p);
      return Math.min(Math.abs(u - 1 / 3), Math.abs(u + 1 / 3), 1 - Math.abs(u), 1 - Math.abs(v)) * 0.75;
    },
    color: (p, d, c) => {
      const { axis, u } = panel(p);
      if (d < 0.01) c.set("#8d8a84");
      else c.set(COLORS[axis][u < -1 / 3 ? 0 : u < 1 / 3 ? 1 : 2]);
    },
    width: 0.03,
    depth: 0.02,
  });
  const ball = mesh(geo, vertexColored({ roughness: 0.38 }));
  ball.rotation.set(-0.4, 0.55, 0.2);
  return ball;
}

function tennisBall(radius = 1) {
  const a = 0.68;
  const b = 1 - a;
  const cz = 2 * Math.sqrt(a * b);
  const curve = Array.from({ length: 500 }, (_, i) => {
    const t = (i / 500) * Math.PI * 2;
    return V(a * Math.cos(t) + b * Math.cos(3 * t), a * Math.sin(t) - b * Math.sin(3 * t), cz * Math.sin(2 * t)).normalize();
  });
  const geo = ballGeometry({
    seam: (p) => {
      let best = 1;
      for (const q of curve) best = Math.min(best, 1 - p.dot(q));
      return Math.sqrt(2 * best);
    },
    color: (p, d, c) => (d < 0.045 ? c.set("#fbfbf2") : c.set("#cfe33a")),
    width: 0.06,
    depth: 0.012,
  });
  const ball = mesh(geo, vertexColored({ roughness: 0.85, clearcoat: 0, sheen: 1, sheenRoughness: 0.6, sheenColor: new THREE.Color("#f4ffb0") }));
  ball.scale.setScalar(radius);
  return ball;
}

/* ---------------- Ракетка ---------------- */

function tennis() {
  const g = new THREE.Group();
  const pink = plastic("#f07cb3");
  const rx = 0.78;
  const ry = 1;
  const ellipse = new THREE.CatmullRomCurve3(
    Array.from({ length: 96 }, (_, i) => {
      const t = (i / 96) * Math.PI * 2;
      return V(rx * Math.cos(t), ry * Math.sin(t) + 1.05, 0);
    }),
    true,
  );
  g.add(mesh(new THREE.TubeGeometry(ellipse, 240, 0.085, 24, true), pink));
  // Жёлтые бамперы по бокам обода
  for (const side of [-1, 1]) {
    const arc = new THREE.CatmullRomCurve3(
      Array.from({ length: 12 }, (_, i) => {
        const t = -0.55 + (i / 11) * 1.1;
        return V(side * (rx + 0.005) * Math.cos(t), ry * Math.sin(t) + 1.05, 0);
      }),
    );
    g.add(mesh(new THREE.TubeGeometry(arc, 40, 0.095, 20), plastic("#ffd23c")));
  }
  // Струны
  const stringMat = plastic("#fff4fa", { roughness: 0.5, clearcoat: 0.2 });
  const step = 0.13;
  for (let x = -rx + step; x < rx - 0.02; x += step) {
    const h = ry * Math.sqrt(Math.max(0, 1 - (x / rx) ** 2));
    g.add(rod(V(x, 1.05 - h, 0), V(x, 1.05 + h, 0), 0.014, stringMat));
  }
  for (let y = -ry + step; y < ry - 0.02; y += step) {
    const w = rx * Math.sqrt(Math.max(0, 1 - (y / ry) ** 2));
    g.add(rod(V(-w, 1.05 + y, 0.004), V(w, 1.05 + y, 0.004), 0.014, stringMat));
  }
  // Горло и рукоять
  const throat = (side) =>
    new THREE.CatmullRomCurve3([V(side * 0.55, 0.32, 0), V(side * 0.3, -0.05, 0), V(side * 0.08, -0.3, 0), V(0, -0.42, 0)]);
  g.add(mesh(new THREE.TubeGeometry(throat(1), 60, 0.075, 20), pink));
  g.add(mesh(new THREE.TubeGeometry(throat(-1), 60, 0.075, 20), pink));
  g.add(rod(V(0, -0.45, 0), V(0, -0.8, 0), 0.085, pink));
  g.add(rod(V(0, -0.8, 0), V(0, -1.75, 0), 0.12, plastic("#3d7be8", { roughness: 0.5 })));
  // Обмотка рукояти
  const wrap = new THREE.CatmullRomCurve3(
    Array.from({ length: 120 }, (_, i) => {
      const t = i / 119;
      const a = t * Math.PI * 2 * 7;
      return V(0.125 * Math.cos(a), -0.85 - t * 0.85, 0.125 * Math.sin(a));
    }),
  );
  g.add(mesh(new THREE.TubeGeometry(wrap, 600, 0.018, 8), plastic("#2856bd", { roughness: 0.55 })));
  g.add(rod(V(0, -1.8, 0), V(0, -1.9, 0), 0.135, plastic("#1f3f96")));
  g.rotation.set(0.35, -0.45, -0.55);

  const root = new THREE.Group();
  root.add(g);
  const ball = tennisBall(0.42);
  ball.position.set(-0.95, 1.1, 0.5);
  ball.rotation.set(0.4, 0.8, 0);
  root.add(ball);
  return root;
}

/* ---------------- Настольный теннис ---------------- */

function tableTennis() {
  const g = new THREE.Group();
  const blade = new THREE.Shape();
  blade.absellipse(0, 0, 0.95, 1, 0, Math.PI * 2);
  const wood = matte("#d9a464", { roughness: 0.55 });
  g.add(extrude(blade, 0.06, 0.03, wood));
  const front = extrude(blade, 0.02, 0.02, plastic("#e23a2c", { roughness: 0.45, clearcoat: 0.3 }));
  front.position.z = 0.07;
  front.scale.set(0.985, 0.985, 1);
  g.add(front);
  const back = extrude(blade, 0.02, 0.02, matte("#25242a"));
  back.position.z = -0.07;
  back.scale.set(0.985, 0.985, 1);
  g.add(back);
  // Ручка с расширением к лопасти
  const handle = new THREE.Shape();
  handle.moveTo(-0.32, -0.72);
  handle.bezierCurveTo(-0.16, -0.95, -0.15, -1.05, -0.15, -1.15);
  handle.lineTo(-0.15, -1.9);
  handle.quadraticCurveTo(0, -2.02, 0.15, -1.9);
  handle.lineTo(0.15, -1.15);
  handle.bezierCurveTo(0.15, -1.05, 0.16, -0.95, 0.32, -0.72);
  handle.closePath();
  g.add(extrude(handle, 0.18, 0.06, wood));
  g.rotation.set(-0.25, 0.65, 0.55);

  const root = new THREE.Group();
  root.add(g);
  const ball = mesh(new THREE.SphereGeometry(0.24, 64, 32), plastic("#fffaf0", { roughness: 0.25 }));
  ball.position.set(1.0, 1.0, 0.4);
  root.add(ball);
  return root;
}

/* ---------------- Шахматный конь ---------------- */

function chess() {
  const g = new THREE.Group();
  const blue = plastic("#5577ee");
  // Основание — тело вращения со ступеньками
  const profile = [
    [0, 0], [0.95, 0], [1.0, 0.04], [1.0, 0.16], [0.96, 0.22], [0.82, 0.26], [0.8, 0.34], [0.84, 0.4], [0.8, 0.46],
    [0.66, 0.5], [0.6, 0.56], [0.64, 0.62], [0.6, 0.68], [0, 0.68],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const lathe = new THREE.LatheGeometry(new THREE.SplineCurve(profile).getPoints(120), 128);
  g.add(mesh(lathe, blue));
  // Голова: профиль коня, выдавленный со скруглением
  const s = new THREE.Shape();
  const P = (x, y) => [(x - 60) / 30, (86 - y) / 30 + 0.62];
  const path = [
    ["m", 40, 86],
    ["c", 39, 76, 43, 68, 50, 61],
    ["c", 44, 62, 37, 64, 31, 62.5],
    ["c", 25, 61, 21.5, 56, 22.5, 50],
    ["c", 23.5, 45, 27.5, 42, 32, 38.5],
    ["c", 37, 34, 42, 28, 46, 22],
    ["c", 47, 19, 47.5, 15, 49, 11],
    ["c", 52, 13, 55, 16.5, 57, 20],
    ["c", 70, 20.5, 81, 30, 85, 45],
    ["c", 88.5, 59, 85, 73, 81, 86],
  ];
  for (const [cmd, ...a] of path) {
    if (cmd === "m") s.moveTo(...P(a[0], a[1]));
    else s.bezierCurveTo(...P(a[0], a[1]), ...P(a[2], a[3]), ...P(a[4], a[5]));
  }
  s.closePath();
  const head = extrude(s, 0.38, 0.16, blue, 12);
  head.geometry = smooth(head.geometry);
  g.add(head);
  // Глаза и ноздри
  const dark = plastic("#1b2a6b");
  for (const z of [-0.36, 0.36]) {
    const eye = mesh(new THREE.SphereGeometry(0.07, 32, 16), dark);
    eye.position.set(...P(45.5, 34), z);
    eye.scale.set(1, 0.85, 0.5);
    g.add(eye);
    const nostril = mesh(new THREE.SphereGeometry(0.045, 24, 12), dark);
    nostril.position.set(...P(27.5, 48.5), z * 0.85);
    nostril.scale.set(1, 0.7, 0.5);
    g.add(nostril);
  }
  // Грива — гребень из капсул
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const [x, y] = P(78 + 8 * Math.sin(t * 2.4), 30 + t * 48);
    const ridge = rod(V(x - 0.02, y + 0.12, 0), V(x + 0.06, y - 0.12, 0), 0.08, plastic("#4a6be0"));
    g.add(ridge);
  }
  g.rotation.set(0.12, -0.55, 0);
  return g;
}

/* ---------------- Кроссовок ---------------- */

function running() {
  const g = new THREE.Group();
  // Верх: «надутая» полусфера, вытянутая в форму стопы — высокая пятка, низкий носок
  const h = (x0) => 0.52 + 0.55 * smoothstep(0.85, -0.55, x0);
  const w = (x0) => 1 - 0.18 * smoothstep(-0.2, -1, x0);
  const geo = new THREE.SphereGeometry(1, 160, 80);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x0 = pos.getX(i);
    const y0 = pos.getY(i);
    const z0 = pos.getZ(i);
    pos.setXYZ(i, x0 * 1.35, (y0 < 0 ? y0 * 0.04 : y0) * h(x0), z0 * 0.52 * w(x0));
  }
  geo.computeVertexNormals();
  g.add(mesh(geo, plastic("#f2633a", { roughness: 0.4 })));
  const top = (x) => {
    const x0 = x / 1.35;
    return Math.sqrt(Math.max(0, 1 - x0 * x0)) * h(x0);
  };
  // Подошва: контур стопы сверху, выдавлен вниз
  const sole = new THREE.Shape();
  sole.absellipse(0, 0, 1.47, 0.62, 0, Math.PI * 2);
  const soleMesh = extrude(sole, 0.2, 0.07, matte("#f7f4ee", { roughness: 0.45 }));
  soleMesh.rotation.x = Math.PI / 2;
  soleMesh.position.y = -0.12;
  g.add(soleMesh);
  const tread = extrude(sole, 0.05, 0.03, matte("#59606c"));
  tread.rotation.x = Math.PI / 2;
  tread.position.y = -0.27;
  tread.scale.set(0.98, 0.98, 1);
  g.add(tread);
  // Полоса по боку подошвы
  const band = mesh(new THREE.TorusGeometry(1, 0.025, 8, 160), plastic("#ffb38f"));
  band.rotation.x = Math.PI / 2;
  band.scale.set(1.5, 0.66, 1);
  band.position.y = -0.04;
  g.add(band);
  // Горловина: тёмный проём с мягким кантом
  const opening = mesh(new THREE.SphereGeometry(1, 48, 24), plastic("#3b1b12", { roughness: 0.6 }));
  opening.position.set(-0.78, top(-0.78) - 0.02, 0);
  opening.scale.set(0.34, 0.07, 0.24);
  g.add(opening);
  const collar = mesh(new THREE.TorusGeometry(1, 0.06, 16, 64), plastic("#ff8e66"));
  collar.position.copy(opening.position).add(V(0, 0.02, 0));
  collar.rotation.x = Math.PI / 2;
  collar.scale.set(0.36, 0.26, 1);
  g.add(collar);
  // Язычок и шнурки по подъёму
  g.add(rod(V(-0.48, top(-0.48) + 0.06, 0), V(0.15, top(0.15) + 0.03, 0), 0.11, plastic("#ff9a74")));
  const laceMat = plastic("#ffffff", { roughness: 0.45 });
  for (let i = 0; i < 5; i++) {
    const x = -0.36 + i * 0.13;
    const y = top(x) + 0.07;
    g.add(rod(V(x + 0.03, y, -0.22), V(x - 0.03, y, 0.22), 0.03, laceMat));
  }
  // Задник и мысок другого оттенка
  const heel = mesh(new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), plastic("#d94b26"));
  heel.position.set(-1.12, 0, 0);
  heel.scale.set(0.3, 0.5, 0.42);
  g.add(heel);
  g.rotation.set(0.42, -0.62, 0.04);
  return g;
}

/* ---------------- Коврик для йоги ---------------- */

function yoga() {
  const g = new THREE.Group();
  const teal = plastic("#22b893", { roughness: 0.5, clearcoat: 0.4 });
  const turns = 3.2;
  const thick = 0.06;
  const r0 = 0.12;
  const pitch = 0.085;
  const N = 400;
  const outer = [];
  const inner = [];
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * turns * Math.PI * 2;
    const r = r0 + (pitch * t) / (Math.PI * 2);
    outer.push(new THREE.Vector2((r + thick) * Math.cos(t), (r + thick) * Math.sin(t)));
    inner.push(new THREE.Vector2(r * Math.cos(t), r * Math.sin(t)));
  }
  const shape = new THREE.Shape([...outer, ...inner.reverse()]);
  const roll = extrude(shape, 2.0, 0.025, teal, 4);
  roll.rotation.y = Math.PI / 2;
  g.add(roll);
  // Ремешки
  const R = r0 + pitch * turns + thick + 0.02;
  for (const x of [-0.55, 0.55]) {
    const strap = mesh(new THREE.TorusGeometry(R, 0.035, 12, 96), plastic("#f2b45a", { roughness: 0.5 }));
    strap.rotation.y = Math.PI / 2;
    strap.position.x = x;
    strap.scale.set(1, 1, 2.2);
    g.add(strap);
  }
  g.rotation.set(0.3, -0.85, 0);
  return g;
}

/* ---------------- Спасательный круг ---------------- */

function swimming() {
  const g = new THREE.Group();
  const geo = new THREE.TorusGeometry(1, 0.4, 96, 240);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const a = Math.atan2(pos.getY(i), pos.getX(i));
    const seg = Math.floor(((a + Math.PI / 4 + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 2));
    c.set(seg % 2 ? "#f8f5ee" : "#ea4434");
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  g.add(mesh(geo, vertexColored({ roughness: 0.3 })));
  // Верёвка по внешнему краю с креплениями
  const ropeMat = matte("#e9d9b5", { roughness: 0.8 });
  g.add(mesh(new THREE.TorusGeometry(1.42, 0.035, 12, 200), ropeMat));
  for (let k = 0; k < 4; k++) {
    const a = k * (Math.PI / 2);
    const loop = mesh(new THREE.TorusGeometry(0.42, 0.04, 12, 48), ropeMat);
    loop.position.set(Math.cos(a), Math.sin(a), 0);
    loop.rotation.set(0, 0, a);
    loop.rotateY(Math.PI / 2);
    g.add(loop);
  }
  g.rotation.set(-0.55, 0.35, 0.1);
  return g;
}

/* ---------------- Велосипед ---------------- */

function cycling() {
  const g = new THREE.Group();
  const frame = plastic("#3d7ff0");
  const tire = matte("#26262c", { roughness: 0.7 });
  const chrome = metal("#d9dde3", { roughness: 0.2 });
  const wheel = (x) => {
    const w = new THREE.Group();
    w.add(mesh(new THREE.TorusGeometry(0.62, 0.075, 24, 96), tire));
    w.add(mesh(new THREE.TorusGeometry(0.54, 0.025, 12, 96), chrome));
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      w.add(rod(V(0, 0, (i % 2 ? 1 : -1) * 0.04), V(0.53 * Math.cos(a), 0.53 * Math.sin(a), 0), 0.007, chrome));
    }
    const hub = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.14, 24), chrome);
    hub.rotation.x = Math.PI / 2;
    w.add(hub);
    w.position.x = x;
    return w;
  };
  g.add(wheel(-1.05), wheel(1.05));
  const rear = V(-1.05, 0);
  const front = V(1.05, 0);
  const bb = V(-0.1, -0.05);
  const seat = V(-0.38, 0.88);
  const headTop = V(0.7, 0.85);
  const headBottom = V(0.78, 0.55);
  const r = 0.055;
  for (const z of [-0.07, 0.07]) {
    g.add(rod(V(bb.x, bb.y, z), V(rear.x, rear.y, z), 0.035, frame));
    g.add(rod(V(seat.x, seat.y - 0.1, z), V(rear.x, rear.y, z), 0.03, frame));
    g.add(rod(V(headBottom.x, headBottom.y, z), V(front.x, front.y, z), 0.035, frame));
  }
  g.add(rod(bb, seat, r, frame), rod(V(seat.x, seat.y - 0.05), headTop, r, frame), rod(bb, headBottom, r * 1.1, frame));
  g.add(rod(headBottom, headTop, r * 1.15, frame));
  // Седло и руль
  g.add(rod(seat, V(seat.x - 0.04, seat.y + 0.2), 0.03, chrome));
  const saddle = mesh(new THREE.SphereGeometry(0.2, 32, 16), plastic("#2b2a30", { roughness: 0.5 }));
  saddle.position.set(seat.x - 0.05, seat.y + 0.26, 0);
  saddle.scale.set(1.35, 0.32, 0.6);
  g.add(saddle);
  g.add(rod(headTop, V(0.66, 1.08), 0.03, chrome));
  g.add(rod(V(0.66, 1.08, -0.38), V(0.66, 1.08, 0.38), 0.03, chrome));
  for (const z of [-0.36, 0.36]) g.add(rod(V(0.66, 1.08, z), V(0.66, 1.08, z * 1.12), 0.045, plastic("#2b2a30")));
  // Каретка, шатун, педаль
  const ring = mesh(new THREE.TorusGeometry(0.16, 0.025, 12, 48), chrome);
  ring.position.set(bb.x, bb.y, 0.1);
  g.add(ring);
  g.add(rod(V(bb.x, bb.y, 0.12), V(bb.x + 0.12, bb.y - 0.2, 0.14), 0.025, chrome));
  g.add(rod(V(bb.x + 0.05, bb.y - 0.22, 0.2), V(bb.x + 0.2, bb.y - 0.22, 0.2), 0.035, plastic("#2b2a30")));
  g.rotation.set(0.15, -0.5, 0);
  return g;
}

/* ---------------- Медаль ---------------- */

function medal() {
  const g = new THREE.Group();
  const gold = metal("#ffcf5a", { roughness: 0.2, metalness: 0.8 });
  const disc = new THREE.Shape();
  disc.absarc(0, 0, 1, 0, Math.PI * 2);
  g.add(extrude(disc, 0.12, 0.08, gold));
  const rim = mesh(new THREE.TorusGeometry(0.78, 0.04, 16, 96), metal("#f5b83a", { roughness: 0.3 }));
  rim.position.z = 0.12;
  g.add(rim);
  const star = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? 0.24 : 0.55;
    if (i === 0) star.moveTo(rr * Math.cos(a), rr * Math.sin(a));
    else star.lineTo(rr * Math.cos(a), rr * Math.sin(a));
  }
  star.closePath();
  const st = extrude(star, 0.06, 0.04, metal("#ffe08a", { roughness: 0.2 }), 6);
  st.position.z = 0.16;
  g.add(st);
  // Лента
  const ribbon = (side) => {
    const s = new THREE.Shape();
    s.moveTo(side * 0.05, 0.85);
    s.lineTo(side * 0.45, 0.85);
    s.lineTo(side * 0.95, 2.6);
    s.lineTo(side * 0.45, 2.6);
    s.closePath();
    const blue = extrude(s, 0.03, 0.015, plastic(side < 0 ? "#2d64dc" : "#2152c0", { roughness: 0.45 }), 3);
    blue.position.z = -0.1 + side * 0.02;
    const w = new THREE.Shape();
    w.moveTo(side * 0.2, 0.85);
    w.lineTo(side * 0.3, 0.85);
    w.lineTo(side * 0.8, 2.6);
    w.lineTo(side * 0.7, 2.6);
    w.closePath();
    const white = extrude(w, 0.01, 0.01, plastic("#ffffff"), 2);
    white.position.z = -0.065 + side * 0.02;
    return [blue, white];
  };
  g.add(...ribbon(-1), ...ribbon(1));
  const loop = mesh(new THREE.TorusGeometry(0.14, 0.05, 16, 48), gold);
  loop.position.set(0, 1.05, 0);
  g.add(loop);
  g.rotation.set(0.05, -0.35, 0.06);
  return g;
}

/* ---------------- Рендер ---------------- */

const MODELS = {
  football,
  basketball,
  volleyball,
  tennis,
  "table-tennis": tableTennis,
  chess,
  running,
  yoga,
  swimming,
  cycling,
  custom: medal,
};

function render(object) {
  const scene = new THREE.Scene();
  scene.environment = envMap;
  scene.environmentIntensity = 0.75;
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(-3, 5, 4);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xfff1dd, 0.5);
  fill.position.set(4, -1, 3);
  scene.add(fill);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xe8dcc8, 0.35));
  scene.add(object);

  // Кадрирование по габаритам модели
  object.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object, true);
  const center = box.getCenter(new THREE.Vector3());
  object.position.sub(center);
  object.updateMatrixWorld(true);
  const size = new THREE.Box3().setFromObject(object, true).getSize(new THREE.Vector3());
  const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 100);
  // Вписываем по видимой ширине и высоте, глубину учитываем частично (перспектива)
  const half = Math.max(size.x, size.y) / 2 + size.z * 0.08;
  const dist = (half / Math.tan(THREE.MathUtils.degToRad(12))) * 1.08 + size.z / 2;
  camera.position.set(0, dist * 0.08, dist);
  camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);

  const out = document.createElement("canvas");
  out.width = OUTPUT;
  out.height = OUTPUT;
  const ctx = out.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  // Двухшаговое уменьшение даёт мягкие края без ступенек
  const step = document.createElement("canvas");
  step.width = RENDER / 2;
  step.height = RENDER / 2;
  step.getContext("2d").drawImage(renderer.domElement, 0, 0, RENDER / 2, RENDER / 2);
  ctx.drawImage(step, 0, 0, OUTPUT, OUTPUT);
  return out.toDataURL("image/webp", 0.92);
}

const only = new URLSearchParams(location.search).get("only");
const results = {};
for (const [slug, build] of Object.entries(MODELS)) {
  if (only && only !== slug) continue;
  results[slug] = render(build());
  const img = document.createElement("img");
  img.src = results[slug];
  img.title = slug;
  document.getElementById("preview").appendChild(img);
}
window.__icons = results;
