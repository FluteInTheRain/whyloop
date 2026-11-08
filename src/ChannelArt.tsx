import React from "react";
import { AbsoluteFill } from "remotion";
import { C, T, applyTheme, brandFont } from "./theme";
import { EurekaBit, LoopArrow } from "./Avatar";

// YouTube Studio channel assets: transparent watermark (square) and banner (2560x1440, safe area 1235x338 centred).

export const Watermark = ({ theme = "spectrum" }: { theme?: string }) => {
  applyTheme(theme);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, top: 0, width: 800, height: 800,
        transform: "scale(0.375)", transformOrigin: "top left" }}>
        <EurekaBit />
      </div>
    </AbsoluteFill>
  );
};

export type BannerProps = { theme?: string; variant?: "A" | "B" | "C" | "D"; sub?: string };

const Glow = ({ x, y, w, h, color, o = 0.18, blur = 120 }: { x: number; y: number; w: number; h: number; color: string; o?: number; blur?: number }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: "50%", background: color,
    opacity: o, filter: `blur(${blur}px)` }} />
);

// A: the "loop" itself, big faint orbiting arrows + floating question marks
const BgA = () => {
  const marks: [number, number, number, number, string][] = [
    [190, 190, 150, -14, C.blue], [2250, 170, 120, 12, C.pink], [420, 1130, 170, 10, C.accent],
    [2090, 1090, 140, -10, C.purple], [90, 640, 110, 8, C.green], [2420, 700, 130, -8, C.orange],
    [1200, 110, 90, 6, C.go], [1500, 1280, 100, -6, C.pink],
  ];
  return (
    <>
      <Glow x={760} y={760} w={1100} h={600} color="#ff9f43" o={0.15} blur={110} />
      <svg width={2560} height={1440} style={{ position: "absolute" }}>
        <g opacity={0.2}><LoopArrow cx={1280} cy={720} r={640} w={16} a0={150} a1={420} color={C.go} /></g>
        <g opacity={0.15}><LoopArrow cx={1280} cy={720} r={860} w={14} a0={-30} a1={230} color={C.accent} /></g>
        <g opacity={0.12}><LoopArrow cx={1280} cy={720} r={1080} w={12} a0={200} a1={440} color={C.purple} /></g>
      </svg>
      {marks.map(([x, y, fs, r, c], i) => (
        <div key={i} style={{ position: "absolute", left: x, top: y, fontSize: fs, fontWeight: 800, color: c,
          opacity: 0.28, transform: `rotate(${r}deg)`, lineHeight: 1 }}>?</div>
      ))}
    </>
  );
};

// B: blueprint dot-grid + a tiny "while (why)" program fading in from both edges
const BgB = () => {
  const code = (lines: string[], align: "left" | "right") => (
    <div style={{ fontFamily: T.mono, fontSize: 40, lineHeight: 1.6, color: C.muted, opacity: 0.55, whiteSpace: "pre",
      textAlign: align }}>
      {lines.map((l, i) => <div key={i}>{l}</div>)}
    </div>
  );
  return (
    <>
      <svg width={2560} height={1440} style={{ position: "absolute" }}>
        <defs>
          <pattern id="dots" width={64} height={64} patternUnits="userSpaceOnUse">
            <circle cx={32} cy={32} r={3} fill={C.text} fillOpacity={0.1} />
          </pattern>
          <radialGradient id="fade" cx="50%" cy="50%" r="60%">
            <stop offset="0.35" stopColor="#fff" stopOpacity={0.15} />
            <stop offset="1" stopColor="#fff" stopOpacity={1} />
          </radialGradient>
          <mask id="m"><rect width={2560} height={1440} fill="url(#fade)" /></mask>
        </defs>
        <rect width={2560} height={1440} fill="url(#dots)" mask="url(#m)" />
      </svg>
      <Glow x={200} y={-200} w={900} h={600} color={C.blue} o={0.12} />
      <Glow x={1500} y={1000} w={900} h={600} color={C.pink} o={0.1} />
      <div style={{ position: "absolute", left: 130, top: 300 }}>
        {code(["while (true) {", "  ask(\"why?\");", "  learn();", "}"], "left")}
      </div>
      <div style={{ position: "absolute", right: 130, top: 820 }}>
        {code(["// vòng lặp vô hạn", "// của sự tò mò", "for (;;) understand++;"], "right")}
      </div>
    </>
  );
};

// C: spectrum aurora, no diagrams, plus a few sparkles
const Sparkle = ({ x, y, s, c }: { x: number; y: number; s: number; c: string }) => (
  <svg width={s} height={s} viewBox="-10 -10 20 20" style={{ position: "absolute", left: x, top: y, overflow: "visible" }}>
    <path d="M0 -10 C1 -3 3 -1 10 0 C3 1 1 3 0 10 C-1 3 -3 1 -10 0 C-3 -1 -1 -3 0 -10Z" fill={c} fillOpacity={0.7} />
  </svg>
);
const BgC = () => (
  <>
    <Glow x={-200} y={-250} w={1200} h={800} color={C.purple} o={0.32} blur={160} />
    <Glow x={1500} y={-200} w={1200} h={700} color={C.blue} o={0.28} blur={160} />
    <Glow x={900} y={900} w={1100} h={700} color={C.orange} o={0.22} blur={160} />
    <Glow x={-300} y={800} w={1000} h={700} color={C.pink} o={0.2} blur={160} />
    <Sparkle x={300} y={260} s={70} c={C.accent} /><Sparkle x={520} y={900} s={40} c={C.go} />
    <Sparkle x={2200} y={300} s={80} c={C.accent} /><Sparkle x={2000} y={1040} s={50} c={C.pink} />
    <Sparkle x={140} y={1100} s={50} c={C.blue} /><Sparkle x={2400} y={760} s={36} c={C.go} />
  </>
);

// D: a chain of "Why?" chips running off both edges, as if the question never ends
const Chip = ({ x, y, text, c, o }: { x: number; y: number; text: string; c: string; o: number }) => (
  <div style={{ position: "absolute", left: x, top: y, width: text.length > 6 ? 300 : 230, height: 96, borderRadius: 30,
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 50, fontWeight: 700, color: c,
    opacity: o, border: `4px solid ${c}`, background: "rgba(255,255,255,0.04)" }}>{text}</div>
);
const BgD = () => (
  <>
    <Glow x={760} y={760} w={1100} h={600} color="#ff9f43" o={0.13} blur={110} />
    <svg width={2560} height={1440} style={{ position: "absolute" }}>
      <path d="M170 328 H350 M650 328 H760" stroke={C.go} strokeOpacity={0.4} strokeWidth={5}
        strokeDasharray="10 10" />
      <path d="M1930 1100 H2020 M2320 1100 H2350" stroke={C.accent} strokeOpacity={0.4}
        strokeWidth={5} strokeDasharray="10 10" />
    </svg>
    <Chip x={-60} y={280} text="Why?" c={C.go} o={0.25} />
    <Chip x={350} y={280} text="Tại sao?" c={C.blue} o={0.4} />
    <Chip x={760} y={280} text="Why?" c={C.purple} o={0.3} />
    <Chip x={1700} y={1052} text="Why?" c={C.pink} o={0.3} />
    <Chip x={2020} y={1052} text="Tại sao?" c={C.accent} o={0.4} />
    <Chip x={2350} y={1052} text="Why?" c={C.green} o={0.25} />
    <Chip x={-40} y={560} text="Vì sao?" c={C.orange} o={0.25} />
    <Chip x={2340} y={780} text="Vì sao?" c={C.purple} o={0.25} />
  </>
);

export const Banner = ({ theme = "spectrum", variant = "A", sub = "Khoa học máy tính, giải thích bằng hình" }: BannerProps) => {
  applyTheme(theme);
  const font = brandFont("mali");
  const Bg = { A: BgA, B: BgB, C: BgC, D: BgD }[variant];
  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${C.bg} 0%, ${C.panel} 100%)`, fontFamily: font }}>
      <Bg />
      {/* safe area: x 662..1897, y 551..889 */}
      <div style={{ position: "absolute", left: 662, top: 551, width: 1235, height: 338, display: "flex",
        alignItems: "center", gap: 36 }}>
        <div style={{ position: "relative", width: 330, height: 330, flex: "none" }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: 800, height: 800,
            transform: "scale(0.4125)", transformOrigin: "top left" }}><EurekaBit /></div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 150, fontWeight: 800, color: C.text, lineHeight: 1, letterSpacing: -2 }}>
            Why<span style={{ color: C.accent }}>Loop</span>
          </div>
          <div style={{ marginTop: 20, fontSize: 52, fontWeight: 600, color: C.go }}>Ask why. Then ask again.</div>
          <div style={{ marginTop: 14, fontSize: 38, fontWeight: 500, color: C.muted }}>{sub}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
