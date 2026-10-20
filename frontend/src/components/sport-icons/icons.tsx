import type { ReactNode } from "react";
import { BALL, BASKETBALL, FOOTBALL, VOLLEYBALL, tennisSeam } from "./balls";

/** Генератор уникальных id для градиентов: на странице может быть несколько одинаковых иконок. */
export type Ids = (name: string) => string;
type IconProps = { id: Ids };

const url = (id: Ids, name: string) => `url(#${id(name)})`;

/** Объём шара: блик сверху слева, собственная тень снизу справа и отражённый свет по краю. */
function SphereShading({ id, cx = BALL.cx, cy = BALL.cy, r = BALL.r, gloss = 0.85 }: IconProps & { cx?: number; cy?: number; r?: number; gloss?: number }) {
  return (
    <>
      <defs>
        <radialGradient id={id("shade")} cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.8" stopColor="#1d1408" stopOpacity="0.22" />
          <stop offset="1" stopColor="#1d1408" stopOpacity="0.55" />
        </radialGradient>
        <radialGradient id={id("spec")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff" stopOpacity={gloss} />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id("rim")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill={url(id, "shade")} />
      <circle cx={cx} cy={cy} r={r - 1.2} fill="none" stroke={url(id, "rim")} strokeWidth={2.4} />
      <ellipse
        cx={cx - r * 0.36}
        cy={cy - r * 0.42}
        rx={r * 0.3}
        ry={r * 0.18}
        transform={`rotate(-32 ${cx - r * 0.36} ${cy - r * 0.42})`}
        fill={url(id, "spec")}
      />
    </>
  );
}

function BallClip({ id, children }: IconProps & { children: ReactNode }) {
  return (
    <>
      <defs>
        <clipPath id={id("clip")}>
          <circle cx={BALL.cx} cy={BALL.cy} r={BALL.r} />
        </clipPath>
      </defs>
      <g clipPath={url(id, "clip")}>{children}</g>
    </>
  );
}

export function Football({ id }: IconProps) {
  return (
    <>
      <circle cx={BALL.cx} cy={BALL.cy} r={BALL.r} fill="#f6f3ec" />
      <BallClip id={id}>
        <path d={FOOTBALL.seams} fill="none" stroke="#8d877c" strokeWidth={1.1} strokeLinecap="round" />
        {FOOTBALL.patches.map((d, i) => (
          <path key={i} d={d} fill="#24232a" stroke="#24232a" strokeWidth={1.2} strokeLinejoin="round" />
        ))}
      </BallClip>
      <SphereShading id={id} />
    </>
  );
}

export function Basketball({ id }: IconProps) {
  return (
    <>
      <defs>
        <radialGradient id={id("bb")} cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#ffa55c" />
          <stop offset="0.6" stopColor="#ee6f2b" />
          <stop offset="1" stopColor="#b9441a" />
        </radialGradient>
        <pattern id={id("pebble")} width="3.2" height="3.2" patternUnits="userSpaceOnUse">
          <circle cx="1.6" cy="1.6" r="0.75" fill="#7a2a0c" opacity="0.22" />
        </pattern>
      </defs>
      <circle cx={BALL.cx} cy={BALL.cy} r={BALL.r} fill={url(id, "bb")} />
      <circle cx={BALL.cx} cy={BALL.cy} r={BALL.r} fill={url(id, "pebble")} />
      <BallClip id={id}>
        <path d={BASKETBALL} fill="none" stroke="#3a1a0c" strokeWidth={2.6} strokeLinecap="round" />
      </BallClip>
      <SphereShading id={id} gloss={0.6} />
    </>
  );
}

export function Volleyball({ id }: IconProps) {
  return (
    <>
      <circle cx={BALL.cx} cy={BALL.cy} r={BALL.r} fill="#fbfaf6" />
      <BallClip id={id}>
        {VOLLEYBALL.map((p, i) => (
          <path key={i} d={p.d} fill={p.fill} stroke="#6f6a63" strokeOpacity={0.55} strokeWidth={0.9} strokeLinejoin="round" />
        ))}
      </BallClip>
      <SphereShading id={id} />
    </>
  );
}

/** Ракетка в наклоне, как на макете: розовый обод, струны, синяя обмотка, жёлтые бамперы. */
export function Tennis({ id }: IconProps) {
  const smallBall = { cx: 30, cy: 30, r: 15 };
  const strings: ReactNode[] = [];
  for (let x = 38; x <= 82; x += 5.5) strings.push(<line key={`v${x}`} x1={x} y1={6} x2={x} y2={76} />);
  for (let y = 10; y <= 72; y += 5.5) strings.push(<line key={`h${y}`} x1={30} y1={y} x2={90} y2={y} />);
  return (
    <>
      <defs>
        <linearGradient id={id("frame")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffc2de" />
          <stop offset="0.5" stopColor="#f07cb2" />
          <stop offset="1" stopColor="#b9407d" />
        </linearGradient>
        <linearGradient id={id("grip")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2c5fc9" />
          <stop offset="0.38" stopColor="#7fb0ff" />
          <stop offset="0.55" stopColor="#4b84ec" />
          <stop offset="1" stopColor="#1f45a3" />
        </linearGradient>
        <clipPath id={id("bed")}>
          <ellipse cx="60" cy="41" rx="22" ry="29" />
        </clipPath>
        <radialGradient id={id("tb")} cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#f2ff8a" />
          <stop offset="0.65" stopColor="#c9df2f" />
          <stop offset="1" stopColor="#8fa516" />
        </radialGradient>
      </defs>
      <g transform="rotate(32 60 62)">
        {/* Ручка: цилиндр с обмоткой */}
        <rect x="53" y="86" width="14" height="30" rx="4" fill={url(id, "grip")} />
        {[92, 99, 106].map((y) => (
          <path key={y} d={`M53 ${y + 4} L67 ${y}`} stroke="#18388a" strokeOpacity="0.35" strokeWidth="1.4" />
        ))}
        <rect x="52" y="112" width="16" height="6" rx="3" fill="#1b3c8f" />
        <rect x="55.5" y="113" width="5" height="2" rx="1" fill="#fff" opacity="0.35" />
        {/* Горло и шейка */}
        <path d="M43 62 Q52 78 56 88 L64 88 Q68 78 77 62" fill="none" stroke={url(id, "frame")} strokeWidth="7" strokeLinejoin="round" />
        <rect x="54" y="80" width="12" height="10" rx="3" fill="#e46fa6" />
        {/* Струны */}
        <ellipse cx="60" cy="41" rx="22" ry="29" fill="#fff" fillOpacity="0.25" />
        <g clipPath={url(id, "bed")} stroke="#fff3f9" strokeWidth="1.2" opacity="0.95">
          {strings}
        </g>
        {/* Обод: тёмная грань снизу, светлая сверху, блик */}
        <ellipse cx="61" cy="42.5" rx="26" ry="33" fill="none" stroke="#a83a71" strokeWidth="7" />
        <ellipse cx="60" cy="41" rx="26" ry="33" fill="none" stroke={url(id, "frame")} strokeWidth="7" />
        <path d="M38 26 Q46 9 62 8.5" fill="none" stroke="#fff" strokeOpacity="0.75" strokeWidth="2" strokeLinecap="round" />
        <path d="M33.5 40 Q33.5 52 37 58" fill="none" stroke="#ffe066" strokeWidth="7.5" strokeLinecap="round" />
        <path d="M86.5 40 Q86.5 52 83 58" fill="none" stroke="#f5c53a" strokeWidth="7.5" strokeLinecap="round" />
      </g>
      <circle {...smallBall} fill={url(id, "tb")} />
      <path d={tennisSeam(smallBall, [-30, 20, 30])} fill="none" stroke="#fffbe6" strokeWidth="1.8" strokeLinecap="round" />
      <SphereShading id={(n) => id(`b-${n}`)} {...smallBall} gloss={0.7} />
    </>
  );
}

export function TableTennis({ id }: IconProps) {
  const pong = { cx: 94, cy: 28, r: 11 };
  return (
    <>
      <defs>
        <linearGradient id={id("wood")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#a8682f" />
          <stop offset="0.4" stopColor="#f1c588" />
          <stop offset="0.6" stopColor="#d9a05c" />
          <stop offset="1" stopColor="#8d5524" />
        </linearGradient>
        <radialGradient id={id("rubber")} cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#ff8a78" />
          <stop offset="0.55" stopColor="#e2382b" />
          <stop offset="1" stopColor="#a2190f" />
        </radialGradient>
        <pattern id={id("pips")} width="3" height="3" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="0.6" fill="#7e0f08" opacity="0.25" />
        </pattern>
        <radialGradient id={id("pong")} cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.7" stopColor="#f3efe6" />
          <stop offset="1" stopColor="#c9c1b2" />
        </radialGradient>
      </defs>
      <g transform="rotate(-38 52 50)">
        {/* Ручка с расширением к лопасти */}
        <path d="M45 78 Q46 86 46 92 L46 112 Q46 117 52 117 Q58 117 58 112 L58 92 Q58 86 59 78 Z" fill={url(id, "wood")} />
        <path d="M49 96 L49 112" stroke="#fff" strokeOpacity="0.4" strokeWidth="1.6" strokeLinecap="round" />
        {/* Торец лопасти: толщина */}
        <ellipse cx="54.5" cy="46.5" rx="35" ry="37" fill="#5a2f12" />
        <ellipse cx="53.5" cy="45" rx="35" ry="37" fill="#2a2523" />
        <ellipse cx="52" cy="43.5" rx="33" ry="35" fill={url(id, "rubber")} />
        <ellipse cx="52" cy="43.5" rx="33" ry="35" fill={url(id, "pips")} />
        <path d="M27 26 Q36 11 52 9.5" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="2.6" strokeLinecap="round" />
      </g>
      <circle {...pong} fill={url(id, "pong")} />
      <SphereShading id={(n) => id(`p-${n}`)} {...pong} gloss={0.9} />
    </>
  );
}

const KNIGHT =
  "M40 86 C39 76 43 68 50 61 C44 62 37 64 31 62.5 C25 61 21.5 56 22.5 50 C23.5 45 27.5 42 32 38.5 C37 34 42 28 46 22 C47 19 47.5 15 49 11 C52 13 55 16.5 57 20 C70 20.5 81 30 85 45 C88.5 59 85 73 81 86 Z";

/** Шахматный конь из макета: гладкий синий «пластик» с мягкими тенями. */
export function Chess({ id }: IconProps) {
  return (
    <>
      <defs>
        <linearGradient id={id("body")} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="#b5c8ff" />
          <stop offset="0.45" stopColor="#6d8cf0" />
          <stop offset="1" stopColor="#2f4bb8" />
        </linearGradient>
        <radialGradient id={id("glow")} cx="0.35" cy="0.3" r="0.6">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id("side")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0.55" stopColor="#14246b" stopOpacity="0" />
          <stop offset="1" stopColor="#14246b" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id={id("cyl")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3651c4" />
          <stop offset="0.3" stopColor="#a5bbff" />
          <stop offset="0.5" stopColor="#7b97f5" />
          <stop offset="1" stopColor="#2a40a3" />
        </linearGradient>
        <linearGradient id={id("top")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c8d6ff" />
          <stop offset="1" stopColor="#7d98f2" />
        </linearGradient>
      </defs>
      {/* Основание из трёх «ступенек»-цилиндров */}
      <ellipse cx="60" cy="108" rx="33" ry="7" fill={url(id, "cyl")} />
      <rect x="27" y="99" width="66" height="9" fill={url(id, "cyl")} />
      <ellipse cx="60" cy="99" rx="33" ry="7" fill={url(id, "top")} />
      <rect x="33" y="91" width="54" height="8" fill={url(id, "cyl")} />
      <ellipse cx="60" cy="91" rx="27" ry="5.5" fill={url(id, "top")} />
      {/* Голова и шея */}
      <path d={KNIGHT} fill={url(id, "body")} />
      <path d={KNIGHT} fill={url(id, "side")} />
      <path d={KNIGHT} fill={url(id, "glow")} />
      {/* Грива */}
      {[
        "M80 33 Q86 37 85 44",
        "M84 47 Q89 52 87 60",
        "M85 63 Q89 69 86 76",
      ].map((d) => (
        <path key={d} d={d} fill="none" stroke="#24398f" strokeOpacity="0.45" strokeWidth="2.4" strokeLinecap="round" />
      ))}
      <path d="M46.5 23 Q40 32 33 37.5" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M48 14 L54 21" stroke="#24398f" strokeOpacity="0.35" strokeWidth="1.6" strokeLinecap="round" />
      {/* Глаз, ноздря, рот */}
      <ellipse cx="45.5" cy="34" rx="2.6" ry="2.2" fill="#1a2a6c" />
      <circle cx="44.7" cy="33.2" r="0.8" fill="#fff" />
      <ellipse cx="27.5" cy="48.5" rx="1.8" ry="1.3" fill="#1a2a6c" opacity="0.7" />
      <path d="M24 55.5 Q29 57.5 33 56" fill="none" stroke="#1a2a6c" strokeOpacity="0.45" strokeWidth="1.6" strokeLinecap="round" />
      {/* Воротник */}
      <rect x="37" y="84" width="46" height="7" rx="1" fill={url(id, "cyl")} />
      <ellipse cx="60" cy="84" rx="23" ry="4.2" fill={url(id, "top")} />
    </>
  );
}

/** Кроссовок сбоку: подошва, верх, шнурки, полоска. */
export function Running({ id }: IconProps) {
  return (
    <>
      <defs>
        <linearGradient id={id("upper")} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#ffab7d" />
          <stop offset="0.55" stopColor="#f2643b" />
          <stop offset="1" stopColor="#b8391f" />
        </linearGradient>
        <linearGradient id={id("sole")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.7" stopColor="#ece7de" />
          <stop offset="1" stopColor="#b9b1a4" />
        </linearGradient>
        <radialGradient id={id("hl")} cx="0.35" cy="0.25" r="0.6">
          <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Подошва */}
      <path d="M12 84 C12 79 16 76 22 76 L96 74 C105 74 111 79 111 85 C111 92 104 95 96 95 L24 95 C16 95 12 91 12 84 Z" fill={url(id, "sole")} />
      <path d="M14 91 C16 94 20 96 24 96 L96 96 C103 96 108 94 110 90 L110 93 C108 98 103 100 96 100 L24 100 C18 100 14 97 14 93 Z" fill="#5d6673" />
      <path d="M20 84 L102 82" stroke="#d8d0c2" strokeWidth="1.4" />
      {/* Верх */}
      <path
        d="M16 79 C13 63 17 49 27 42 C33 38 41 39 45 44 C47 41 50 38 55 38 C67 44 80 53 92 60 C101 65 108 70 109 75 C110 79 107 80 104 80 L20 81 Z"
        fill={url(id, "upper")}
      />
      <path
        d="M16 79 C13 63 17 49 27 42 C33 38 41 39 45 44 C47 41 50 38 55 38 C67 44 80 53 92 60 C101 65 108 70 109 75 C110 79 107 80 104 80 L20 81 Z"
        fill={url(id, "hl")}
      />
      {/* Носок и пятка другого оттенка */}
      <path d="M90 59 C99 64 107 69 109 75 C110 79 107 80 104 80 L86 80 C88 72 88 66 90 59 Z" fill="#c94424" opacity="0.5" />
      <path d="M16 78 C13 64 16 52 23 45 C27 52 28 66 26 80 Z" fill="#a8341c" opacity="0.5" />
      {/* Горловина */}
      <path d="M28 42 C34 38 42 39 46 45 C42 46 34 46 28 42 Z" fill="#4a1a0e" opacity="0.75" />
      {/* Полоска-«свуш» */}
      <path d="M30 73 C48 71 68 65 90 63 C72 70 52 76 32 77 Z" fill="#fff" opacity="0.92" />
      {/* Шнурки */}
      <path d="M50 41 C62 46 74 53 86 60" fill="none" stroke="#9c2f17" strokeOpacity="0.45" strokeWidth="5" strokeLinecap="round" />
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          d={`M${53 + i * 7} ${46 + i * 3.6} L${59 + i * 7} ${40 + i * 3.6}`}
          stroke="#fff"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      ))}
      <path d="M22 50 C25 46 29 44 33 43" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
    </>
  );
}

/** Свёрнутый коврик для йоги с развёрнутым краем. */
export function Yoga({ id }: IconProps) {
  return (
    <>
      <defs>
        <linearGradient id={id("roll")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7ee3cb" />
          <stop offset="0.35" stopColor="#3fbf9f" />
          <stop offset="1" stopColor="#1d7f68" />
        </linearGradient>
        <linearGradient id={id("sheet")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2aa385" />
          <stop offset="1" stopColor="#5fd6b8" />
        </linearGradient>
        <linearGradient id={id("strap")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe1a3" />
          <stop offset="0.5" stopColor="#f2b45a" />
          <stop offset="1" stopColor="#b97a24" />
        </linearGradient>
      </defs>
      {/* Развёрнутый край коврика на полу */}
      <path d="M30 76 L96 76 L108 104 L20 104 Z" fill={url(id, "sheet")} />
      <path d="M26 92 L102 92" stroke="#fff" strokeOpacity="0.25" strokeWidth="1.4" />
      <path d="M20 104 L108 104 L108 107 L20 107 Z" fill="#17705b" />
      {/* Рулон: цилиндр */}
      <ellipse cx="96" cy="56" rx="10" ry="21" fill="#1d7f68" />
      <rect x="28" y="35" width="68" height="42" fill={url(id, "roll")} />
      <path d="M34 41 L92 41" stroke="#fff" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" />
      {/* Ремешки */}
      {[46, 74].map((x) => (
        <g key={x}>
          <rect x={x} y="34" width="7" height="44" rx="2" fill={url(id, "strap")} />
          <rect x={x + 1.5} y="36" width="2" height="38" rx="1" fill="#fff" opacity="0.35" />
        </g>
      ))}
      {/* Торец со спиралью */}
      <ellipse cx="28" cy="56" rx="10" ry="21" fill="#8de9d2" />
      <path
        d="M28 56 m0 -2 a2 3 0 1 1 -1.5 4 a4 7 0 1 1 5 -9 a6 11 0 1 1 -8 15 a8 15 0 1 1 11 -21 a9.5 19 0 1 1 -6 32"
        fill="none"
        stroke="#239a7e"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </>
  );
}

/** Спасательный круг: тор с красно-белыми секторами и волна. */
export function Swimming({ id }: IconProps) {
  const ring = "M60 16 a46 40 0 1 1 -0.01 0 Z M60 41 a20 17 0 1 0 0.01 0 Z";
  const sector = (a0: number, a1: number) => {
    const p = (a: number) => `${60 + 60 * Math.cos((a * Math.PI) / 180)} ${56 + 60 * Math.sin((a * Math.PI) / 180)}`;
    return `M60 56 L${p(a0)} L${p((a0 + a1) / 2)} L${p(a1)} Z`;
  };
  return (
    <>
      <defs>
        <radialGradient id={id("tube")} gradientUnits="userSpaceOnUse" cx="60" cy="56" r="46" gradientTransform="translate(0 56) scale(1 0.87) translate(0 -56)">
          <stop offset="0.42" stopColor="#3b0c08" stopOpacity="0.45" />
          <stop offset="0.6" stopColor="#3b0c08" stopOpacity="0" />
          <stop offset="0.74" stopColor="#fff" stopOpacity="0.4" />
          <stop offset="0.86" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#3b0c08" stopOpacity="0.4" />
        </radialGradient>
        <linearGradient id={id("light")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.25" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#2a0703" stopOpacity="0.3" />
        </linearGradient>
        <clipPath id={id("ring")}>
          <path d={ring} clipRule="evenodd" />
        </clipPath>
        <linearGradient id={id("water")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7cc8ff" />
          <stop offset="1" stopColor="#2f86e0" />
        </linearGradient>
      </defs>
      <g clipPath={url(id, "ring")}>
        <rect x="0" y="0" width="120" height="120" fill="#fbf8f2" />
        {[-70, 20, 110, 200].map((a) => (
          <path key={a} d={sector(a - 22, a + 22)} fill="#ec4434" />
        ))}
        <rect x="0" y="0" width="120" height="120" fill={url(id, "tube")} />
        <rect x="0" y="0" width="120" height="120" fill={url(id, "light")} />
      </g>
      {/* Верёвка по кругу */}
      <ellipse cx="60" cy="56" rx="33" ry="28.5" fill="none" stroke="#e9dcc0" strokeWidth="1.6" strokeDasharray="7 5" opacity="0.9" />
      {/* Волна перед кругом */}
      <path d="M8 98 C18 90 28 90 38 98 C48 106 58 106 68 98 C78 90 88 90 98 98 C104 102 109 103 114 101 L114 112 L8 112 Z" fill={url(id, "water")} opacity="0.95" />
      <path d="M12 98 C20 93 28 93 36 98" fill="none" stroke="#fff" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" />
      <path d="M70 98 C78 93 86 93 94 98" fill="none" stroke="#fff" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" />
    </>
  );
}

function Wheel({ id, cx, cy }: IconProps & { cx: number; cy: number }) {
  const spokes = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return <line key={i} x1={cx} y1={cy} x2={cx + 17 * Math.cos(a)} y2={cy + 17 * Math.sin(a)} />;
  });
  return (
    <g>
      <circle cx={cx} cy={cy} r="21" fill="none" stroke="#26262c" strokeWidth="6.5" />
      <circle cx={cx} cy={cy} r="21" fill="none" stroke="#5e5e68" strokeWidth="1.6" strokeDasharray="30 200" strokeDashoffset="-150" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="17" fill="none" stroke={url(id, "rim")} strokeWidth="2.2" />
      <g stroke="#c9ccd2" strokeWidth="0.7">{spokes}</g>
      <circle cx={cx} cy={cy} r="3" fill={url(id, "rim")} />
    </g>
  );
}

/** Велосипед с трубчатой рамой. */
export function Cycling({ id }: IconProps) {
  const tubes = [
    "M30 80 L58 82",
    "M30 80 L52 52",
    "M52 52 L58 82",
    "M53 55 L84 50",
    "M58 82 L86 57",
    "M84 47 L90 80",
  ];
  return (
    <>
      <defs>
        <linearGradient id={id("rim")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#8f949c" />
        </linearGradient>
      </defs>
      <Wheel id={id} cx={30} cy={80} />
      <Wheel id={id} cx={90} cy={80} />
      {/* Цепь */}
      <path d="M30 76 L58 78 M30 84 L58 86" stroke="#6b6b72" strokeWidth="1.2" />
      {/* Рама: тёмная грань + светлый блик сверху */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {tubes.map((d) => (
          <path key={d} d={d} stroke="#1f4fc4" strokeWidth="6" />
        ))}
        {tubes.map((d) => (
          <path key={`m${d}`} d={d} stroke="#3f82f5" strokeWidth="4" />
        ))}
        {tubes.map((d) => (
          <path key={`h${d}`} d={d} stroke="#a9ccff" strokeWidth="1.4" transform="translate(-0.6 -1.2)" />
        ))}
      </g>
      {/* Подседельный штырь и седло */}
      <path d="M52 52 L50 44" stroke="#9aa0a8" strokeWidth="3" strokeLinecap="round" />
      <path d="M40 42 C44 39 56 39 62 41 C60 45 50 46 44 45 C41 45 39 44 40 42 Z" fill="#2b2a30" />
      <path d="M44 41 C48 40 54 40 58 41" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.2" strokeLinecap="round" />
      {/* Руль */}
      <path d="M84 47 L82 38 C86 35 92 35 95 38" fill="none" stroke="#2b2a30" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
      {/* Каретка и педаль */}
      <circle cx="58" cy="82" r="5.5" fill={url(id, "rim")} stroke="#55565d" strokeWidth="1" />
      <path d="M58 82 L64 91" stroke="#55565d" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="60" y="90" width="9" height="3.4" rx="1.4" fill="#2b2a30" />
    </>
  );
}

/** Медаль — для пользовательских направлений. */
export function Medal({ id }: IconProps) {
  const star = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? 6.5 : 14;
    return `${60 + r * Math.cos(a)} ${78 + r * Math.sin(a)}`;
  }).join(" L");
  return (
    <>
      <defs>
        <radialGradient id={id("gold")} cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#fff4b0" />
          <stop offset="0.45" stopColor="#f6c53f" />
          <stop offset="0.85" stopColor="#d18f22" />
          <stop offset="1" stopColor="#9b6212" />
        </radialGradient>
        <linearGradient id={id("inner")} x1="1" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#ffe17a" />
          <stop offset="1" stopColor="#d79a2a" />
        </linearGradient>
        <linearGradient id={id("ribbonL")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1f4fc4" />
          <stop offset="1" stopColor="#4f8af5" />
        </linearGradient>
        <linearGradient id={id("ribbonR")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2a62dc" />
          <stop offset="1" stopColor="#173c9c" />
        </linearGradient>
      </defs>
      <path d="M32 6 L52 6 L68 52 L54 56 Z" fill={url(id, "ribbonL")} />
      <path d="M42 6 L46 6 L62 53 L58 54 Z" fill="#fff" opacity="0.85" />
      <path d="M88 6 L68 6 L52 52 L66 56 Z" fill={url(id, "ribbonR")} />
      <path d="M78 6 L74 6 L58 53 L62 54 Z" fill="#fff" opacity="0.6" />
      <rect x="52" y="48" width="16" height="8" rx="3" fill="#c88a23" />
      <circle cx="61" cy="80" r="29" fill="#8a540e" />
      <circle cx="60" cy="78" r="29" fill={url(id, "gold")} />
      <circle cx="60" cy="78" r="21" fill={url(id, "inner")} />
      <circle cx="60" cy="78" r="21" fill="none" stroke="#a96e15" strokeOpacity="0.55" strokeWidth="1.4" />
      <path d={`M${star} Z`} fill="#fff1a6" stroke="#b97a1a" strokeWidth="1" strokeLinejoin="round" />
      <ellipse cx="48" cy="62" rx="9" ry="4.5" transform="rotate(-35 48 62)" fill="#fff" opacity="0.55" />
    </>
  );
}

export const ICONS: Record<string, (p: IconProps) => ReactNode> = {
  football: Football,
  basketball: Basketball,
  volleyball: Volleyball,
  tennis: Tennis,
  "table-tennis": TableTennis,
  chess: Chess,
  running: Running,
  yoga: Yoga,
  swimming: Swimming,
  cycling: Cycling,
};
