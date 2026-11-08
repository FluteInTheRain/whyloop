import React from "react";
import { AbsoluteFill } from "remotion";
import { C, applyTheme, brandFont } from "./theme";
import { EquationView, PlotView } from "./math";
import { Mascot } from "./mascot";

// YouTube thumbnail (1280x720), "book cover" style: very few words, one big picture, lots of air.
export type ThumbProps = {
  variant?: "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "S";
  big?: string; left?: string; right?: string; leftNum?: string; rightNum?: string; hook?: string; unit?: string; // variants C, D, E
  line1?: string; line2?: string; series?: string; caption?: string;
  lines?: string[]; lineSize?: number;   // variant A: big title lines (default: the Vietnamese three-line title)
  tex?: string; texSize?: number;        // variant B headline formula (default f(X)+ε)
  figure?: "f" | "fits" | "bv" | "u" | "knn" | "sky" | "bridge" | "fork" | "exam" | "darts" | "map" | "springs" | "band" | "stall" | "jug" | "traps" | "switch" | "sbend" | "paradox" | "cafe";          // picture on the right: episode 1 "f" (data, f, noise), episode 2 "fits" (line, truth, wiggle), episode 4 "bv" (bias, variance, the U)
};

// deterministic scatter around 2 + 4*sqrt(x), the same picture the lesson builds
const pts = (() => {
  let s = 7;
  const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  return Array.from({ length: 26 }, (_, i) => {
    const x = 0.6 + (i / 25) * 9;
    return [x, 2 + 4 * Math.sqrt(x) + (r() - 0.5) * 5];
  });
})();
const fx = (x: number) => 2 + 4 * Math.sqrt(x);

// the lesson in one picture: data (cyan), hidden law f (green), noise (red dashes)
const Figure = ({ w, h, r = 13, lw = 11 }: { w: number; h: number; r?: number; lw?: number }) => (
  <PlotView w={w} h={h} kick={999} n={{
    xrange: [0, 10], yrange: [0, 18], axes: false, grid: false, series: [
      { type: "segments", data: pts.map(([x, y]) => [x, y, x, fx(x)]), color: "red", width: 5 },
      { type: "fn", fn: "2+4*sqrt(x)", color: "green", width: lw },
      { type: "points", data: pts as number[][], color: "primary", r }] }} />
);

// episode 2: the same dots, three models: too stiff (orange), just right (green), too wiggly (red)
const pts2 = (() => {
  let s = 11;
  const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  return Array.from({ length: 22 }, (_, i) => {
    const x = 0.5 + (i / 21) * 9;
    return [x, 3 + 2.4 * x - 0.2 * x * x + (r() - 0.5) * 3.4];
  });
})();
const Figure2 = ({ w, h }: { w: number; h: number }) => (
  <PlotView w={w} h={h} kick={999} n={{
    xrange: [0, 10], yrange: [0, 14], axes: false, grid: false, series: [
      { type: "fn", fn: "3+2.4*x-0.2*x^2+1.5*sin(2.8*x)", color: "red", width: 7 },
      { type: "fn", fn: "6+0.35*x", color: "orange", width: 8 },
      { type: "fn", fn: "3+2.4*x-0.2*x^2", color: "green", width: 11 },
      { type: "points", data: pts2 as number[][], color: "primary", r: 12 }] }} />
);

// episode 4: bias squared falls (blue), variance rises (pink), noise is a floor (orange), their sum is the U (red)
const FigureBV = ({ w, h }: { w: number; h: number }) => (
  <PlotView w={w} h={h} kick={999} n={{
    xrange: [0, 10], yrange: [0, 11], axes: false, grid: false, series: [
      { type: "fn", fn: "2.2+7*exp(-0.62*x)+0.065*x^2", color: "red", width: 12 },
      { type: "fn", fn: "7*exp(-0.62*x)", color: "blue", width: 8 },
      { type: "fn", fn: "0.065*x^2", color: "pink", width: 8 },
      { type: "fn", fn: "2.2+0*x", color: "orange", width: 6 }] }} />
);

// episode 3: training error keeps falling (green), test error is a U (red), dashed floor Var(eps) (yellow)
const Figure3 = ({ w, h }: { w: number; h: number }) => (
  <PlotView w={w} h={h} kick={999} n={{
    xrange: [0, 10], yrange: [0, 7.4], axes: false, grid: false, series: [
      { type: "fn", fn: "2.6+0*x", color: "accent", dashed: true, width: 6 },
      { type: "fn", fn: "0.6+4.2*exp(-0.5*x)", color: "green", width: 11 },
      { type: "fn", fn: "2.6+2.2*exp(-1.1*x)+0.06*x^2", color: "red", width: 11 }] }} />
);

// episode 5: pass (green) and fail (red) students, the curved Bayes boundary (purple); same recipe as the lesson
const knnPts = (() => {
  let s = 5;
  const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const g = (x: number) => 8.4 - 0.62 * x + 1.1 * Math.sin(0.8 * x);
  const out: { p: number[][]; f: number[][] } = { p: [], f: [] };
  for (let i = 0; i < 70; i++) {
    const x = r() * 10, y = 2 + r() * 8, pr = 1 / (1 + Math.exp(-1.3 * (y - g(x))));
    (r() < pr ? out.p : out.f).push([x, y]);
  }
  return out;
})();
const FigureKNN = ({ w, h }: { w: number; h: number }) => (
  <PlotView w={w} h={h} kick={999} n={{
    xrange: [-0.5, 10.5], yrange: [1.5, 10.5], axes: false, grid: false, series: [
      { type: "fn", fn: "8.4-0.62*x+1.1*sin(0.8*x)", color: "purple", width: 9, dashed: true },
      { type: "points", data: knnPts.p, color: "green", r: 9 },
      { type: "points", data: knnPts.f, color: "red", r: 9 }] }} />
);

// ---- livelier variants (episode 5 onwards): one huge hook, the mascot, strong colour blocks ----
const stroke = (c: string, w = 10) => ({ WebkitTextStroke: `${w}px ${c}`, paintOrder: "stroke fill" as const });
const Dots = ({ w, h, o = 1 }: { w: number; h: number; o?: number }) => (
  <div style={{ opacity: o }}><FigureKNN w={w} h={h} /></div>
);
export const ThumbnailLive = ({ variant = "C", series = "MACHINE LEARNING · 5", big = "PERFECT?", hook = "Can a classifier be", left = "ORACLE",
  right = "KNN", leftNum = "12.4%", rightNum = "13.6%", unit = "the lowest error anyone can reach" }: ThumbProps) => {
  applyTheme("spectrum");
  const font = brandFont("mali");
  const tag = (
    <div style={{ position: "absolute", left: 56, top: 38, fontSize: 36, fontWeight: 800, color: C.go, letterSpacing: 4,
      background: "rgba(0,0,0,0.45)", padding: "6px 18px", borderRadius: 14 }}>{series}</div>
  );
  if (variant === "C") {
    return (
      <AbsoluteFill style={{ background: "linear-gradient(135deg, #2a1650 0%, #121826 60%, #0b2a3a 100%)", fontFamily: font }}>
        <div style={{ position: "absolute", left: 360, top: 20 }}><Dots w={900} h={680} o={0.55} /></div>
        <div style={{ position: "absolute", left: 640, top: 250, width: 640, height: 560, borderRadius: "50%",
          background: "rgba(255,210,63,0.35)", filter: "blur(110px)" }} />
        {tag}
        <div style={{ position: "absolute", left: 56, top: 130, fontSize: 64, fontWeight: 800, color: "#fff", lineHeight: 1,
          ...stroke("#0b0f1a", 12) }}>{hook}</div>
        <div style={{ position: "absolute", left: 40, top: 215, fontSize: 200, fontWeight: 800, color: C.accent, lineHeight: 1.05,
          letterSpacing: -4, ...stroke("#0b0f1a", 16), textShadow: "0 12px 0 #0b0f1a" }}>{big}</div>
        <div style={{ position: "absolute", left: 800, top: 340, width: 400, height: 400 }}>
          <Mascot expr="wow" look="left" point="left" size={380} frame={12} />
        </div>
        <div style={{ position: "absolute", left: 60, top: 500, fontSize: 70, fontWeight: 800, color: "#fff",
          background: C.red, padding: "6px 30px", borderRadius: 22, transform: "rotate(-3deg)" }}>Bayes vs KNN</div>
      </AbsoluteFill>
    );
  }
  if (variant === "D") {
    return (
      <AbsoluteFill style={{ background: "#0e1118", fontFamily: font }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 760, height: 720, background: "linear-gradient(160deg,#5b2fd0,#2a1470)",
          clipPath: "polygon(0 0, 100% 0, 78% 100%, 0 100%)" }} />
        <div style={{ position: "absolute", left: 520, top: 0, width: 760, height: 720, background: "linear-gradient(200deg,#0fa5c9,#0a3c5a)",
          clipPath: "polygon(22% 0, 100% 0, 100% 100%, 0 100%)" }} />
        {tag}
        <div style={{ position: "absolute", left: 50, top: 190, fontSize: 80, fontWeight: 800, color: "#fff", ...stroke("#1a0b45", 8) }}>{left}</div>
        <div style={{ position: "absolute", left: 30, top: 300, fontSize: 170, fontWeight: 800, color: C.accent, letterSpacing: -4,
          ...stroke("#1a0b45", 14) }}>{leftNum}</div>
        <div style={{ position: "absolute", right: 50, top: 190, textAlign: "right", fontSize: 80, fontWeight: 800, color: "#fff",
          ...stroke("#062b40", 8) }}>{right}</div>
        <div style={{ position: "absolute", right: 30, top: 300, fontSize: 170, fontWeight: 800, color: "#fff", letterSpacing: -4,
          ...stroke("#062b40", 14) }}>{rightNum}</div>
        <div style={{ position: "absolute", left: 545, top: 110, width: 190, height: 190, borderRadius: "50%", background: C.red,
          color: "#fff", fontSize: 100, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center",
          border: "10px solid #fff", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>VS</div>
        <div style={{ position: "absolute", left: 50, top: 570, fontSize: 60, fontWeight: 800, color: "#fff",
          background: "rgba(0,0,0,0.55)", padding: "4px 24px", borderRadius: 18 }}>{hook}</div>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 30% 40%, #0f5a46 0%, #101a22 70%)", fontFamily: font }}>
      <div style={{ position: "absolute", left: 640, top: -20 }}><Dots w={700} h={760} o={0.5} /></div>
      {tag}
      <div style={{ position: "absolute", left: 30, top: 120, fontSize: 330, fontWeight: 800, color: C.green, letterSpacing: -8,
        lineHeight: 1, ...stroke("#06130e", 18), textShadow: "0 14px 0 #06130e" }}>{leftNum}</div>
      <div style={{ position: "absolute", left: 60, top: 470, width: 700, fontSize: 70, fontWeight: 800, color: "#fff", lineHeight: 1.08,
        ...stroke("#06130e", 10) }}>{unit}</div>
      <div style={{ position: "absolute", left: 880, top: 360, width: 380, height: 380 }}>
        <Mascot expr="think" look="left" point="left" size={360} frame={12} />
      </div>
    </AbsoluteFill>
  );
};

// ---- metaphor illustrations for the thumbnail of episode 1: data as stars / as lamps, f as the hidden shape ----
const lcg = (seed: number) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; };
const Star = ({ x, y, r, c, o = 1 }: { x: number; y: number; r: number; c: string; o?: number }) => (
  <g opacity={o}>
    <path d={`M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r}Z`} fill={c} />
    <circle cx={x} cy={y} r={r * 0.28} fill="#fff" />
  </g>
);
const Illus = ({ kind, w = 1280, h = 720 }: { kind: "sky" | "bridge"; w?: number; h?: number }) => {
  const f = (t: number) => 2 + 4 * Math.sqrt(t);               // the hidden function (same recipe as the lesson)
  const r = lcg(7);
  const data = Array.from({ length: 24 }, (_, i) => { const t = 0.8 + (i / 23) * 9.0; return [t, f(t) + (r() - 0.5) * 3.6]; });
  if (kind === "sky") {
    const sx = (t: number) => 40 + (t / 10) * (w - 80), sy = (v: number) => 535 - ((v - 4) / 12) * 300;
    const path = Array.from({ length: 101 }, (_, i) => { const t = 0.1 + (i / 100) * 9.8; return `${i ? "L" : "M"}${sx(t).toFixed(1)} ${sy(f(t)).toFixed(1)}`; }).join("");
    const bg = lcg(21);
    return (
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0b1030" /><stop offset="0.7" stopColor="#2a1a58" /><stop offset="1" stopColor="#4a2a6e" /></linearGradient>
          <linearGradient id="cv" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#a97bff" stopOpacity="0.15" /><stop offset="0.4" stopColor="#a97bff" /><stop offset="1" stopColor="#ffd23f" /></linearGradient>
          <filter id="gl"><feGaussianBlur stdDeviation="9" /></filter>
        </defs>
        <rect width={w} height={h} fill="url(#sky)" />
        {Array.from({ length: 110 }, (_, i) => <circle key={i} cx={bg() * w} cy={bg() * h * 0.9} r={1 + bg() * 2.6} fill="#fff" opacity={0.2 + bg() * 0.55} />)}
        <path d={path} fill="none" stroke="#a97bff" strokeWidth={26} filter="url(#gl)" opacity={0.75} />
        <path d={path} fill="none" stroke="url(#cv)" strokeWidth={10} strokeLinecap="round" />
        {data.map(([t, v], i) => (
          <line key={`s${i}`} x1={sx(t)} y1={sy(v)} x2={sx(t)} y2={sy(f(t))} stroke="#ff5c5c" strokeWidth={4} strokeDasharray="8 7" opacity={0.85} />
        ))}
        {data.map(([t, v], i) => <Star key={i} x={sx(t)} y={sy(v)} r={34} c="#22d3ee" />)}
        <path d={`M0 ${h} L0 ${h - 70} Q200 ${h - 120} 420 ${h - 70} T860 ${h - 80} T${w} ${h - 60} L${w} ${h}Z`} fill="#15112b" />
      </svg>
    );
  }
  // suspension bridge across the whole frame: towers, main cable = f, hangers = residuals, lamps = data
  const L = 230, R = w - 230, topY = 360, deckY = 640, dip = 470;
  const cabY = (t: number) => topY + (dip - topY) * (1 - 4 * (t - 0.5) * (t - 0.5));
  const cx = (t: number) => L + t * (R - L);
  const cabPath = Array.from({ length: 81 }, (_, i) => { const t = i / 80; return `${i ? "L" : "M"}${cx(t).toFixed(1)} ${cabY(t).toFixed(1)}`; }).join("");
  const sideL = `M0 ${deckY - 30} Q${L / 2} ${topY + 20} ${L} ${topY}`, sideR = `M${w} ${deckY - 30} Q${w - L / 2} ${topY + 20} ${R} ${topY}`;
  const rr = lcg(5);
  const lamps = Array.from({ length: 15 }, (_, i) => { const t = 0.05 + (i / 14) * 0.9; return { t, y: Math.min(deckY - 36, cabY(t) + 40 + rr() * 70) }; });
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <linearGradient id="bsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#141a48" /><stop offset="0.65" stopColor="#6a3a78" /><stop offset="1" stopColor="#b05a6a" /></linearGradient>
        <filter id="bgl"><feGaussianBlur stdDeviation="8" /></filter>
      </defs>
      <rect width={w} height={h} fill="url(#bsky)" />
      <rect y={deckY + 20} width={w} height={h - deckY} fill="#10132a" />
      <rect x={L - 22} y={topY - 36} width={44} height={deckY - topY + 60} rx={10} fill="#33363c" />
      <rect x={R - 22} y={topY - 36} width={44} height={deckY - topY + 60} rx={10} fill="#33363c" />
      <path d={sideL} fill="none" stroke="#34d399" strokeWidth={8} opacity={0.7} /><path d={sideR} fill="none" stroke="#34d399" strokeWidth={8} opacity={0.7} />
      <rect x={0} y={deckY} width={w} height={22} fill="#d7dae0" />
      <path d={cabPath} fill="none" stroke="#34d399" strokeWidth={20} filter="url(#bgl)" opacity={0.65} />
      <path d={cabPath} fill="none" stroke="#34d399" strokeWidth={10} strokeLinecap="round" />
      {lamps.map((p, i) => <line key={`h${i}`} x1={cx(p.t)} y1={cabY(p.t)} x2={cx(p.t)} y2={p.y} stroke="#ff5c5c" strokeWidth={5} strokeDasharray="9 7" />)}
      {lamps.map((p, i) => <circle key={`c${i}`} cx={cx(p.t)} cy={p.y} r={21} fill="#22d3ee" stroke="#fff" strokeWidth={4} />)}
    </svg>
  );
};

// ---- scenes for the "life metaphor" thumbnails (one full-frame illustration per episode) ----
const Scene = ({ kind, w = 1280, h = 720 }: { kind: "fork" | "exam" | "darts" | "map" | "springs" | "band" | "stall" | "jug" | "traps" | "switch" | "sbend" | "paradox" | "cafe"; w?: number; h?: number }) => {
  const r = lcg(11);
  if (kind === "paradox") {
    // episode 14: a small clinic with few mild patients (15%) next to a big city hospital with a long queue of severe cases (28%): the worse-looking place treats the sickest
    const rp = lcg(14);
    const sev = ["#34d399", "#a3e635", "#ffd23f", "#ff9f43", "#ff5c5c"];
    const queue = Array.from({ length: 14 }, (_, i) => ({ x: 440 + i * 27 + (rp() - 0.5) * 6, y: 590 - (rp() > 0.5 ? 0 : 30), c: sev[Math.min(4, 2 + Math.floor(i / 4) + (rp() > 0.7 ? 1 : 0))] }));
    const few = Array.from({ length: 4 }, (_, i) => ({ x: 160 + i * 52, y: 598, c: sev[i % 2] }));
    const person = (x: number, y: number, c: string, k: string) => <g key={k}><circle cx={x} cy={y - 26} r={13} fill={c} stroke="#fff" strokeWidth={3.5} /><rect x={x - 11} y={y - 12} width={22} height={34} rx={9} fill={c} stroke="#fff" strokeWidth={3.5} /></g>;
    return (
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id="pdg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1b2350" /><stop offset="1" stopColor="#0c1028" /></linearGradient>
        </defs>
        <rect width={w} height={h} fill="url(#pdg)" />
        <rect y={620} width={w} height={h - 620} fill="#2a2018" />
        <rect y={620} width={w} height={10} fill="#4a3a2a" />
        <g>
          <rect x={90} y={490} width={290} height={130} rx={14} fill="#1f6f8b" stroke="#22d3ee" strokeWidth={8} />
          <rect x={90} y={470} width={290} height={36} rx={10} fill="#22d3ee" />
          <rect x={210} y={550} width={50} height={70} fill="#0b0f1a" />
          <rect x={120} y={525} width={20} height={20} fill="#e9ecff" /><rect x={330} y={525} width={20} height={20} fill="#e9ecff" />
          <rect x={215} y={416} width={40} height={14} fill="#fff" /><rect x={228} y={403} width={14} height={40} fill="#ff5c5c" />
          <text x={235} y={388} textAnchor="middle" fontSize={64} fontWeight={800} fill="#22d3ee" stroke="#0b0f1a" strokeWidth={10} paintOrder="stroke" fontFamily="inherit">15%</text>
        </g>
        <g>
          <rect x={840} y={330} width={340} height={290} rx={14} fill="#8a4d12" stroke="#ff9f43" strokeWidth={8} />
          <rect x={840} y={312} width={340} height={36} rx={10} fill="#ff9f43" />
          {[0, 1, 2, 3].map((r) => [0, 1, 2].map((c) => <rect key={`w${r}${c}`} x={870 + c * 100} y={370 + r * 54} width={56} height={34} fill="#ffe9b8" />))}
          <rect x={970} y={550} width={80} height={70} fill="#0b0f1a" />
          <rect x={995} y={266} width={50} height={16} fill="#fff" /><rect x={1012} y={249} width={16} height={50} fill="#ff5c5c" />
          <text x={1020} y={236} textAnchor="middle" fontSize={76} fontWeight={800} fill="#ff9f43" stroke="#0b0f1a" strokeWidth={10} paintOrder="stroke" fontFamily="inherit">28%</text>
        </g>
        {queue.map((q, i) => person(q.x, q.y, q.c, `q${i}`))}
        {few.map((q, i) => person(q.x - 10, q.y, q.c, `f${i}`))}
        <line x1={560} y1={500} x2={760} y2={500} stroke="#ffd23f" strokeWidth={8} strokeDasharray="14 10" opacity={0} />
      </svg>
    );
  }
  if (kind === "band") {
    // episode 7: one line, a bow-tie of other lines it could have been, and the +/- 2 SE band around it
    const cx = 740, cy = 400, sl = 0.3;
    const yAt = (x: number, m = sl) => cy - (x - cx) * m;
    const hw = (x: number) => 16 + Math.abs(x - cx) * 0.16;
    const xs = Array.from({ length: 12 }, (_, i) => 300 + i * 80);
    const upper = xs.map((x) => `${x},${yAt(x) - hw(x)}`);
    const lower = xs.slice().reverse().map((x) => `${x},${yAt(x) + hw(x)}`);
    const rb = lcg(41);
    const dots = Array.from({ length: 24 }, (_, i) => { const x = 330 + i * 35 + (rb() - 0.5) * 18; return { x, y: yAt(x) + (rb() - 0.5) * 2 * 70 }; });
    const fan = [-0.12, -0.08, -0.04, 0.04, 0.08, 0.12];
    return (
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs><linearGradient id="bdg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#16204a" /><stop offset="1" stopColor="#0a0f26" /></linearGradient></defs>
        <rect width={w} height={h} fill="url(#bdg)" />
        {Array.from({ length: 11 }, (_, i) => <line key={`v${i}`} x1={i * 128} y1={0} x2={i * 128} y2={h} stroke="#fff" strokeOpacity={0.04} strokeWidth={3} />)}
        {Array.from({ length: 7 }, (_, i) => <line key={`h${i}`} x1={0} y1={i * 120} x2={w} y2={i * 120} stroke="#fff" strokeOpacity={0.04} strokeWidth={3} />)}
        <polygon points={[...upper, ...lower].join(" ")} fill="#a97bff" opacity={0.38} stroke="#a97bff" strokeWidth={4} />
        {fan.map((d, i) => <line key={`f${i}`} x1={290} y1={yAt(290, sl + d)} x2={1180} y2={yAt(1180, sl + d)} stroke="#e9ecff" strokeOpacity={0.55} strokeWidth={4} />)}
        <line x1={290} y1={yAt(290)} x2={1180} y2={yAt(1180)} stroke="#0b0f1a" strokeWidth={22} strokeLinecap="round" />
        <line x1={290} y1={yAt(290)} x2={1180} y2={yAt(1180)} stroke="#ffd23f" strokeWidth={12} strokeLinecap="round" />
        {dots.map((d, i) => <circle key={`d${i}`} cx={d.x} cy={d.y} r={12} fill="#22d3ee" stroke="#fff" strokeWidth={3.5} />)}
        <g transform={`translate(1080 ${yAt(1080) - hw(1080) - 56})`}><rect x={-4} y={0} width={8} height={56} fill="#d7dae0" /><rect x={-92} y={-52} width={184} height={56} rx={12} fill="#ffd23f" /><text x={0} y={-12} textAnchor="middle" fontSize={38} fontWeight={800} fill="#0b0f1a" fontFamily="inherit">± 2 SE</text></g>
      </svg>
    );
  }
  if (kind === "jug") {
    // episode 8: a measuring jug filled to R^2 = 0.76 of the total variation; the rest of the dots float above, unexplained
    const fill = 0.76, jx = 760, jw = 340, jt = 100, jb = 585, level = jb - (jb - jt) * fill;
    const rj = lcg(53);
    const inside = Array.from({ length: 16 }, () => ({ x: jx + 30 + rj() * (jw - 60), y: level + 24 + rj() * (jb - level - 50) }));
    const above = Array.from({ length: 5 }, () => ({ x: jx + 40 + rj() * (jw - 80), y: jt + 14 + rj() * (level - jt - 40) }));
    return (
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id="jgb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#223055" /><stop offset="1" stopColor="#0c1128" /></linearGradient>
          <linearGradient id="jgw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#34d399" stopOpacity={0.85} /><stop offset="1" stopColor="#0f7a5a" stopOpacity={0.9} /></linearGradient>
        </defs>
        <rect width={w} height={h} fill="url(#jgb)" />
        <rect y={jb + 24} width={w} height={h - jb - 24} fill="#2a2018" />
        <rect x={jx} y={level} width={jw} height={jb - level} rx={18} fill="url(#jgw)" />
        <rect x={jx} y={jt} width={jw} height={jb - jt} rx={22} fill="none" stroke="#e9ecff" strokeWidth={10} />
        {Array.from({ length: 5 }, (_, i) => { const y = jb - ((jb - jt) * i) / 4; return <g key={i}><line x1={jx + jw} y1={y} x2={jx + jw + 46} y2={y} stroke="#e9ecff" strokeWidth={6} /><text x={jx + jw + 60} y={y + 12} fontSize={34} fontWeight={800} fill="#fff" fontFamily="inherit">{["0", ".25", ".5", ".75", "1"][i]}</text></g>; })}
        {above.map((d, i) => <circle key={`a${i}`} cx={d.x} cy={d.y} r={13} fill="#ff9f43" stroke="#fff" strokeWidth={3.5} />)}
        {inside.map((d, i) => <circle key={`i${i}`} cx={d.x} cy={d.y} r={13} fill="#22d3ee" stroke="#fff" strokeWidth={3.5} />)}
        <line x1={jx - 20} y1={level} x2={jx + jw - 6} y2={level} stroke="#ffd23f" strokeWidth={7} strokeDasharray="18 12" />
        <text x={jx + jw / 2} y={jb + 82} textAnchor="middle" fontSize={60} fontWeight={800} fill="#ffd23f" fontFamily="inherit" stroke="#0b0f1a" strokeWidth={10} paintOrder="stroke">R² = 0.76</text>
      </svg>
    );
  }
  if (kind === "springs") {
    // episode 6: a wooden rod held by springs to the dots: it settles where the total pull (squared) is smallest
    const rod = (x: number) => 600 - (x - 470) * (360 / 770);
    const rs = lcg(29);
    const dots = Array.from({ length: 17 }, (_, i) => {
      const x = 520 + i * 44 + (rs() - 0.5) * 20;
      const off = (rs() - 0.5) * 2 * (60 + rs() * 100);
      return { x, y: Math.min(640, Math.max(120, rod(x) + off)) };
    });
    const spring = (x: number, y0: number, y1: number) => {
      const n = 7, a = 11, pts: string[] = [`${x},${y0}`];
      for (let k = 1; k < n * 2; k++) pts.push(`${x + (k % 2 ? a : -a)},${y0 + ((y1 - y0) * k) / (n * 2)}`);
      pts.push(`${x},${y1}`);
      return pts.join(" ");
    };
    return (
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs><linearGradient id="spg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1a1f3d" /><stop offset="1" stopColor="#0d1226" /></linearGradient></defs>
        <rect width={w} height={h} fill="url(#spg)" />
        {Array.from({ length: 11 }, (_, i) => <line key={`v${i}`} x1={i * 128} y1={0} x2={i * 128} y2={h} stroke="#fff" strokeOpacity={0.04} strokeWidth={3} />)}
        {Array.from({ length: 7 }, (_, i) => <line key={`h${i}`} x1={0} y1={i * 120} x2={w} y2={i * 120} stroke="#fff" strokeOpacity={0.04} strokeWidth={3} />)}
        {dots.map((d, i) => <polyline key={`s${i}`} points={spring(d.x, d.y, rod(d.x))} fill="none" stroke="#a97bff" strokeWidth={5} strokeLinejoin="round" opacity={0.9} />)}
        <line x1={450} y1={rod(450)} x2={1250} y2={rod(1250)} stroke="#0b0f1a" strokeWidth={30} strokeLinecap="round" />
        <line x1={450} y1={rod(450)} x2={1250} y2={rod(1250)} stroke="#ffd23f" strokeWidth={18} strokeLinecap="round" />
        {dots.map((d, i) => <circle key={`d${i}`} cx={d.x} cy={d.y} r={14} fill="#22d3ee" stroke="#fff" strokeWidth={4} />)}
        {[0, 1].map((k) => <circle key={`p${k}`} cx={k ? 1230 : 480} cy={rod(k ? 1230 : 480)} r={9} fill="#0b0f1a" />)}
      </svg>
    );
  }
  if (kind === "stall") {
    // episode 9: an ice cream stall; thermometer, crowd and flyers all feed one answer (cups sold)
    const stripes = Array.from({ length: 8 }, (_, i) => i);
    const folk = [{ x: 720, c: "#22d3ee" }, { x: 800, c: "#ffd23f" }, { x: 905, c: "#a97bff" }, { x: 1010, c: "#22d3ee" }, { x: 1110, c: "#ff7ab6" }, { x: 1190, c: "#ffd23f" }];
    return (
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs><linearGradient id="stg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#24316b" /><stop offset="1" stopColor="#0d1226" /></linearGradient></defs>
        <rect width={w} height={h} fill="url(#stg)" />
        <rect x={0} y={600} width={w} height={120} fill="#0b0f1a" opacity={0.55} />
        {[0, 1].map((k) => <rect key={k} x={776 + k * 410} y={350} width={14} height={250} fill="#cfd6ff" stroke="#0b0f1a" strokeWidth={4} />)}
        <rect x={760} y={450} width={450} height={150} rx={10} fill="#2a3566" stroke="#0b0f1a" strokeWidth={6} />
        <rect x={790} y={480} width={390} height={70} rx={8} fill="#0d1226" opacity={0.6} />
        {stripes.map((i) => <polygon key={i} points={`${740 + i * 61},300 ${740 + (i + 1) * 61},300 ${740 + (i + 1) * 61 + 6},365 ${740 + i * 61 - 6},365`} fill={i % 2 ? "#ffffff" : "#ff5d5d"} stroke="#0b0f1a" strokeWidth={5} />)}
        <polygon points="950,236 1010,236 980,300" fill="#e8a653" stroke="#0b0f1a" strokeWidth={5} />
        <circle cx={980} cy={214} r={36} fill="#ff9ec7" stroke="#0b0f1a" strokeWidth={5} />
        <circle cx={980} cy={176} r={28} fill="#fff1c9" stroke="#0b0f1a" strokeWidth={5} />
        {folk.map((f, i) => <g key={i}><circle cx={f.x} cy={640} r={24} fill={f.c} stroke="#0b0f1a" strokeWidth={5} /><rect x={f.x - 30} y={662} width={60} height={50} rx={22} fill={f.c} stroke="#0b0f1a" strokeWidth={5} /></g>)}
        <rect x={625} y={250} width={30} height={290} rx={15} fill="#fff" stroke="#0b0f1a" strokeWidth={6} />
        <rect x={634} y={380} width={12} height={160} fill="#ff5d5d" />
        <circle cx={640} cy={556} r={34} fill="#ff5d5d" stroke="#0b0f1a" strokeWidth={6} />
        {[290, 330, 370].map((y) => <line key={y} x1={660} y1={y} x2={684} y2={y} stroke="#fff" strokeWidth={5} />)}
        {[{ x: 690, y: 120, r: -14 }, { x: 780, y: 190, r: 10 }, { x: 1090, y: 170, r: 16 }].map((f, i) => (
          <g key={i} transform={`translate(${f.x} ${f.y}) rotate(${f.r})`}>
            <rect width={86} height={110} rx={8} fill="#fffbe6" stroke="#0b0f1a" strokeWidth={5} />
            {[26, 48, 70, 92].map((y) => <line key={y} x1={14} y1={y} x2={72} y2={y} stroke="#a97bff" strokeWidth={6} strokeLinecap="round" />)}
          </g>
        ))}
        {[[684, 330, 760, 400], [760, 640, 800, 560], [740, 235, 800, 320]].map((l, i) => <line key={i} x1={l[0]} y1={l[1]} x2={l[2]} y2={l[3]} stroke="#a97bff" strokeWidth={5} strokeDasharray="4 12" strokeLinecap="round" />)}
      </svg>
    );
  }
  if (kind === "cafe") {
    // episode 12: a cafe chalkboard of past days (a U of dots): a rigid red ruler cuts through it, a purple curve follows the neighbours
    const ys = (i: number) => { const u = (i - 8.5) / 8.5; return 540 - 290 * u * u; };
    const dots = Array.from({ length: 18 }, (_, i) => ({ x: 625 + i * 34, y: ys(i) + 26 * Math.sin(i * 2.7 + 1) }));
    const curve = Array.from({ length: 64 }, (_, k) => { const i = (k / 63) * 17; return `${k ? "L" : "M"}${625 + i * 34} ${ys(i)}`; }).join(" ");
    const near = [14, 15, 16];
    return (
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs><linearGradient id="cfg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a2358" /><stop offset="1" stopColor="#6b3d5e" /></linearGradient></defs>
        <rect width={w} height={h} fill="url(#cfg)" />
        <rect x={0} y={640} width={w} height={80} fill="#0b0f1a" opacity={0.5} />
        <rect x={560} y={130} width={680} height={500} rx={22} fill="#8a5a33" stroke="#0b0f1a" strokeWidth={8} />
        <rect x={582} y={152} width={636} height={456} rx={12} fill="#1b2a33" stroke="#0b0f1a" strokeWidth={5} />
        <path d={curve} fill="none" stroke="#0b0f1a" strokeWidth={16} strokeLinecap="round" />
        <path d={curve} fill="none" stroke="#a97bff" strokeWidth={9} strokeLinecap="round" />
        <line x1={600} y1={455} x2={1200} y2={335} stroke="#0b0f1a" strokeWidth={30} strokeLinecap="round" />
        <line x1={600} y1={455} x2={1200} y2={335} stroke="#ff5c5c" strokeWidth={19} strokeLinecap="round" />
        {Array.from({ length: 12 }, (_, i) => { const t = (i + 0.5) / 12, x = 600 + t * 600, y = 455 - t * 120; return <line key={i} x1={x} y1={y} x2={x - 4} y2={y + (i % 3 ? 7 : 12)} stroke="#fff" strokeWidth={3} />; })}
        {dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={near.includes(i) ? 14 : 12} fill={near.includes(i) ? "#ff9f43" : "#22d3ee"} stroke="#fff" strokeWidth={4} />)}
        <circle cx={dots[15].x} cy={dots[15].y} r={72} fill="none" stroke="#ffd23f" strokeWidth={6} strokeDasharray="10 12" />
        <g transform="translate(180 584)">
          <path d="M0 0h74l-9 44a10 10 0 0 1-10 8H19a10 10 0 0 1-10-8z" fill="#fff" stroke="#0b0f1a" strokeWidth={6} />
          <path d="M74 12h12a14 14 0 0 1 0 28h-16" fill="none" stroke="#0b0f1a" strokeWidth={7} />
          <rect x={8} y={-6} width={58} height={12} rx={6} fill="#6b3d1e" stroke="#0b0f1a" strokeWidth={5} />
        </g>
      </svg>
    );
  }
  if (kind === "traps") {
    // episode 11: the straight ruler laid on a winding hill road: it fits nowhere; warning signs and one lost dot
    const road = "M590 735 C 700 560, 740 380, 880 400 S 1090 600, 1290 300";
    const ruler = { x1: 600, y1: 600, x2: 1250, y2: 330 };
    const dots = [[650, 640], [690, 560], [740, 470], [800, 415], [880, 400], [960, 430], [1030, 500], [1100, 520], [1170, 440], [1230, 340]];
    const ry = (x: number) => ruler.y1 + ((x - ruler.x1) * (ruler.y2 - ruler.y1)) / (ruler.x2 - ruler.x1);
    return (
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs><linearGradient id="trg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2b1f5c" /><stop offset="0.6" stopColor="#a8507a" /><stop offset="1" stopColor="#f2a65a" /></linearGradient></defs>
        <rect width={w} height={h} fill="url(#trg)" />
        <circle cx={1130} cy={190} r={70} fill="#ffd23f" opacity={0.85} />
        <path d={`M0 470 Q200 380 400 450 T800 430 T1280 440 L1280 720 L0 720Z`} fill="#3b2a63" />
        <path d={`M0 560 Q300 500 600 560 T1280 540 L1280 720 L0 720Z`} fill="#241a45" />
        <path d={road} fill="none" stroke="#0b0f1a" strokeWidth={96} strokeLinecap="round" opacity={0.5} />
        <path d={road} fill="none" stroke="#3a3d44" strokeWidth={80} strokeLinecap="round" />
        <path d={road} fill="none" stroke="#ffd23f" strokeWidth={5} strokeDasharray="20 18" />
        {dots.map(([x, y], i) => <line key={`r${i}`} x1={x} y1={y} x2={x} y2={ry(x)} stroke="#ff5c5c" strokeWidth={6} strokeDasharray="4 9" strokeLinecap="round" />)}
        <line x1={ruler.x1} y1={ruler.y1} x2={ruler.x2} y2={ruler.y2} stroke="#0b0f1a" strokeWidth={34} strokeLinecap="round" />
        <line x1={ruler.x1} y1={ruler.y1} x2={ruler.x2} y2={ruler.y2} stroke="#ff5c5c" strokeWidth={22} strokeLinecap="round" />
        {Array.from({ length: 13 }, (_, i) => { const t = (i + 0.5) / 13, x = ruler.x1 + t * (ruler.x2 - ruler.x1), y = ruler.y1 + t * (ruler.y2 - ruler.y1); return <line key={`k${i}`} x1={x} y1={y} x2={x - 6} y2={y + (i % 3 ? 7 : 12)} stroke="#fff" strokeWidth={3} />; })}
        {dots.map(([x, y], i) => <circle key={`d${i}`} cx={x} cy={y} r={13} fill="#22d3ee" stroke="#fff" strokeWidth={4} />)}
        <circle cx={940} cy={215} r={17} fill="#ff9f43" stroke="#fff" strokeWidth={4} />
        {[{ x: 1195, y: 600, s: 1 }, { x: 740, y: 330, s: 0.8 }].map((g, i) => (
          <g key={`w${i}`} transform={`translate(${g.x} ${g.y}) scale(${g.s})`}>
            <rect x={-5} y={0} width={10} height={120} fill="#d7dae0" />
            <polygon points="0,-90 78,40 -78,40" fill="#ffd23f" stroke="#0b0f1a" strokeWidth={8} strokeLinejoin="round" />
            <rect x={-8} y={-40} width={16} height={46} rx={6} fill="#0b0f1a" /><circle cx={0} cy={22} r={9} fill="#0b0f1a" />
          </g>
        ))}
      </svg>
    );
  }
  if (kind === "sbend") {
    // episode 13: pass/fail as a road: a bold S-curve climbs from the "0" ledge to the "1" ledge; a straight ruler shoots out through floor and ceiling
    const rr = lcg(5);
    const red = Array.from({ length: 15 }, (_, i) => ({ x: 640 + i * 24 + (rr() - 0.5) * 10, y: 604 + (rr() - 0.5) * 8 }));
    const grn = Array.from({ length: 15 }, (_, i) => ({ x: 880 + i * 26 + (rr() - 0.5) * 10, y: 190 + (rr() - 0.5) * 8 }));
    const S = "M600 604 C 860 604, 980 190, 1250 190";
    return (
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs><linearGradient id="sbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1d2a5e" /><stop offset="1" stopColor="#0b1028" /></linearGradient></defs>
        <rect width={w} height={h} fill="url(#sbg)" />
        {Array.from({ length: 11 }, (_, i) => <line key={`v${i}`} x1={i * 128} y1={0} x2={i * 128} y2={h} stroke="#fff" strokeOpacity={0.04} strokeWidth={3} />)}
        {Array.from({ length: 7 }, (_, i) => <line key={`h${i}`} x1={0} y1={i * 120} x2={w} y2={i * 120} stroke="#fff" strokeOpacity={0.04} strokeWidth={3} />)}
        <rect x={560} y={150} width={720} height={80} rx={10} fill="#34d399" opacity={0.14} />
        <rect x={560} y={564} width={720} height={80} rx={10} fill="#ff5c5c" opacity={0.14} />
        <line x1={560} y1={190} x2={1280} y2={190} stroke="#34d399" strokeWidth={5} strokeDasharray="14 12" opacity={0.85} />
        <line x1={560} y1={604} x2={1280} y2={604} stroke="#ff5c5c" strokeWidth={5} strokeDasharray="14 12" opacity={0.85} />
        <path d={S} fill="none" stroke="#0b0f1a" strokeWidth={66} strokeLinecap="round" opacity={0.6} />
        <path d={S} fill="none" stroke="#a97bff" strokeWidth={54} strokeLinecap="round" />
        <path d={S} fill="none" stroke="#ffd23f" strokeWidth={5} strokeDasharray="22 16" />
        <line x1={575} y1={700} x2={1085} y2={140} stroke="#0b0f1a" strokeWidth={22} strokeLinecap="round" />
        <line x1={575} y1={700} x2={1085} y2={140} stroke="#ff5c5c" strokeWidth={12} strokeLinecap="round" strokeDasharray="30 16" />
        {red.map((d, i) => <circle key={`r${i}`} cx={d.x} cy={d.y} r={12} fill="#ff5c5c" stroke="#fff" strokeWidth={3.5} />)}
        {grn.map((d, i) => <circle key={`g${i}`} cx={d.x} cy={d.y} r={12} fill="#34d399" stroke="#fff" strokeWidth={3.5} />)}
        {[[575, 700], [1085, 140]].map(([x, y], i) => (
          <g key={`x${i}`} transform={`translate(${x} ${y})`}>
            <circle r={26} fill="#ffd23f" stroke="#0b0f1a" strokeWidth={6} />
            <path d="M-11 -11 L11 11 M11 -11 L-11 11" stroke="#0b0f1a" strokeWidth={7} strokeLinecap="round" />
          </g>
        ))}
        <text x={640} y={262} textAnchor="start" fontSize={48} fontWeight={800} fill="#34d399" stroke="#0b0f1a" strokeWidth={9} paintOrder="stroke" fontFamily="inherit">PASS = 1</text>
        <text x={1262} y={690} textAnchor="end" fontSize={48} fontWeight={800} fill="#ff5c5c" stroke="#0b0f1a" strokeWidth={9} paintOrder="stroke" fontFamily="inherit">FAIL = 0</text>
      </svg>
    );
  }
  if (kind === "switch") {
    // episode 10: flip a wall switch (dummy variable 0/1) and the line tilts into two lines; a faint parabola = the bend
    const rs = lcg(77);
    const dotsA = Array.from({ length: 9 }, (_, i) => { const x = 975 + i * 33; return { x, y: 500 - (x - 950) * 0.30 + (rs() - 0.5) * 70 }; });
    const dotsB = Array.from({ length: 9 }, (_, i) => { const x = 975 + i * 33; return { x, y: 490 - (x - 950) * 0.88 + (rs() - 0.5) * 70 }; });
    return (
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs><linearGradient id="swg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1d2a5e" /><stop offset="1" stopColor="#0b1028" /></linearGradient></defs>
        <rect width={w} height={h} fill="url(#swg)" />
        {Array.from({ length: 11 }, (_, i) => <line key={`v${i}`} x1={i * 128} y1={0} x2={i * 128} y2={h} stroke="#fff" strokeOpacity={0.04} strokeWidth={3} />)}
        {Array.from({ length: 7 }, (_, i) => <line key={`h${i}`} x1={0} y1={i * 120} x2={w} y2={i * 120} stroke="#fff" strokeOpacity={0.04} strokeWidth={3} />)}
        <path d="M700 690 Q 990 20 1270 690" fill="none" stroke="#a97bff" strokeWidth={9} strokeDasharray="6 16" strokeLinecap="round" opacity={0.65} />
        <circle cx={845} cy={470} r={215} fill="#ffd23f" opacity={0.14} />
        <circle cx={845} cy={470} r={140} fill="#ffd23f" opacity={0.14} />
        <line x1={950} y1={500} x2={1250} y2={410} stroke="#0b0f1a" strokeWidth={24} strokeLinecap="round" />
        <line x1={950} y1={500} x2={1250} y2={410} stroke="#22d3ee" strokeWidth={13} strokeLinecap="round" />
        <line x1={950} y1={490} x2={1250} y2={226} stroke="#0b0f1a" strokeWidth={24} strokeLinecap="round" />
        <line x1={950} y1={490} x2={1250} y2={226} stroke="#ffd23f" strokeWidth={13} strokeLinecap="round" />
        {dotsA.map((d, i) => <circle key={`a${i}`} cx={d.x} cy={d.y} r={12} fill="#22d3ee" stroke="#fff" strokeWidth={3.5} />)}
        {dotsB.map((d, i) => <circle key={`b${i}`} cx={d.x} cy={d.y} r={12} fill="#ffd23f" stroke="#fff" strokeWidth={3.5} />)}
        <rect x={770} y={325} width={150} height={290} rx={24} fill="#e9ecff" stroke="#0b0f1a" strokeWidth={7} />
        <circle cx={845} cy={350} r={7} fill="#9aa3c7" /><circle cx={845} cy={590} r={7} fill="#9aa3c7" />
        <rect x={805} y={385} width={80} height={185} rx={16} fill="#0d1226" stroke="#0b0f1a" strokeWidth={5} />
        <rect x={812} y={392} width={66} height={92} rx={12} fill="#ffd23f" stroke="#0b0f1a" strokeWidth={5} />
        <text x={845} y={456} textAnchor="middle" fontSize={56} fontWeight={800} fill="#0b0f1a" fontFamily="inherit">1</text>
        <text x={845} y={540} textAnchor="middle" fontSize={44} fontWeight={800} fill="#6b7399" fontFamily="inherit">0</text>
      </svg>
    );
  }
  if (kind === "fork") {
    // episode 2: a fork in the road at sunset: the straight readable road vs the winding flexible one
    return (
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id="fk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2b1f5c" /><stop offset="0.55" stopColor="#b65a7a" /><stop offset="1" stopColor="#f2a65a" /></linearGradient>
        </defs>
        <rect width={w} height={h} fill="url(#fk)" />
        <circle cx={1090} cy={310} r={90} fill="#ffd23f" opacity={0.9} />
        <path d={`M0 470 Q180 380 360 460 T700 440 T1060 430 T${w} 450 L${w} ${h} L0 ${h}Z`} fill="#3b2a63" />
        <path d={`M0 540 Q260 470 520 540 T1040 520 T${w} 540 L${w} ${h} L0 ${h}Z`} fill="#241a45" />
        <path d={`M560 ${h + 10} L570 560 L640 560 L700 ${h + 10}Z`} fill="#3a3d44" />
        <path d="M605 560 C 700 520, 900 330, 1120 330" fill="none" stroke="#3a3d44" strokeWidth={70} strokeLinecap="round" />
        <path d="M605 560 C 700 520, 900 330, 1120 330" fill="none" stroke="#ffd23f" strokeWidth={5} strokeDasharray="20 18" />
        <path d="M605 560 C 560 640, 760 650, 860 600 S 1000 520, 1010 600 S 1140 640, 1200 560" fill="none" stroke="#3a3d44" strokeWidth={70} strokeLinecap="round" />
        <path d="M605 560 C 560 640, 760 650, 860 600 S 1000 520, 1010 600 S 1140 640, 1200 560" fill="none" stroke="#ffd23f" strokeWidth={5} strokeDasharray="20 18" />
        <g transform="translate(1100 190)"><rect x={-60} y={60} width={120} height={80} fill="#f6f1e7" /><polygon points="-76,60 0,0 76,60" fill="#d64545" /><rect x={-14} y={88} width={28} height={52} fill="#3b2a63" /></g>
        <g transform="translate(560 470)"><rect x={-5} y={0} width={10} height={130} fill="#d7dae0" /><rect x={-10} y={-50} width={250} height={64} rx={10} fill="#34d399" transform="rotate(-12)" /><text x={6} y={-6} transform="rotate(-12)" fontSize={34} fontWeight={800} fill="#0b0f1a" fontFamily="inherit">READABLE</text></g>
        <g transform="translate(980 520)"><rect x={-5} y={0} width={10} height={130} fill="#d7dae0" /><rect x={-120} y={-28} width={240} height={60} rx={10} fill="#a97bff" /><text x={-104} y={14} fontSize={34} fontWeight={800} fill="#0b0f1a" fontFamily="inherit">FLEXIBLE</text></g>
      </svg>
    );
  }
  if (kind === "exam") {
    // episode 3: the practice test you memorised vs the real exam
    const lines = (x: number, y: number, n: number, ww: number) => Array.from({ length: n }, (_, i) => <line key={i} x1={x} y1={y + i * 34} x2={x + ww} y2={y + i * 34} stroke="#9fb3d6" strokeWidth={2} />);
    return (
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs><linearGradient id="ex" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1d2a4a" /><stop offset="1" stopColor="#0f1730" /></linearGradient></defs>
        <rect width={w} height={h} fill="url(#ex)" />
        <rect y={560} width={w} height={160} fill="#2a2018" />
        <g transform="rotate(-6 760 380)"><rect x={600} y={150} width={330} height={440} rx={14} fill="#f6f1e7" />{lines(630, 260, 9, 270)}
          <text x={630} y={215} fontSize={34} fontWeight={800} fill="#33406a" fontFamily="inherit">Practice test</text>
          <circle cx={800} cy={480} r={72} fill="none" stroke="#e53b3b" strokeWidth={9} /><text x={800} y={503} textAnchor="middle" fontSize={78} fontWeight={800} fill="#e53b3b" fontFamily="inherit">A+</text>
          <path d="M640 330 l22 24 l44 -52" fill="none" stroke="#2fbf71" strokeWidth={9} strokeLinecap="round" /></g>
        <g transform="rotate(5 1070 400)"><rect x={910} y={170} width={330} height={440} rx={14} fill="#f6f1e7" />{lines(940, 280, 9, 270)}
          <text x={940} y={235} fontSize={34} fontWeight={800} fill="#33406a" fontFamily="inherit">Real exam</text>
          <circle cx={1110} cy={500} r={72} fill="none" stroke="#e53b3b" strokeWidth={9} /><text x={1110} y={523} textAnchor="middle" fontSize={78} fontWeight={800} fill="#e53b3b" fontFamily="inherit">C</text>
          <path d="M950 330 l40 40 m0 -40 l-40 40" stroke="#e53b3b" strokeWidth={9} strokeLinecap="round" /></g>
        <g transform="translate(560 640) rotate(-8)"><rect width={300} height={22} rx={6} fill="#ffd23f" /><polygon points="300,0 340,11 300,22" fill="#f1d9a5" /><rect width={26} height={22} fill="#ff7eb6" /></g>
      </svg>
    );
  }
  if (kind === "darts") {
    // episode 4: two dartboards: tight but off-centre (bias) vs centred but scattered (variance)
    const board = (cx: number, cy: number, c: string, pts: [number, number][]) => (
      <g>
        <circle cx={cx} cy={cy} r={112} fill="#10141f" stroke="#d7dae0" strokeWidth={8} />
        {[92, 68, 45, 22].map((rad, i) => <circle key={i} cx={cx} cy={cy} r={rad} fill={i % 2 ? "#f6f1e7" : "#d64545"} />)}
        <circle cx={cx} cy={cy} r={9} fill="#2fbf71" />
        {pts.map(([dx, dy], i) => <circle key={i} cx={cx + dx} cy={cy + dy} r={11} fill={c} stroke="#fff" strokeWidth={3} />)}
      </g>
    );
    const rn = lcg(3), g2 = () => (rn() + rn() + rn() - 1.5);
    const tight = Array.from({ length: 8 }, () => [42 + g2() * 15, -36 + g2() * 15] as [number, number]);
    const wide = Array.from({ length: 8 }, () => [g2() * 76, g2() * 76] as [number, number]);
    return (
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs><linearGradient id="dw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#12334a" /><stop offset="1" stopColor="#0a1a2a" /></linearGradient></defs>
        <rect width={w} height={h} fill="url(#dw)" />
        {Array.from({ length: 9 }, (_, i) => <line key={i} x1={i * 160} y1={0} x2={i * 160} y2={h} stroke="#ffffff" strokeOpacity={0.05} strokeWidth={4} />)}
        {board(850, 420, "#4c8dff", tight)}
        {board(1105, 420, "#ff7eb6", wide)}
        <text x={850} y={590} textAnchor="middle" fontSize={34} fontWeight={800} fill="#4c8dff" stroke="#0b0f1a" strokeWidth={9} paintOrder="stroke" fontFamily="inherit">high bias</text>
        <text x={1105} y={590} textAnchor="middle" fontSize={34} fontWeight={800} fill="#ff7eb6" stroke="#0b0f1a" strokeWidth={9} paintOrder="stroke" fontFamily="inherit">high variance</text>
      </svg>
    );
  }
  // map (episode 5): a town seen from above: green district, red district, the winding river is the Bayes boundary
  const river = "M-20 560 C 300 600, 460 200, 820 300 S 1180 420, 1300 360";
  const g = (x: number) => 560 + 0 * x;
  void g;
  const houses = Array.from({ length: 90 }, () => ({ x: 40 + r() * (w - 80), y: 40 + r() * (h - 140) }));
  // river as a function of x: sample the bezier by pieces (monotone in x) to classify houses above (green) / below (red)
  const bez = (p0: number[], p1: number[], p2: number[], p3: number[], t: number) => {
    const m = 1 - t;
    return [m * m * m * p0[0] + 3 * m * m * t * p1[0] + 3 * m * t * t * p2[0] + t * t * t * p3[0],
            m * m * m * p0[1] + 3 * m * m * t * p1[1] + 3 * m * t * t * p2[1] + t * t * t * p3[1]];
  };
  const samples: number[][] = [];
  for (let i = 0; i <= 60; i++) samples.push(bez([-20, 560], [300, 600], [460, 200], [820, 300], i / 60));
  for (let i = 1; i <= 60; i++) samples.push(bez([820, 300], [1180, 300 + 120], [1180, 420], [1300, 360], i / 60));
  const riverY = (x: number) => { let best = samples[0]; for (const s of samples) if (Math.abs(s[0] - x) < Math.abs(best[0] - x)) best = s; return best[1]; };
  const rr = lcg(17);
  const hs = houses.map((p) => {
    const above = p.y < riverY(p.x);
    const flip = rr() < 0.12 ? !above : above;
    return { ...p, c: flip ? "#34d399" : "#ff5c5c" };
  }).filter((p) => Math.abs(p.y - riverY(p.x)) > 36 && !(p.x < 700 && p.y < 360) && !(p.y < 80) && !(p.x > 1100 && p.y < 90) && !(p.y > 590 && p.x < 760));
  const q = { x: 930, y: 400 };
  const nb = [...hs].sort((a, b) => (a.x - q.x) ** 2 + (a.y - q.y) ** 2 - ((b.x - q.x) ** 2 + (b.y - q.y) ** 2)).slice(0, 3);
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
      <rect width={w} height={h} fill="#17201f" />
      <path d={`${river} L${w + 20} ${h + 20} L-20 ${h + 20}Z`} fill="#ff5c5c" opacity={0.14} />
      <path d={`${river} L${w + 20} -20 L-20 -20Z`} fill="#34d399" opacity={0.14} />
      {Array.from({ length: 11 }, (_, i) => <line key={`v${i}`} x1={i * 128} y1={0} x2={i * 128} y2={h} stroke="#fff" strokeOpacity={0.04} strokeWidth={3} />)}
      {Array.from({ length: 7 }, (_, i) => <line key={`h${i}`} x1={0} y1={i * 120} x2={w} y2={i * 120} stroke="#fff" strokeOpacity={0.04} strokeWidth={3} />)}
      <path d={river} fill="none" stroke="#a97bff" strokeWidth={26} opacity={0.35} />
      <path d={river} fill="none" stroke="#a97bff" strokeWidth={10} strokeLinecap="round" />
      {hs.map((p, i) => <g key={i}><rect x={p.x - 15} y={p.y - 10} width={30} height={22} rx={3} fill={p.c} /><polygon points={`${p.x - 19},${p.y - 10} ${p.x},${p.y - 28} ${p.x + 19},${p.y - 10}`} fill={p.c} opacity={0.85} /></g>)}
      {nb.map((p, i) => <g key={`n${i}`}><line x1={q.x} y1={q.y} x2={p.x} y2={p.y} stroke="#fff" strokeWidth={4} strokeDasharray="9 7" /><circle cx={p.x} cy={p.y - 6} r={34} fill="none" stroke="#fff" strokeWidth={4} /></g>)}
      <g><rect x={q.x - 28} y={q.y - 18} width={56} height={42} rx={5} fill="#ffd23f" stroke="#fff" strokeWidth={5} /><polygon points={`${q.x - 36},${q.y - 18} ${q.x},${q.y - 52} ${q.x + 36},${q.y - 18}`} fill="#ffd23f" stroke="#fff" strokeWidth={5} /></g>
      <text x={q.x + 52} y={q.y - 30} fontSize={64} fontWeight={800} fill="#ffd23f" stroke="#0b0f1a" strokeWidth={9} paintOrder="stroke" fontFamily="inherit">?</text>
    </svg>
  );
};

// ---- textbook-cover variants (F Swiss, G data-art navy, H Bauhaus) ----
const gcurve = (x: number) => 8.4 - 0.62 * x + 1.1 * Math.sin(0.8 * x);
const coverPts = (n: number, seed: number) => {
  let s = seed;
  const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const o: { x: number; y: number; c: number }[] = [];
  while (o.length < n) {
    const x = r() * 10, y = 2 + r() * 8;
    const p = 1 / (1 + Math.exp(-1.3 * (y - gcurve(x))));
    o.push({ x, y, c: r() < p ? 1 : 0 });
  }
  return o;
};
const nearest = (pts: { x: number; y: number }[], qx: number, qy: number, k: number) =>
  [...pts].sort((a, b) => (a.x - qx) ** 2 + (a.y - qy) ** 2 - ((b.x - qx) ** 2 + (b.y - qy) ** 2)).slice(0, k);
const CoverArt = ({ w, h, c0, c1, line, accent, r = 9, n = 150, seed = 3, rings = true, lw = 4 }: {
  w: number; h: number; c0: string; c1: string; line: string; accent: string; r?: number; n?: number; seed?: number; rings?: boolean; lw?: number;
}) => {
  const P = coverPts(n, seed);
  const sx = (x: number) => (x / 10) * w, sy = (y: number) => h - ((y - 2) / 8) * h;
  const q = { x: 3.6, y: 6.3 };
  const nb = nearest(P, q.x, q.y, 3);
  const path = Array.from({ length: 101 }, (_, i) => { const x = i / 10; return `${i ? "L" : "M"}${sx(x).toFixed(1)} ${sy(gcurve(x)).toFixed(1)}`; }).join("");
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <path d={path} fill="none" stroke={line} strokeWidth={lw} strokeLinecap="round" />
      {P.map((p, i) => <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={r} fill={p.c ? c1 : c0} />)}
      {nb.map((p, i) => <line key={`l${i}`} x1={sx(q.x)} y1={sy(q.y)} x2={sx(p.x)} y2={sy(p.y)} stroke={line} strokeWidth={2} />)}
      {rings && nb.map((p, i) => <circle key={`r${i}`} cx={sx(p.x)} cy={sy(p.y)} r={r * 2.1} fill="none" stroke={line} strokeWidth={2} />)}
      <circle cx={sx(q.x)} cy={sy(q.y)} r={r * 1.9} fill={accent} stroke={line} strokeWidth={3} />
    </svg>
  );
};
export const ThumbnailCover = ({ variant = "F", series = "MACHINE LEARNING · 05", big = "Bayes\nvs KNN", hook = "The best possible guess", figure = "knn" }: ThumbProps) => {
  applyTheme("spectrum");
  const font = '"Barlow", "Helvetica Neue", Arial, sans-serif';
  const lines = big.split("\n");
  if (variant === "J" || variant === "K" || variant === "S") {
    const mali = brandFont("mali");
    const longest = Math.max(...lines.map((t) => t.length));
    const budget = ({ fork: 900, darts: 720, paradox: 880 } as Record<string, number>)[figure as string] ?? 600;   // text width available before the scene's objects
    const fs = Math.min(150, Math.round(budget / (longest * 0.58)));
    const edge = { WebkitTextStroke: "10px #0b0f1a", paintOrder: "stroke fill" as const };
    return (
      <AbsoluteFill style={{ background: "#0b1030", fontFamily: mali, color: C.text }}>
        {variant === "S" && (figure === "fork" || figure === "exam" || figure === "darts" || figure === "map" || figure === "springs" || figure === "band" || figure === "stall" || figure === "jug" || figure === "traps" || figure === "cafe" || figure === "switch" || figure === "sbend" || figure === "paradox") ? <Scene kind={figure} w={1280} h={720} /> : <Illus kind={variant === "J" || figure === "sky" ? "sky" : "bridge"} w={1280} h={720} />}
        <div style={{ position: "absolute", left: 60, top: 44, fontSize: 30, fontWeight: 700, letterSpacing: 6, color: C.go, ...edge }}>{series}</div>
        {lines.map((t, i) => (
          <div key={i} style={{ position: "absolute", left: 54, top: 90 + i * fs * 1.02, fontSize: fs, fontWeight: 700, letterSpacing: -fs / 34,
            lineHeight: 1.05, whiteSpace: "nowrap", color: i === lines.length - 1 ? C.accent : "#fff", ...edge,
            textShadow: "0 8px 0 #0b0f1a" }}>{t}</div>
        ))}
        <div style={{ position: "absolute", left: 60, top: variant === "J" ? 628 : 668, fontSize: 44, fontWeight: 700, color: C.green, ...edge }}>{hook}</div>
        {variant === "K" && <div style={{ position: "absolute", right: 250, top: 672, fontSize: 44, fontWeight: 800, color: C.accent, ...edge }}>Y = f(X) + ε</div>}
        {variant === "J" && <div style={{ position: "absolute", right: 250, top: 580, fontSize: 96, fontWeight: 800, color: C.accent, ...edge }}>f = ?</div>}
        {(() => {
          // Bit is placed per scene (any spot that tells the story), not in a fixed corner
          const m: Record<string, { l: number; t: number; z: number; e: any; lk: any; p: any }> = {
            fork: { l: 440, t: 470, z: 180, e: "think", lk: "right", p: "right" },
            exam: { l: 330, t: 440, z: 200, e: "wow", lk: "right", p: "right" },
            darts: { l: 330, t: 440, z: 200, e: "wink", lk: "right", p: "right" },
            map: { l: 700, t: 470, z: 170, e: "think", lk: "right", p: "right" },
            springs: { l: 250, t: 440, z: 190, e: "wow", lk: "right", p: "right" },
            band: { l: 70, t: 440, z: 190, e: "think", lk: "right", p: "right" },
            stall: { l: 390, t: 450, z: 190, e: "wink", lk: "right", p: "right" },
            jug: { l: 470, t: 450, z: 190, e: "wink", lk: "right", p: "right" },
            cafe: { l: 330, t: 440, z: 190, e: "think", lk: "right", p: "right" },
            traps: { l: 470, t: 470, z: 190, e: "oops", lk: "right", p: "right" },
            sbend: { l: 690, t: 330, z: 190, e: "aha", lk: "right", p: "right" },
            switch: { l: 560, t: 440, z: 190, e: "wink", lk: "right", p: "right" },
            paradox: { l: 400, t: 330, z: 190, e: "think", lk: "right", p: "right" },
            bridge: { l: 1090, t: 460, z: 190, e: "aha", lk: "left", p: "eureka" },
            sky: { l: 1090, t: 520, z: 190, e: "aha", lk: "left", p: "eureka" },
          };
          const k = m[variant === "S" ? (figure as string) : variant === "J" ? "sky" : "bridge"] ?? m.bridge;
          return (
            <div style={{ position: "absolute", left: k.l, top: k.t, width: k.z, height: k.z }}>
              <Mascot expr={k.e} look={k.lk} point={k.p} size={k.z} frame={12} />
            </div>
          );
        })()}
        <div style={{ position: "absolute", right: 36, top: 26, fontSize: 40, fontWeight: 800, color: C.go, ...edge }}>WhyLoop</div>
      </AbsoluteFill>
    );
  }
  if (variant === "I") {
    // layout of F in the video's own theme: graphite background, spectrum colours, Mali, mascot Bit, WhyLoop mark
    const mali = brandFont("mali");
    const longest = Math.max(...lines.map((t) => t.length));
    const fs = Math.min(168, Math.round(540 / (longest * 0.58)));
    const step = fs * 1.04;
    const Fig = figure === "fits" ? Figure2 : figure === "bv" ? FigureBV : figure === "u" ? Figure3 : figure === "f" ? Figure : null;
    return (
      <AbsoluteFill style={{ background: "#1e1f22", fontFamily: mali, color: C.text }}>
        <div style={{ position: "absolute", left: 560, top: 40, width: 760, height: 640, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(169,123,255,0.22) 0%, rgba(169,123,255,0) 70%)" }} />
        <div style={{ position: "absolute", left: 64, top: 58, width: 56, height: 10, background: C.accent, borderRadius: 5 }} />
        <div style={{ position: "absolute", left: 64, top: 86, fontSize: 32, fontWeight: 700, letterSpacing: 6, color: C.go }}>{series}</div>
        {lines.map((t, i) => (
          <div key={i} style={{ position: "absolute", left: 58, top: 120 + (420 - lines.length * step) / 2 + i * step, fontSize: fs, fontWeight: 700,
            letterSpacing: -fs / 34, lineHeight: 1.05, whiteSpace: "nowrap", color: i === lines.length - 1 ? C.accent : "#ffffff" }}>{t}</div>
        ))}
        <div style={{ position: "absolute", left: 64, top: 548, width: 520, height: 4, background: "rgba(255,255,255,0.5)" }} />
        <div style={{ position: "absolute", left: 64, top: 570, width: 570, fontSize: hook.length > 26 ? 38 : 46, fontWeight: 600, lineHeight: 1.1,
          color: C.green }}>{hook}</div>
        <div style={{ position: "absolute", left: 650, top: 70, width: 580, height: 580, borderRadius: "50%", overflow: "hidden",
          background: "#2c2e33", border: "6px solid rgba(255,255,255,0.85)" }}>
          {Fig ? (
            <div style={{ position: "absolute", left: 66, top: 82 }}><Fig w={450} h={420} /></div>
          ) : (
            <div style={{ position: "absolute", left: 20, top: 30 }}>
              <CoverArt w={540} h={520} c0={C.red} c1={C.green} line={C.purple} accent={C.accent} r={11} n={110} seed={9} lw={7} />
            </div>
          )}
        </div>
        <div style={{ position: "absolute", left: 1080, top: 520, width: 190, height: 190 }}>
          <Mascot expr="aha" look="left" point="eureka" size={180} frame={12} />
        </div>
        <div style={{ position: "absolute", right: 36, top: 26, fontSize: 40, fontWeight: 800, color: C.go }}>WhyLoop</div>
      </AbsoluteFill>
    );
  }
  if (variant === "F") {
    const ink = "#14110f", red = "#d62828", teal = "#12908a", mus = "#f2a900";
    return (
      <AbsoluteFill style={{ background: "#f4efe4", fontFamily: font, color: ink }}>
        <div style={{ position: "absolute", left: 64, top: 56, width: 56, height: 10, background: red }} />
        <div style={{ position: "absolute", left: 64, top: 84, fontSize: 34, fontWeight: 700, letterSpacing: 7, color: ink }}>{series}</div>
        {lines.map((t, i) => (
          <div key={i} style={{ position: "absolute", left: 58, top: 170 + i * 168, fontSize: 176, fontWeight: 800, letterSpacing: -6,
            lineHeight: 1, color: i === lines.length - 1 ? red : ink }}>{t}</div>
        ))}
        <div style={{ position: "absolute", left: 64, top: 560, width: 520, height: 4, background: ink }} />
        <div style={{ position: "absolute", left: 64, top: 584, fontSize: 48, fontWeight: 500, color: ink }}>{hook}</div>
        <div style={{ position: "absolute", left: 640, top: 70, width: 580, height: 580, borderRadius: "50%", overflow: "hidden",
          background: "#fffaf0", border: `6px solid ${ink}` }}>
          <div style={{ position: "absolute", left: 20, top: 30 }}>
            <CoverArt w={540} h={520} c0={red} c1={teal} line={ink} accent={mus} r={11} n={110} seed={9} lw={6} />
          </div>
        </div>
      </AbsoluteFill>
    );
  }
  if (variant === "G") {
    const ink = "#f6f1e7", coral = "#ff6b57", mint = "#8fe3c3", gold = "#ffd166";
    return (
      <AbsoluteFill style={{ background: "#0b1730", fontFamily: font, color: ink }}>
        <div style={{ position: "absolute", left: 500, top: 30 }}>
          <CoverArt w={740} h={660} c0={coral} c1={mint} line={ink} accent={gold} r={11} n={190} seed={4} lw={5} />
        </div>
        <div style={{ position: "absolute", left: 0, top: 0, width: 700, height: 720,
          background: "linear-gradient(90deg, #0b1730 62%, rgba(11,23,48,0))" }} />
        <div style={{ position: "absolute", left: 64, top: 64, fontSize: 30, fontWeight: 700, letterSpacing: 8, color: gold }}>{series}</div>
        <div style={{ position: "absolute", left: 64, top: 108, width: 70, height: 6, background: gold }} />
        {lines.map((t, i) => (
          <div key={i} style={{ position: "absolute", left: 58, top: 190 + i * 160, fontSize: 168, fontWeight: 800, letterSpacing: -5,
            lineHeight: 1, color: ink }}>{t}</div>
        ))}
        <div style={{ position: "absolute", left: 64, top: 560, fontSize: 52, fontWeight: 500, color: mint, maxWidth: 560, lineHeight: 1.12 }}>{hook}</div>
      </AbsoluteFill>
    );
  }
  const ink = "#16130f", blue = "#1f4eb4", verm = "#e4432d", mus = "#f2b134";
  return (
    <AbsoluteFill style={{ background: "#efe5cf", fontFamily: font, color: ink }}>
      
      <div style={{ position: "absolute", left: 640, top: 150, width: 560, height: 420, borderRadius: 36, background: "#efe5cf" }} />
      <div style={{ position: "absolute", left: 640, top: 150 }}>
        <CoverArt w={560} h={420} c0={verm} c1={blue} line={ink} accent={mus} r={12} n={80} seed={12} lw={6} />
      </div>
      <div style={{ position: "absolute", left: 640, top: 600, width: 560, height: 16, background: ink }} />
      <div style={{ position: "absolute", left: 1090, top: 40, width: 0, height: 0, borderLeft: "70px solid transparent",
        borderRight: "70px solid transparent", borderBottom: `120px solid ${mus}` }} />
      <div style={{ position: "absolute", left: 64, top: 60, fontSize: 32, fontWeight: 800, letterSpacing: 7, color: verm }}>{series}</div>
      {lines.map((t, i) => (
        <div key={i} style={{ position: "absolute", left: 58, top: 150 + i * 170, fontSize: 180, fontWeight: 800, letterSpacing: -6, lineHeight: 1,
          textTransform: "uppercase", color: ink }}>{t}</div>
      ))}
      <div style={{ position: "absolute", left: 64, top: 560, width: 480, height: 14, background: verm }} />
      <div style={{ position: "absolute", left: 64, top: 596, fontSize: 48, fontWeight: 600, color: ink }}>{hook}</div>
    </AbsoluteFill>
  );
};

export const Thumbnail = ({ variant = "A", line1 = "Học thống kê", line2 = "là gì?", series = "MACHINE LEARNING · 1",
  caption = "Học thống kê là gì?", lines = ["Học", "thống kê", "là gì?"], lineSize = 150, figure = "f", big, hook, left, right, leftNum, rightNum, unit, tex = "f(X)+\\epsilon", texSize = 150 }: ThumbProps) => {
  if (variant === "F" || variant === "G" || variant === "H" || variant === "I" || variant === "J" || variant === "K" || variant === "S") return <ThumbnailCover variant={variant} series={series} big={big} hook={hook} figure={figure} />;
  if (variant === "C" || variant === "D" || variant === "E") return <ThumbnailLive variant={variant} series={series} big={big} hook={hook} left={left} right={right} leftNum={leftNum} rightNum={rightNum} unit={unit} />;
  const Fig = figure === "fits" ? Figure2 : figure === "bv" ? FigureBV : figure === "u" ? Figure3 : figure === "knn" ? FigureKNN : Figure;
  applyTheme("spectrum");
  const font = brandFont("mali");
  return (
    <AbsoluteFill style={{ background: `linear-gradient(150deg, ${C.bg} 0%, #182030 100%)`, fontFamily: font }}>
      <div style={{ position: "absolute", left: 600, top: 120, width: 760, height: 600, borderRadius: "50%",
        background: "rgba(255,159,67,0.20)", filter: "blur(120px)" }} />
      <div style={{ position: "absolute", left: -140, top: -160, width: 700, height: 420, borderRadius: "50%",
        background: "rgba(63,193,255,0.14)", filter: "blur(120px)" }} />
      {variant === "A" ? (
        <>
          <div style={{ position: "absolute", left: 84, top: 70, fontSize: 38, fontWeight: 800, color: C.go, letterSpacing: 4 }}>{series}</div>
          {lines.map((ln, i) => (
            <div key={i} style={{ position: "absolute", left: 76, top: 120 + i * lineSize * 1.01, fontSize: lineSize, fontWeight: 800,
              color: i === lines.length - 1 ? C.accent : "#fff", lineHeight: 1.04, letterSpacing: -2, whiteSpace: "nowrap" }}>{ln}</div>
          ))}
          <div style={{ position: "absolute", left: 740, top: 90 }}><Fig w={500} h={540} /></div>
        </>
      ) : (
        <>
          <div style={{ position: "absolute", left: 60, top: 190, width: 660, height: 220 }}>
            <EquationView n={{ tex, size: texSize }} color={C.purple} hl={false} />
          </div>
          <div style={{ position: "absolute", left: 84, top: 470, width: 620, fontSize: 56, fontWeight: 800, color: "#fff", lineHeight: 1.15 }}>{caption}</div>
          <div style={{ position: "absolute", left: 84, top: 70, fontSize: 38, fontWeight: 800, color: C.go, letterSpacing: 4 }}>{series}</div>
          <div style={{ position: "absolute", left: 740, top: 90 }}><Fig w={500} h={540} /></div>
        </>
      )}
    </AbsoluteFill>
  );
};
