import React from "react";
import { AbsoluteFill, Audio, Easing, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, MONO, applyTheme } from "./theme";
import { Backdrop } from "./Video";
import { Mascot, Expr } from "./mascot";

// ~90 s introduction to the project, built with the project itself (promo/build.py makes the voice-over and promo/timeline.json).
type Sent = { text: string; from: number; to: number };
type PScene = { id: string; vo: string; voFrames: number; lead: number; durationInFrames: number; sentences: Sent[] };
export type PromoProps = { fps: number; theme: string; scenes: PScene[] };

const FONT = '"Mali", "Helvetica Neue", sans-serif';
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const prog = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
const ico = (n: string) => staticFile(`promo/icons/${n}.svg`);
const typed = (s: string, f: number, start: number, cps = 1.7) => s.slice(0, Math.max(0, Math.floor((f - start) * cps)));
const rnd = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const URL_REPO = "github.com/FluteInTheRain/whyloop";

const Captions = ({ sc }: { sc: PScene }) => {
  const f = useCurrentFrame();
  const cur = [...sc.sentences].reverse().find((s) => f >= s.from);
  if (!cur) return null;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 46 }}>
      <div style={{ opacity: prog(f, cur.from, cur.from + 6), maxWidth: 1400, textAlign: "center", fontSize: 36, lineHeight: 1.35,
        padding: "12px 26px", borderRadius: 14, background: "rgba(0,0,0,0.55)", color: C.text, fontFamily: FONT }}>
        {cur.text}
      </div>
    </AbsoluteFill>
  );
};

const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: C.panel, borderRadius: 20, boxShadow: "0 10px 30px rgba(0,0,0,0.35)", ...style }}>{children}</div>
);

const Hook = () => {
  const f = useCurrentFrame();
  const a = prog(f, 12, 40), b = prog(f, 136, 160);
  const item = (i: number, node: React.ReactNode) => (
    <div style={{ opacity: prog(f, 24 + i * 22, 50 + i * 22), transform: `translateY(${(1 - prog(f, 24 + i * 22, 50 + i * 22)) * 30}px)` }}>{node}</div>
  );
  return (
    <AbsoluteFill style={{ alignItems: "center", fontFamily: FONT }}>
      <div style={{ position: "absolute", top: 150, opacity: a * (1 - b), fontSize: 76, fontWeight: 700, color: C.text, textAlign: "center", lineHeight: 1.2 }}>
        A whole video course,<br />built like software?
      </div>
      <div style={{ position: "absolute", top: 130, opacity: b, transform: `scale(${0.92 + 0.08 * b})`, fontSize: 104, fontWeight: 700, textAlign: "center", lineHeight: 1.15 }}>
        <span style={{ color: C.muted }}>Not edited.</span><br /><span style={{ color: C.accent }}>Compiled.</span>
      </div>
      <div style={{ position: "absolute", top: 520, display: "flex", alignItems: "center", gap: 64 }}>
        {item(0, <Img src={ico("books")} style={{ width: 230, height: 230 }} />)}
        {item(1, <div style={{ fontSize: 70, color: C.muted }}>→</div>)}
        {item(2, <div style={{ fontFamily: MONO, fontSize: 42, color: b > 0.5 ? C.accent : C.go, padding: "26px 40px", borderRadius: 20,
          border: `4px solid ${b > 0.5 ? C.accent : C.go}`, background: "#141517" }}>{"{ compile }"}</div>)}
        {item(3, <div style={{ fontSize: 70, color: C.muted }}>→</div>)}
        {item(4, <Img src={ico("film-reel")} style={{ width: 230, height: 230 }} />)}
      </div>
    </AbsoluteFill>
  );
};

const Pain = () => {
  const f = useCurrentFrame();
  const steps = [["memo", "write"], ["film-reel", "animate"], ["speech-balloon", "record"], ["globe-with-meridians", "translate"], ["magnifying-glass-tilted-left", "check"]];
  const hit = prog(f, 261, 285);
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <div style={{ position: "absolute", top: 230, left: 305, display: "flex", gap: 40 }}>
        {steps.map(([ic, label], i) => {
          const p = prog(f, 24 + i * 46, 52 + i * 46);
          const shake = Math.sin(f * 1.7 + i) * 4 * hit;
          return (
            <Card key={label} style={{ width: 230, height: 270, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18,
              opacity: p * (1 - hit), transform: `translate(${shake}px, ${(1 - p) * 40}px)` }}>
              <Img src={ico(ic)} style={{ width: 120, height: 120 }} />
              <div style={{ fontSize: 34, fontWeight: 600, color: C.text }}>{label}</div>
            </Card>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 160, width: "100%", textAlign: "center", opacity: hit, transform: `scale(${0.7 + 0.3 * hit})` }}>
        <span style={{ fontSize: 190, fontWeight: 700, color: C.red }}>×36</span>
        <div style={{ fontSize: 44, color: C.text, marginTop: -10 }}>episodes planned for one series</div>
      </div>
      <div style={{ position: "absolute", top: 520, left: 0, width: 1920, display: "flex", justifyContent: "center" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 96px)", gap: 14 }}>
          {Array.from({ length: 36 }, (_, i) => {
            const t = prog(f, 285 + i * 2, 300 + i * 2);
            return <Card key={i} style={{ width: 96, height: 72, display: "flex", alignItems: "center", justifyContent: "center", opacity: t, transform: `scale(${0.6 + 0.4 * t})` }}>
              <Img src={ico("film-reel")} style={{ width: 44, height: 44 }} /></Card>;
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Idea = () => {
  const f = useCurrentFrame();
  const head = prog(f, 12, 36);
  const node = (i: number, ic: React.ReactNode, label: string, col: string) => {
    const p = prog(f, 50 + i * 40, 80 + i * 40);
    return (
      <div style={{ opacity: p, transform: `translateY(${(1 - p) * 30}px)`, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <Card style={{ width: 300, height: 280, display: "flex", alignItems: "center", justifyContent: "center", border: `4px solid ${col}` }}>{ic}</Card>
        <div style={{ fontSize: 40, fontWeight: 600, color: col }}>{label}</div>
      </div>
    );
  };
  const arrow = (i: number) => <div style={{ fontSize: 80, color: C.muted, opacity: prog(f, 70 + i * 40, 100 + i * 40) }}>→</div>;
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <div style={{ position: "absolute", top: 90, width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 28,
        opacity: head, transform: `translateY(${(1 - head) * 20}px)` }}>
        <Img src={staticFile("promo/avatar.png")} style={{ width: 150, height: 150, borderRadius: 34 }} />
        <div style={{ fontSize: 116, fontWeight: 700, color: C.go }}>WhyLoop</div>
      </div>
      <div style={{ position: "absolute", top: 400, width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 50 }}>
        {node(0, <Img src={ico("books")} style={{ width: 190, height: 190 }} />, "1 textbook chapter", C.go)}
        {arrow(0)}
        {node(1, <Img src={staticFile("promo/avatar.png")} style={{ width: 190, height: 190, borderRadius: 40 }} />, "WhyLoop", C.purple)}
        {arrow(1)}
        {node(2, <div style={{ display: "flex", gap: 16 }}>
          <div style={{ fontSize: 70, fontWeight: 700, color: C.accent }}>EN</div><div style={{ fontSize: 70, color: C.muted }}>+</div><div style={{ fontSize: 70, fontWeight: 700, color: C.pink }}>VI</div></div>,
          "1 finished episode", C.accent)}
      </div>
    </AbsoluteFill>
  );
};

const FLOW = [
  { ic: "books", t: "Chapter", s: "book, re-explained", col: () => C.go },
  { ic: "chart-increasing", t: "Python", s: "simulate · fit", col: () => C.purple },
  { ic: "memo", t: "script", s: "EN + VI + visuals", col: () => C.accent },
  { ic: "magnifying-glass-tilted-left", t: "Lint", s: "measure every beat", col: () => C.green },
  { ic: "control-knobs", t: "Render", s: "picture · voice · music", col: () => C.pink },
  { ic: "rocket", t: "Publish", s: "mp4 + m4a → YouTube", col: () => C.go },
];

const Box = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ position: "absolute", background: "#141517", border: "2px solid #3b3e45", borderRadius: 18, padding: "18px 28px", ...style }}>{children}</div>
);
const Pill = ({ children, col, o = 1, style }: { children: React.ReactNode; col: string; o?: number; style?: React.CSSProperties }) => (
  <div style={{ position: "absolute", fontSize: 34, color: C.text, padding: "10px 26px", borderRadius: 40, border: `3px solid ${col}`, background: C.panel, opacity: o,
    transform: `translateX(${(1 - o) * 30}px)`, whiteSpace: "nowrap", ...style }}>{children}</div>
);

// detail panel under the flow row: a concrete example of the step that is active (lf = frames since the step started)
const FlowDetail = ({ k, lf }: { k: number; lf: number }) => {
  const a = (s: number, d = 14) => prog(lf, s, s + d);
  const code = (lines: [string, number, string][], fs = 30) => lines.map(([t, s, c], i) => (
    <div key={i} style={{ fontFamily: MONO, fontSize: fs, lineHeight: "50px", whiteSpace: "pre", color: c, opacity: lf >= s ? 1 : 0 }}>{typed(t, lf, s, 1.8)}</div>));
  if (k === 0) return (<>
    <Img src={ico("books")} style={{ position: "absolute", left: 140, top: 40, width: 260, height: 260, opacity: a(0) }} />
    <Pill col={C.go} o={a(14)} style={{ left: 520, top: 30 }}>re-written in new words, not copied</Pill>
    <Pill col={C.go} o={a(28)} style={{ left: 520, top: 120 }}>data is synthetic, redrawn diagrams</Pill>
    <Pill col={C.go} o={a(42)} style={{ left: 520, top: 210 }}>source pages are cited</Pill>
  </>);
  if (k === 1) return (<>
    <Box style={{ left: 120, top: 0, width: 920, height: 330 }}>{code([
      ["students = simulate(n=80)", 6, C.text], ["fit = newton_irls(students)", 26, C.text], ["p = fit.prob(hours=5)", 48, C.text]])}</Box>
    <div style={{ position: "absolute", left: 1120, top: 20, fontSize: 40, color: C.muted, opacity: a(70) }}>result</div>
    <div style={{ position: "absolute", left: 1120, top: 70, fontFamily: MONO, fontSize: 150, fontWeight: 700, color: C.accent, opacity: a(70, 18) }}>0.56</div>
    <div style={{ position: "absolute", left: 1120, top: 250, fontSize: 34, color: C.text, opacity: a(90) }}>computed once, reused everywhere</div>
  </>);
  if (k === 2) return (<>
    <Box style={{ left: 120, top: 0, width: 1000, height: 350 }}>{code([
      ["{ \"text\":    \"Five hours gives 0.56.\",", 4, C.text], ["  \"text_vi\": \"Năm giờ học, xác suất 0,56.\",", 22, C.pink],
      ["  \"props\":   { \"table\": …, \"mark\": 0.56 } }", 42, C.go]], 27)}
      <div style={{ position: "absolute", left: 28, bottom: 12, fontSize: 20, color: C.muted }}>one beat of script.json (example)</div></Box>
    <Pill col={C.go} o={a(64)} style={{ left: 1180, top: 20 }}>props → picture</Pill>
    <Pill col={C.accent} o={a(78)} style={{ left: 1180, top: 130 }}>text → English voice</Pill>
    <Pill col={C.pink} o={a(92)} style={{ left: 1180, top: 240 }}>text_vi → Vietnamese dub</Pill>
  </>);
  if (k === 3) {
    const S = 600 / 960, bad = lf >= 50 && lf < 150, ok = lf >= 150;
    const boxes: [number, number, number, number][] = [[160, 56, 438, 58], [84, 140, 28, 228], [384, 410, 194, 28], [112, 440, 200, 46]];
    return (<>
      <Box style={{ left: 60, top: 0, width: 880, height: 380 }}>{code([
        ["$ ./make-video lint episode", 4, C.text], ["beat 12: label overlaps icon", 40, C.red], ["→ fix the script, run again", 90, C.muted], ["0 issues  ✓", 140, C.green]], 28)}</Box>
      <Img src={staticFile("promo/frame-plot.png")} style={{ position: "absolute", left: 1000, top: 10, width: 600, height: 338, borderRadius: 14, border: "2px solid #3b3e45", opacity: a(0) }} />
      {boxes.map(([x, y, w, h], i) => (
        <div key={i} style={{ position: "absolute", left: 1000 + x * S, top: 10 + y * S, width: w * S, height: h * S, borderRadius: 5, opacity: a(10 + i * 8, 10),
          border: `3px solid ${ok ? C.green : bad && i === 0 ? C.red : C.go}` }} />))}
    </>);
  }
  if (k === 4) {
    const N = 44, rows = [{ y: 20, l: "EN", col: C.go }, { y: 120, l: "VI", col: C.pink }, { y: 220, l: "music", col: C.purple }];
    const play = prog(lf, 20, 120);
    return (<>
      <Img src={staticFile("promo/frame-table.png")} style={{ position: "absolute", left: 80, top: 20, width: 480, height: 270, borderRadius: 14, border: "2px solid #3b3e45", opacity: a(0) }} />
      <div style={{ position: "absolute", left: 80, top: 300, fontSize: 28, color: C.muted, opacity: a(10) }}>frames, 2560×1440</div>
      {rows.map((r, ri) => (<div key={r.l}>
        <div style={{ position: "absolute", left: 640, top: r.y + 24, fontSize: 34, fontWeight: 700, color: r.col, width: 120, opacity: a(6 + ri * 8) }}>{r.l}</div>
        {Array.from({ length: N }, (_, i) => {
          const h = ri === 2 ? 10 + 18 * Math.abs(Math.sin(i * 0.7)) : 10 + 70 * Math.abs(Math.sin(i * 0.9 + ri * 2) * Math.sin(i * 0.31));
          return <div key={i} style={{ position: "absolute", left: 770 + i * 22, top: r.y + 40 - h / 2, width: 13, height: h * a(6 + ri * 8, 20), borderRadius: 3,
            background: i / N < play ? r.col : "#4a4d55" }} />;
        })}
      </div>))}
      <Pill col={C.green} o={a(120)} style={{ left: 1100, top: 305 }}>same length ✓</Pill>
    </>);
  }
  return (<>
    <Card style={{ position: "absolute", left: 180, top: 30, width: 640, height: 130, padding: "0 30px", display: "flex", alignItems: "center", gap: 24, opacity: a(0), border: `3px solid ${C.go}` }}>
      <Img src={ico("film-reel")} style={{ width: 80, height: 80 }} /><div><div style={{ fontFamily: MONO, fontSize: 36, color: C.text }}>episode.mp4</div><div style={{ fontSize: 28, color: C.muted }}>English picture + audio</div></div></Card>
    <Card style={{ position: "absolute", left: 180, top: 200, width: 640, height: 130, padding: "0 30px", display: "flex", alignItems: "center", gap: 24, opacity: a(16), border: `3px solid ${C.pink}` }}>
      <Img src={ico("speech-balloon")} style={{ width: 80, height: 80 }} /><div><div style={{ fontFamily: MONO, fontSize: 36, color: C.text }}>episode.vi.m4a</div><div style={{ fontSize: 28, color: C.muted }}>Vietnamese dub, same length</div></div></Card>
    <div style={{ position: "absolute", left: 880, top: 110, fontSize: 90, color: C.muted, opacity: a(40) }}>→</div>
    <Img src={ico("rocket")} style={{ position: "absolute", left: 1040, top: 60, width: 220, height: 220, opacity: a(48) }} />
    <div style={{ position: "absolute", left: 1300, top: 100, fontSize: 56, fontWeight: 700, color: C.accent, opacity: a(56) }}>YouTube</div>
    <div style={{ position: "absolute", left: 1300, top: 180, fontSize: 32, color: C.muted, opacity: a(64) }}>upload with one command</div>
  </>);
};

const Flow = ({ sc }: { sc: PScene }) => {
  const f = useCurrentFrame();
  const NW = 255, GAP = 54, X0 = 60, TOP = 190, NH = 190;
  const starts = FLOW.map((_, i) => sc.sentences[i + 1]?.from ?? 1e9);
  const k = starts.reduce((acc, s, i) => (f >= s ? i : acc), -1);
  const cx = (i: number) => X0 + i * (NW + GAP) + NW / 2;
  const hop = k >= 1 ? prog(f, starts[k], starts[k] + 24) : 1;
  const dotX = k >= 1 ? cx(k - 1) + (cx(k) - cx(k - 1)) * hop : cx(0);
  const loop = k === 3 ? prog(f, starts[3] + 50, starts[3] + 80) : 0;
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <svg style={{ position: "absolute", left: 0, top: 0 }} width={1920} height={1080}>
        {FLOW.slice(1).map((_, i) => {
          const x1 = X0 + i * (NW + GAP) + NW, x2 = x1 + GAP, y = TOP + NH / 2, done = k > i;
          return <g key={i}><line x1={x1 + 4} y1={y} x2={x2 - 14} y2={y} stroke={done ? C.text : "#4a4d55"} strokeWidth={5} />
            <polygon points={`${x2 - 2},${y} ${x2 - 18},${y - 11} ${x2 - 18},${y + 11}`} fill={done ? C.text : "#4a4d55"} /></g>;
        })}
        <path d={`M ${cx(3)} ${TOP - 6} C ${cx(3)} ${TOP - 90}, ${cx(2)} ${TOP - 90}, ${cx(2)} ${TOP - 10}`} fill="none" stroke={C.red} strokeWidth={5}
          strokeDasharray="14 10" opacity={loop} />
        <polygon points={`${cx(2)},${TOP - 4} ${cx(2) - 11},${TOP - 22} ${cx(2) + 11},${TOP - 22}`} fill={C.red} opacity={loop} />
      </svg>
      <div style={{ position: "absolute", left: (cx(2) + cx(3)) / 2 - 220, top: TOP - 128, width: 440, whiteSpace: "nowrap", textAlign: "center", fontSize: 32, color: C.red, opacity: loop }}>problem? fix, run again</div>
      {FLOW.map((n, i) => {
        const appear = prog(f, 8 + i * 6, 26 + i * 6), on = k === i, past = k > i, col = n.col();
        return (
          <Card key={n.t} style={{ position: "absolute", left: X0 + i * (NW + GAP), top: TOP, width: NW, height: NH, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 8, border: `4px solid ${on ? col : past ? col + "99" : "#3b3e45"}`,
            opacity: appear * (on ? 1 : past ? 0.8 : 0.5), transform: `translateY(${(1 - appear) * 24}px) scale(${on ? 1.06 : 1})`,
            boxShadow: on ? `0 0 34px ${col}77` : undefined }}>
            <div style={{ position: "absolute", left: 14, top: 8, fontSize: 28, fontWeight: 700, color: col }}>{i + 1}</div>
            <Img src={ico(n.ic)} style={{ width: 80, height: 80 }} />
            <div style={{ fontSize: 36, fontWeight: 700, color: C.text, fontFamily: i === 2 || i === 1 ? MONO : FONT }}>{n.t}</div>
            <div style={{ fontSize: 22, color: C.muted }}>{n.s}</div>
          </Card>);
      })}
      {k >= 0 && (
        <div style={{ position: "absolute", left: dotX - 17, top: TOP + NH + 24, width: 34, height: 34, borderRadius: 17, background: C.accent,
          boxShadow: `0 0 ${18 + 8 * Math.sin(f / 4)}px ${C.accent}` }} />)}
      <div style={{ position: "absolute", left: 0, top: 480, width: 1920, height: 400 }}>
        {k >= 0 && <div key={k} style={{ position: "absolute", inset: 0, opacity: prog(f, starts[k], starts[k] + 12) }}>
          <FlowDetail k={k} lf={f - starts[k]} /></div>}
      </div>
    </AbsoluteFill>
  );
};

const Data = () => {
  const f = useCurrentFrame() * 1.3;
  const lines: [string, number, string][] = [
    ["students = simulate(n=80)", 20, C.text],
    ["fit = newton_irls(students)   # from scratch", 52, C.text],
    ["p = fit.prob(hours=5)", 92, C.text],
    ["print(f\"{p:.2f}\")", 120, C.text],
  ];
  const out = prog(f, 150, 170);
  const pulse = 0.6 + 0.4 * Math.sin(f / 6);
  const one = prog(f, 300, 330);
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <div style={{ position: "absolute", left: 60, top: 190, width: 800, height: 450, background: "#141517", border: "2px solid #3b3e45", borderRadius: 18, padding: "20px 30px" }}>
        <div style={{ fontSize: 22, color: C.muted, marginBottom: 20 }}>gen_script.py (simplified)</div>
        {lines.map(([t, s, c], i) => (
          <div key={i} style={{ fontFamily: MONO, fontSize: 27, lineHeight: "50px", color: c, whiteSpace: "pre", opacity: f >= s ? 1 : 0 }}>
            {typed(t, f, s, 1.4).split("#")[0]}<span style={{ color: C.muted }}>{typed(t, f, s, 1.4).includes("#") ? "#" + typed(t, f, s, 1.4).split("#").slice(1).join("#") : ""}</span>
          </div>
        ))}
        <div style={{ fontFamily: MONO, fontSize: 64, fontWeight: 700, color: C.accent, marginTop: 16, opacity: out, transform: `translateX(${(1 - out) * -20}px)` }}>→ 0.56</div>
      </div>
      <div style={{ position: "absolute", left: 920, top: 190, width: 880, height: 495 }}>
        <Img src={staticFile("promo/frame-table.png")} style={{ width: 880, height: 495, borderRadius: 18, border: "2px solid #3b3e45", opacity: prog(f, 60, 90) }} />
        <div style={{ position: "absolute", left: 1557 - 920, top: 453 - 190, width: 119, height: 42, borderRadius: 8, border: `4px solid ${C.accent}`,
          boxShadow: `0 0 ${24 * pulse}px ${C.accent}`, opacity: out }} />
      </div>
      <div style={{ position: "absolute", left: 1000, top: 720, display: "flex", alignItems: "center", gap: 16, padding: "12px 26px", borderRadius: 40,
        border: `3px solid ${C.accent}`, background: C.panel, opacity: prog(f, 240, 262), transform: `translateY(${(1 - prog(f, 240, 262)) * 20}px)` }}>
        <Img src={ico("speech-balloon")} style={{ width: 54, height: 54 }} />
        <div style={{ fontSize: 34, color: C.text }}>voice-over: “zero point five six”</div>
      </div>
      <div style={{ position: "absolute", left: 60, top: 700, width: 800, textAlign: "center", fontSize: 44, fontWeight: 700, color: C.accent, opacity: one, transform: `scale(${0.9 + 0.1 * one})` }}>
        one value → code · picture · voice
      </div>
    </AbsoluteFill>
  );
};

const Lint = () => {
  const f = useCurrentFrame() * 1.3;
  const S = 860 / 960, IX = 1000, IY = 190;
  const lines: [string, number, string][] = [
    ["$ ./make-video lint episode --png", 20, C.text],
    ["rendering the end of every beat…  58/58", 60, C.muted],
    ["beat  12 [text-over-text] label overlaps icon", 243, C.red],
    ["1 problem in 1/58 beats", 262, C.red],
    ["$ # fix the script, run again", 300, C.muted],
    ["$ ./make-video lint episode --png", 330, C.text],
    ["0 problems  ✓", 372, C.green],
  ];
  const boxes: [number, number, number, number][] = [[160, 56, 438, 58], [84, 140, 28, 228], [384, 410, 194, 28], [112, 440, 200, 46], [806, 16, 96, 30]];
  const allGreen = f >= 372;
  return (
    <AbsoluteFill style={{ fontFamily: FONT, transform: "translateY(50px)" }}>
      <div style={{ position: "absolute", left: 60, top: 190, width: 900, height: 430, background: "#141517", border: "2px solid #3b3e45", borderRadius: 18, padding: "22px 30px" }}>
        {lines.map(([t, s, c], i) => (
          <div key={i} style={{ fontFamily: MONO, fontSize: 25, lineHeight: "50px", color: c, whiteSpace: "pre", opacity: f >= s ? 1 : 0 }}>{typed(t, f, s, 1.9)}</div>
        ))}
        <div style={{ position: "absolute", left: 30, bottom: 14, fontSize: 20, color: C.muted }}>example output</div>
      </div>
      <Img src={staticFile("promo/frame-plot.png")} style={{ position: "absolute", left: IX, top: IY, width: 860, height: 484, borderRadius: 18, border: "2px solid #3b3e45" }} />
      {boxes.map(([x, y, w, h], i) => {
        const shown = prog(f, 70 + i * 24, 84 + i * 24);
        const bad = i === 0 && f >= 243 && !allGreen;
        const col = allGreen ? C.green : bad ? C.red : C.go;
        return (
          <div key={i} style={{ position: "absolute", left: IX + x * S, top: IY + y * S, width: w * S, height: h * S, borderRadius: 6,
            border: `3px solid ${col}`, opacity: shown, boxShadow: bad ? `0 0 ${14 + 10 * Math.sin(f / 4)}px ${C.red}` : "none" }} />
        );
      })}
    </AbsoluteFill>
  );
};

const Sound = () => {
  const f = useCurrentFrame() * 1.3;
  const X0 = 330, WID = 1460, SLOTS = 24, PER = 8, N = SLOTS * PER, pitch = WID / N;
  const head = prog(f, 150, 175);
  const play = X0 + WID * prog(f, 50, 300);
  const rows = [
    { y: 280, label: "EN", sub: "Kokoro", col: C.go, fill: (s: number) => 0.55 + 0.3 * rnd(s) },
    { y: 480, label: "VI", sub: "VieNeu", col: C.purple, fill: (s: number) => 0.7 + 0.2 * rnd(s + 40) },
    { y: 680, label: "music", sub: "ACE-Step", col: C.pink, fill: () => 1 },
  ];
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <div style={{ position: "absolute", left: X0, top: 120, fontSize: 38, fontWeight: 600, color: C.muted, opacity: head }}>one beat = one time slot  ↓</div>
      <div style={{ position: "absolute", right: 120, top: 112, display: "flex", alignItems: "center", gap: 14, opacity: prog(f, 250, 275) }}>
        <Img src={ico("check-mark-button")} style={{ width: 56, height: 56 }} />
        <div style={{ fontSize: 40, fontWeight: 700, color: C.green }}>same length</div>
      </div>
      {rows.map((r, ri) => (
        <div key={r.label}>
          <div style={{ position: "absolute", left: 60, top: r.y + 28, width: 250, color: r.col, opacity: prog(f, 10 + ri * 12, 30 + ri * 12) }}><div style={{ fontSize: 38, fontWeight: 700 }}>{r.label}</div><div style={{ fontSize: 26, color: C.muted }}>{r.sub}</div></div>
          {Array.from({ length: N }, (_, i) => {
            const slot = Math.floor(i / PER), within = (i % PER) / PER;
            const speaking = ri === 2 ? true : within < r.fill(slot);
            const amp = ri === 2 ? 0.35 : 1;
            const h = speaking ? (14 + 110 * amp * Math.abs(Math.sin(i * 0.9 + ri * 2) * Math.sin(i * 0.31 + slot))) : 4;
            const lit = X0 + i * pitch < play;
            const appear = prog(f, 20 + ri * 12, 50 + ri * 12);
            return <div key={i} style={{ position: "absolute", left: X0 + i * pitch, top: r.y + 60 - h / 2, width: pitch * 0.62, height: h * appear, borderRadius: 3,
              background: lit ? r.col : "#4a4d55" }} />;
          })}
        </div>
      ))}
      {Array.from({ length: SLOTS + 1 }, (_, s) => (
        <div key={s} style={{ position: "absolute", left: X0 + s * (WID / SLOTS) - 1, top: 230, width: 2, height: 530, background: "rgba(255,255,255,0.12)" }} />
      ))}
      <div style={{ position: "absolute", left: play - 2, top: 215, width: 4, height: 560, background: C.accent, borderRadius: 2, opacity: prog(f, 50, 60) * (1 - prog(f, 300, 310)) }} />
    </AbsoluteFill>
  );
};

const Result = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const stats: [number, number, number, string, string, number][] = [
    [12, 14, 0, "episodes on YouTube", "", 80],
    [114, 967, 0, "animated beats", "", 60],
    [211, 2.5, 1, "hours of video", "", 50],
    [280, 2, 0, "languages", "", 20],
  ];
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      {Array.from({ length: 14 }, (_, i) => {
        const s = spring({ frame: f - (12 + i * 5), fps, config: { damping: 14, stiffness: 120 } });
        const col = i % 7, row = Math.floor(i / 7);
        return <Img key={i} src={staticFile(`promo/thumbs/${String(i + 1).padStart(2, "0")}.jpg`)}
          style={{ position: "absolute", left: 106 + col * (232 + 14), top: 130 + row * (130 + 14), width: 232, height: 130, borderRadius: 10,
            boxShadow: "0 8px 22px rgba(0,0,0,0.4)", opacity: Math.min(1, s), transform: `scale(${0.6 + 0.4 * s})` }} />;
      })}
      {stats.map(([start, val, dec, label, _u, dur], i) => {
        const p = prog(f, start, start + dur);
        const shown = (val * p).toFixed(dec);
        const vis = prog(f, start, start + 12);
        return (
          <Card key={label} style={{ position: "absolute", left: 155 + i * 410, top: 520, width: 380, height: 230, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", opacity: vis, transform: `translateY(${(1 - vis) * 30}px)` }}>
            <div style={{ fontSize: 110, fontWeight: 700, color: [C.accent, C.go, C.purple, C.pink][i], lineHeight: 1.1 }}>{shown}</div>
            <div style={{ fontSize: 30, color: C.muted, marginTop: 6 }}>{label}</div>
          </Card>
        );
      })}
    </AbsoluteFill>
  );
};

const Cta = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - 8, fps, config: { damping: 12, stiffness: 110 } });
  return (
    <AbsoluteFill style={{ alignItems: "center", fontFamily: FONT }}>
      <div style={{ position: "absolute", top: 130, display: "flex", alignItems: "center", gap: 36, transform: `scale(${0.7 + 0.3 * s})`, opacity: Math.min(1, s) }}>
        <Img src={staticFile("promo/avatar.png")} style={{ width: 260, height: 260, borderRadius: 60 }} />
        <div style={{ fontSize: 150, fontWeight: 700, color: C.go }}>WhyLoop</div>
      </div>
      <div style={{ position: "absolute", top: 520, fontFamily: MONO, fontSize: 60, color: C.text, padding: "18px 40px", borderRadius: 18, background: "#141517", border: "2px solid #3b3e45" }}>
        {typed(URL_REPO, f, 70, 0.9)}
      </div>
      <div style={{ position: "absolute", top: 690, fontSize: 72, fontWeight: 700, color: C.accent, opacity: prog(f, 98, 120) }}>Ask why. Then ask again.</div>
    </AbsoluteFill>
  );
};

const VIEW: Record<string, { Comp: React.FC<{ sc: PScene }>; expr?: Expr }> = {
  hook: { Comp: Hook, expr: "wow" }, pain: { Comp: Pain, expr: "oops" }, idea: { Comp: Idea, expr: "happy" }, flow: { Comp: Flow, expr: "think" }, data: { Comp: Data, expr: "think" },
  lint: { Comp: Lint, expr: "wink" }, sound: { Comp: Sound, expr: "happy" }, result: { Comp: Result, expr: "aha" }, cta: { Comp: Cta },
};

const MascotCorner = ({ expr }: { expr: Expr }) => {
  const f = useCurrentFrame();
  return <div style={{ position: "absolute", left: 60, bottom: 24 }}><Mascot char="bit" expr={expr} size={130} frame={f} /></div>;
};

export const Promo = ({ scenes, theme }: PromoProps) => {
  applyTheme(theme);
  const total = scenes.reduce((a, s) => a + s.durationInFrames, 0);
  let from = 0;
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT }}>
      <Backdrop />
      <Audio src={staticFile("promo/music.wav")} loop volume={(fr) => 0.13 * Math.min(1, fr / 45) * Math.min(1, (total - fr) / 75)} />
      {scenes.map((sc) => {
        const start = from; from += sc.durationInFrames;
        const v = VIEW[sc.id];
        return (
          <Sequence key={sc.id} from={start} durationInFrames={sc.durationInFrames}>
            <v.Comp sc={sc} />
            {v.expr && <MascotCorner expr={v.expr} />}
            <Sequence from={sc.lead}><Audio src={staticFile(sc.vo)} /></Sequence>
            <Captions sc={sc} />
          </Sequence>
        );
      })}
      <div style={{ position: "absolute", right: 60, top: 36, fontSize: 38, fontWeight: 600, color: C.go }}>WhyLoop</div>
    </AbsoluteFill>
  );
};
