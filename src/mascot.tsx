import React from "react";
import { C, T } from "./theme";

export type Expr = "idle" | "happy" | "wow" | "think" | "oops" | "wink" | "aha";
export type Look = "center" | "left" | "right" | "up" | "down";
export type Char = "bit" | "miu" | "cu" | "giot" | "pix" | "bong";
export const EXPRS: Expr[] = ["idle", "happy", "wow", "think", "oops", "wink", "aha"];
export const LOOKS: Look[] = ["center", "left", "right", "up", "down"];
export const CHARS: Char[] = ["bit", "miu", "cu", "giot", "pix", "bong"];

const OFF: Record<Look, [number, number]> = {
  center: [0, 0], left: [-3.5, 0], right: [3.5, 0], up: [0, -3.5], down: [0, 3.5],
};

const rgb = (hex: string) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const shade = (hex: string, k: number) => {
  const [r, g, b] = rgb(hex);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
};
const tint = (hex: string, k: number) => {
  const [r, g, b] = rgb(hex);
  const f = (v: number) => Math.round(v + (255 - v) * k);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
};

type Pt = "left" | "right" | "up" | "eureka" | undefined;

// ---- shared face parts ----
const Eyes = ({ cx, cy, gap, r, expr, look, blink, pupil, line, sclera = "#fff", ring }: {
  cx: number; cy: number; gap: number; r: number; expr: Expr; look: Look; blink: boolean;
  pupil: string; line: string; sclera?: string; ring?: string;
}) => {
  const lk = expr === "think" ? OFF.up : OFF[look];
  const er = expr === "wow" ? r * 1.2 : r;
  const one = (x: number, wink = false) => {
    if (expr === "happy" || expr === "aha" || wink) {
      return <path d={`M${x - r * 0.9} ${cy + 2} q${r * 0.9} ${-r * 1.3} ${r * 1.8} 0`} stroke={line}
        strokeWidth={r * 0.5} fill="none" strokeLinecap="round" />;
    }
    return (
      <g transform={`translate(${x} ${cy}) scale(1 ${blink ? 0.12 : 1}) translate(${-x} ${-cy})`}>
        <circle cx={x} cy={cy} r={er} fill={sclera} stroke={ring} strokeWidth={ring ? 3 : 0} />
        <circle cx={x + lk[0]} cy={cy + lk[1]} r={r * 0.5} fill={pupil} />
      </g>
    );
  };
  return <>{one(cx - gap, expr === "wink")}{one(cx + gap)}</>;
};

const Mouth = ({ cx, y, w = 1, expr, ink }: { cx: number; y: number; w?: number; expr: Expr; ink: string }) => {
  if (expr === "wow") return <ellipse cx={cx} cy={y + 3} rx={5 * w} ry={6.5} fill={ink} />;
  const d = {
    idle: `M${cx - 8 * w} ${y} q${8 * w} 7 ${16 * w} 0`,
    happy: `M${cx - 12 * w} ${y - 2} q${12 * w} 16 ${24 * w} 0`,
    think: `M${cx - 7 * w} ${y + 2} h${14 * w}`,
    oops: `M${cx - 9 * w} ${y + 5} q${9 * w} -9 ${18 * w} 0`,
    wink: `M${cx - 10 * w} ${y - 1} q${10 * w} 10 ${20 * w} 0`,
    aha: `M${cx - 11 * w} ${y - 1} q${11 * w} 9 ${22 * w} 0`,
  }[expr];
  return <path d={d} stroke={ink} strokeWidth={4.2} fill="none" strokeLinecap="round" />;
};

const Arms = ({ point, color, y = 70, xl = 19, xr = 101 }: { point: Pt; color: string; y?: number; xl?: number; xr?: number }) => {
  const right = point === "eureka"
    ? <>
        <path d={`M${xr} ${y} Q${xr + 21} ${y - 7} ${xr + 17} ${y - 38}`} stroke={color} strokeWidth={9}
          strokeLinecap="round" fill="none" />
        <circle cx={xr + 17} cy={y - 41} r={7.5} fill={color} />
        <path d={`M${xr + 17} ${y - 45} L${xr + 17} ${y - 60}`} stroke={color} strokeWidth={5.5} strokeLinecap="round" />
      </>
    : point === "right"
    ? <><path d={`M${xr} ${y} L${xr + 27} ${y - 14}`} stroke={color} strokeWidth={9} strokeLinecap="round" /><circle cx={xr + 29} cy={y - 15} r={6} fill={color} /></>
    : point === "up"
    ? <path d={`M${xr} ${y - 4} q16 -2 14 -30`} stroke={color} strokeWidth={9} strokeLinecap="round" fill="none" />
    : <path d={`M${xr} ${y} q12 4 10 20`} stroke={color} strokeWidth={9} strokeLinecap="round" fill="none" />;
  const left = point === "left"
    ? <><path d={`M${xl} ${y} L${xl - 27} ${y - 14}`} stroke={color} strokeWidth={9} strokeLinecap="round" /><circle cx={xl - 29} cy={y - 15} r={6} fill={color} /></>
    : <path d={`M${xl} ${y} q-12 4 -10 20`} stroke={color} strokeWidth={9} strokeLinecap="round" fill="none" />;
  return <>{left}{right}</>;
};

// ---- characters (all original) ----
// bit: robot helper
const Bit = ({ expr, look, point, blink, hideMark }: any) => {
  const body = C.go, dark = T.faceDark, limb = shade(C.go, 0.8);
  return (
    <>
      <line x1={60} y1={26} x2={60} y2={12} stroke="#ffffff66" strokeWidth={4} strokeLinecap="round" />
      {expr !== "aha" && <circle cx={60} cy={9} r={6.5} fill={C.accent} />}
      <Arms point={point} color={limb} />
      <rect x={36} y={98} width={18} height={12} rx={6} fill={limb} />
      <rect x={66} y={98} width={18} height={12} rx={6} fill={limb} />
      <rect x={18} y={24} width={84} height={78} rx={28} fill={body} />
      <rect x={30} y={40} width={60} height={44} rx={18} fill={dark} />
      <Eyes cx={60} cy={58} gap={13} r={9} expr={expr} look={look} blink={blink} pupil={dark} line="#fff" />
      <Mouth cx={60} y={75} expr={expr} ink="#fff" />
      {expr === "oops" && <path d="M38 44 l16 4M82 44 l-16 4" stroke="#fff" strokeWidth={3.5} strokeLinecap="round" />}
      {expr === "think" && !hideMark && <text x={96} y={26} fontSize={30} fontWeight={800} fill={C.accent}>?</text>}
    </>
  );
};

// miu: cat
const Miu = ({ expr, look, point, blink }: any) => {
  const body = C.orange, dk = shade(C.orange, 0.62), limb = shade(C.orange, 0.85), pink = "#ff9fb8";
  return (
    <>
      <path d="M92 100 q28 -2 22 -34" stroke={limb} strokeWidth={11} strokeLinecap="round" fill="none" />
      <Arms point={point} color={limb} y={92} xl={32} xr={88} />
      <ellipse cx={60} cy={92} rx={30} ry={24} fill={body} />
      <ellipse cx={46} cy={113} rx={11} ry={6} fill={limb} />
      <ellipse cx={74} cy={113} rx={11} ry={6} fill={limb} />
      <polygon points="24,44 28,8 54,28" fill={body} />
      <polygon points="96,44 92,8 66,28" fill={body} />
      <polygon points="31,36 33,18 46,29" fill={pink} />
      <polygon points="89,36 87,18 74,29" fill={pink} />
      <ellipse cx={60} cy={58} rx={40} ry={33} fill={body} />
      <path d="M54 30 v8 M60 27 v11 M66 30 v8" stroke={dk} strokeWidth={4} strokeLinecap="round" />
      <ellipse cx={34} cy={68} rx={7} ry={5} fill={pink} opacity={0.55} />
      <ellipse cx={86} cy={68} rx={7} ry={5} fill={pink} opacity={0.55} />
      <Eyes cx={60} cy={54} gap={18} r={8.5} expr={expr} look={look} blink={blink} pupil={dk} line={dk} />
      <path d="M56 63 h8 l-4 5z" fill="#ff7a9c" />
      <Mouth cx={60} y={71} w={0.75} expr={expr} ink={dk} />
      <path d="M26 64 l-18 -5 M26 70 l-18 4 M94 64 l18 -5 M94 70 l18 4" stroke={dk} strokeWidth={2.5} strokeLinecap="round" opacity={0.55} />
      {expr === "oops" && <path d="M40 42 l14 5M80 42 l-14 5" stroke={dk} strokeWidth={3.5} strokeLinecap="round" />}
      {expr === "think" && <text x={98} y={30} fontSize={30} fontWeight={800} fill={C.accent}>?</text>}
    </>
  );
};

// cu: owl with glasses
const Cu = ({ expr, look, point, blink }: any) => {
  const body = C.purple, wing = shade(C.purple, 0.78), belly = tint(C.purple, 0.55), dk = shade(C.purple, 0.3);
  return (
    <>
      <ellipse cx={22} cy={82} rx={10} ry={22} fill={wing} />
      <ellipse cx={98} cy={82} rx={10} ry={22} fill={wing} />
      {point === "right" && <path d="M100 74 L127 60" stroke={wing} strokeWidth={10} strokeLinecap="round" />}
      {point === "left" && <path d="M20 74 L-7 60" stroke={wing} strokeWidth={10} strokeLinecap="round" />}
      <rect x={44} y={112} width={12} height={9} rx={3} fill={C.accent} />
      <rect x={64} y={112} width={12} height={9} rx={3} fill={C.accent} />
      <ellipse cx={60} cy={74} rx={37} ry={40} fill={body} />
      <polygon points="30,42 34,12 52,34" fill={body} />
      <polygon points="90,42 86,12 68,34" fill={body} />
      <ellipse cx={60} cy={92} rx={22} ry={22} fill={belly} />
      <path d="M50 86 q10 7 20 0 M50 98 q10 7 20 0" stroke={body} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.7} />
      <Eyes cx={60} cy={56} gap={15} r={11} expr={expr} look={look} blink={blink} pupil={dk} line="#fff" />
      <circle cx={45} cy={56} r={17} stroke={C.accent} strokeWidth={4} fill="none" />
      <circle cx={75} cy={56} r={17} stroke={C.accent} strokeWidth={4} fill="none" />
      <path d="M62 56 h-4" stroke={C.accent} strokeWidth={4} />
      <polygon points="54,68 66,68 60,81" fill={C.accent} />
      {expr === "wow" && <polygon points="53,68 67,68 60,86" fill={C.accent} />}
      {expr === "oops" && <path d="M33 38 l16 5M87 38 l-16 5" stroke="#fff" strokeWidth={3.5} strokeLinecap="round" />}
      {expr === "think" && <text x={96} y={26} fontSize={30} fontWeight={800} fill={C.accent}>?</text>}
    </>
  );
};

// giot: slime blob (squishes)
const Giot = ({ expr, look, blink, frame }: any) => {
  const body = C.blue, dk = shade(C.blue, 0.3);
  const q = Math.sin(frame / 9);
  return (
    <>
      <ellipse cx={60} cy={110} rx={42} ry={6} fill="#000" opacity={0.18} />
      <g transform={`translate(60 108) scale(${1 - 0.04 * q} ${1 + 0.06 * q}) translate(-60 -108)`}>
        <path d="M60 36 q-2 -14 6 -20 q8 8 -2 20" fill={body} />
        <path d="M16 104 C10 66 32 36 60 36 C88 36 110 66 104 104 C92 112 28 112 16 104Z" fill={body} />
        <ellipse cx={40} cy={58} rx={9} ry={5.5} transform="rotate(-32 40 58)" fill="#fff" opacity={0.55} />
        <ellipse cx={36} cy={88} rx={7} ry={5} fill="#ff8fb3" opacity={0.5} />
        <ellipse cx={84} cy={88} rx={7} ry={5} fill="#ff8fb3" opacity={0.5} />
        <Eyes cx={60} cy={74} gap={16} r={10} expr={expr} look={look} blink={blink} pupil={dk} line={dk} />
        <Mouth cx={60} y={89} expr={expr} ink={dk} />
        {expr === "oops" && <path d="M40 58 l16 5M80 58 l-16 5" stroke={dk} strokeWidth={3.5} strokeLinecap="round" />}
        {expr === "think" && <text x={92} y={38} fontSize={30} fontWeight={800} fill={C.accent}>?</text>}
      </g>
    </>
  );
};

// pix: 8-bit block character
const Pix = ({ expr, point, blink }: any) => {
  const u = 10, ox = 0, oy = 8;
  const body = C.go, dark = T.faceDark, limb = shade(C.go, 0.75);
  const cell = (x: number, y: number, fill: string, k: string | number) => (
    <rect key={k} x={ox + x * u} y={oy + y * u} width={u} height={u} fill={fill} shapeRendering="crispEdges" />
  );
  const out: React.ReactNode[] = [];
  const add = (cells: [number, number][], fill: string, p: string) => cells.forEach(([x, y], i) => out.push(cell(x, y, fill, `${p}${i}`)));
  const block = (x0: number, y0: number, x1: number, y1: number, fill: string, p: string) => {
    const cs: [number, number][] = [];
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) cs.push([x, y]);
    add(cs, fill, p);
  };
  add([[5, 0], [6, 0]], C.accent, "an");
  add([[5, 1]], "#ffffff66", "as");
  block(2, 2, 9, 9, body, "b");
  block(3, 3, 8, 7, dark, "f");
  add([[3, 10], [4, 10], [7, 10], [8, 10]], limb, "l");
  add([[3, 11], [4, 11], [7, 11], [8, 11]], limb, "l2");
  add([[1, 5], [1, 6]], limb, "al");
  if (point === "right") add([[10, 5], [11, 4], [11, 3]], limb, "ar"); else add([[10, 5], [10, 6]], limb, "ar");
  const eyeY = blink ? [5] : [4, 5];
  if (expr === "happy") {
    add([[3, 5], [4, 4], [7, 4], [8, 5]], "#fff", "e");
  } else if (expr === "wink") {
    add([[3, 5], [4, 5]], "#fff", "e1"); add(eyeY.map((y) => [7, y] as [number, number]), "#fff", "e2");
  } else if (expr === "wow") {
    add([[3, 4], [4, 4], [3, 5], [4, 5], [7, 4], [8, 4], [7, 5], [8, 5]].map((c) => c as [number, number]), "#fff", "e");
  } else {
    add([...eyeY.map((y) => [4, y] as [number, number]), ...eyeY.map((y) => [7, y] as [number, number])], "#fff", "e");
  }
  const mouth = {
    idle: [[5, 6], [6, 6]], happy: [[4, 6], [5, 7], [6, 7], [7, 6]], wow: [[5, 6], [6, 6], [5, 7], [6, 7]],
    think: [[5, 6], [6, 6], [7, 6]], oops: [[4, 7], [5, 6], [6, 6], [7, 7]], wink: [[5, 6], [6, 6], [7, 6]],
    aha: [[4, 6], [5, 7], [6, 7], [7, 6]],
  }[expr as Expr] as [number, number][];
  add(mouth, "#fff", "m");
  if (expr === "oops") add([[3, 3], [4, 3], [7, 3], [8, 3]], "#ffffffaa", "br");
  return (
    <>
      {out}
      {expr === "think" && <text x={98} y={22} fontSize={30} fontWeight={800} fill={C.accent}>?</text>}
    </>
  );
};

// bong: friendly debug ghost (floats)
const Bong = ({ expr, look, point, blink, frame }: any) => {
  const body = "#f3f0ff", edge = shade(C.purple, 0.9), dk = "#2b2350";
  const sway = Math.sin(frame / 10) * 2;
  return (
    <>
      <ellipse cx={60} cy={118} rx={26 + sway} ry={5} fill="#000" opacity={0.16} />
      <path d="M20 106 L20 56 C20 30 38 14 60 14 C82 14 100 30 100 56 L100 106 q-10 -11 -20 0 q-10 11 -20 0 q-10 -11 -20 0 q-10 11 -20 0z"
        fill={body} stroke={edge} strokeWidth={4} strokeLinejoin="round" />
      {point === "right"
        ? <path d="M98 70 L124 56" stroke={edge} strokeWidth={8} strokeLinecap="round" />
        : <ellipse cx={104} cy={80} rx={7} ry={11} fill={body} stroke={edge} strokeWidth={3} />}
      {point === "left"
        ? <path d="M22 70 L-4 56" stroke={edge} strokeWidth={8} strokeLinecap="round" />
        : <ellipse cx={16} cy={80} rx={7} ry={11} fill={body} stroke={edge} strokeWidth={3} />}
      <ellipse cx={34} cy={72} rx={7} ry={5} fill="#ff8fb3" opacity={0.5} />
      <ellipse cx={86} cy={72} rx={7} ry={5} fill="#ff8fb3" opacity={0.5} />
      <Eyes cx={60} cy={56} gap={16} r={9.5} expr={expr} look={look} blink={blink} pupil={dk} line={dk} ring={dk} />
      <Mouth cx={60} y={72} expr={expr} ink={dk} />
      {expr === "oops" && <path d="M38 40 l15 5M82 40 l-15 5" stroke={dk} strokeWidth={3.5} strokeLinecap="round" />}
      {expr === "think" && <text x={92} y={28} fontSize={30} fontWeight={800} fill={C.accent}>?</text>}
    </>
  );
};

const BODIES: Record<Char, React.ComponentType<any>> = {
  bit: Bit, miu: Miu, cu: Cu, giot: Giot, pix: Pix, bong: Bong,
};

export const Mascot = ({ char, expr = "idle", look = "center", point, size = 150, frame = 0, hideMark = false }: {
  char?: Char; expr?: Expr; look?: Look; point?: Pt; size?: number; frame?: number; hideMark?: boolean;
}) => {
  const Body = BODIES[char ?? (T.mascot as Char) ?? "bit"] ?? Bit;
  const amp = (char ?? T.mascot) === "bong" ? 6 : 3;
  const bob = Math.sin(frame / 14) * amp;
  const blink = frame % 120 > 114;
  return (
    <svg width={size} height={size * 1.1} viewBox="-14 0 148 132" style={{ overflow: "visible" }}>
      <g transform={`translate(0 ${bob})`}>
        <Body expr={expr} look={look} point={point} blink={blink} frame={frame} hideMark={hideMark} />
      </g>
    </svg>
  );
};
