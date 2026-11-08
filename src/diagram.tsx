import React, { useEffect, useState } from "react";
import { AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, getInputProps, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, T, fw, UI } from "./theme";
import { Icon } from "./icons";
import { Mascot, Expr, Look, Char } from "./mascot";
import { Subtitle } from "./Subtitle";
import { EquationView, PlotView, StatView, TableView, eqDims, plotDims, statDims, tableDims, MathNode } from "./math";

// ---------- spec ----------
type Pt = { x: number; y: number };
export type NodeSpec = {
  id: string;
  type?: "icon" | "box" | "group" | "cells" | "pill" | "text" | "code" | "badge" | "mascot" | "equation" | "plot" | "stat" | "table";
  x: number; y: number; w?: number; h?: number;
  label?: string; sub?: string; icon?: string; color?: string; size?: number;
  lines?: string[]; rows?: number; cols?: number; fill?: number; hi?: number[];
  expr?: Expr; look?: Look; point?: "left" | "right" | "up" | "eureka"; side?: "left" | "right"; flip?: boolean; char?: Char;
  tile?: boolean; // img: icons only: light rounded tile behind dark/flat logos
  lw?: number;    // icon labels: max label width in px before wrapping (default 340)
} & MathNode;
export type EdgeSpec = {
  id: string; from: string; to: string; label?: string; color?: string;
  dashed?: boolean; route?: "straight" | "hv" | "vh"; bend?: number; arrow?: boolean; gap?: number;
};
export type Action = {
  show?: string[]; hide?: string[]; highlight?: string[]; flow?: string[]; clear?: boolean;
  camera?: { x?: number; y?: number; zoom?: number; focus?: string };
  set?: Record<string, Record<string, unknown>>;
};
export type BeatSpec = {
  text: string; do?: Action; audio: string; durationInFrames: number; sfx?: string | string[] | false;
};
type Props = { nodes: NodeSpec[]; edges?: EdgeSpec[]; beats: BeatSpec[]; subtitles?: boolean };

// ---------- geometry ----------
const hexLum = (hex: string) => {
  const n = parseInt(hex.replace("#", "").padEnd(6, "0").slice(0, 6), 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
};
const ink = (bg: string) => (hexLum(bg) > 0.6 ? "#14181b" : "#ffffff");

const dims = (n: NodeSpec): { w: number; h: number } => {
  switch (n.type ?? "icon") {
    case "box": return { w: n.w ?? 240, h: n.h ?? 92 };
    case "group": return { w: n.w ?? 400, h: n.h ?? 300 };
    case "cells": return { w: (n.cols ?? 8) * 40 - 8, h: (n.rows ?? 4) * 40 - 8 };
    case "pill": return { w: n.w ?? 260, h: n.h ?? 56 };
    case "badge": return { w: 60, h: 60 };
    case "equation": return eqDims(n);
    case "plot": return plotDims(n);
    case "stat": return statDims(n);
    case "table": return tableDims(n);
    case "mascot": { const sz = n.size ?? 150; return { w: sz, h: sz * 1.1 }; }
    case "code": {
      const fs = (n.size ?? 34) * UI;
      const L = n.lines ?? [];
      return { w: n.w ?? Math.max(...L.map((l) => l.length), 8) * fs * 0.62 + 80, h: L.length * fs * 1.7 + 50 };
    }
    case "text": {
      const fs = (n.size ?? 44) * UI * (T.fs ?? 1);
      return { w: n.w ?? (n.label?.length ?? 6) * fs * 0.55, h: fs * 1.3 };
    }
    default: { const s = (n.size ?? 150) * UI; return { w: s, h: s }; }
  }
};

const exitPoint = (c: Pt, dx: number, dy: number, hw: number, hh: number): Pt => {
  const tx = dx === 0 ? Infinity : hw / Math.abs(dx);
  const ty = dy === 0 ? Infinity : hh / Math.abs(dy);
  const k = Math.min(tx, ty);
  return { x: c.x + dx * k, y: c.y + dy * k };
};

const routeEdge = (a: NodeSpec, b: NodeSpec, e: EdgeSpec): Pt[] => {
  const da = dims(a), db = dims(b);
  const g = e.gap ?? 14;
  const ha = { w: da.w / 2 + g, h: da.h / 2 + g }, hb = { w: db.w / 2 + g, h: db.h / 2 + g };
  const A = { x: a.x, y: a.y }, B = { x: b.x, y: b.y };
  if (e.route === "hv") {
    return [
      { x: A.x + Math.sign(B.x - A.x) * ha.w, y: A.y }, { x: B.x, y: A.y },
      { x: B.x, y: B.y - Math.sign(B.y - A.y) * hb.h },
    ];
  }
  if (e.route === "vh") {
    return [
      { x: A.x, y: A.y + Math.sign(B.y - A.y) * ha.h }, { x: A.x, y: B.y },
      { x: B.x - Math.sign(B.x - A.x) * hb.w, y: B.y },
    ];
  }
  const dx = B.x - A.x, dy = B.y - A.y;
  const s = exitPoint(A, dx, dy, ha.w, ha.h), t = exitPoint(B, -dx, -dy, hb.w, hb.h);
  if (!e.bend) return [s, t];
  const mx = (s.x + t.x) / 2, my = (s.y + t.y) / 2;
  const len = Math.hypot(t.x - s.x, t.y - s.y) || 1;
  const cx = mx + (-(t.y - s.y) / len) * e.bend, cy = my + ((t.x - s.x) / len) * e.bend;
  const pts: Pt[] = [];
  for (let i = 0; i <= 24; i++) {
    const u = i / 24, v = 1 - u;
    pts.push({ x: v * v * s.x + 2 * v * u * cx + u * u * t.x, y: v * v * s.y + 2 * v * u * cy + u * u * t.y });
  }
  return pts;
};

const polyLen = (p: Pt[]) => p.slice(1).reduce((a, q, i) => a + Math.hypot(q.x - p[i].x, q.y - p[i].y), 0);
const polyAt = (p: Pt[], t: number): Pt => {
  let rest = t * polyLen(p);
  for (let i = 1; i < p.length; i++) {
    const seg = Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y);
    if (rest <= seg || i === p.length - 1) {
      const k = seg === 0 ? 0 : Math.min(1, rest / seg);
      return { x: p[i - 1].x + (p[i].x - p[i - 1].x) * k, y: p[i - 1].y + (p[i].y - p[i - 1].y) * k };
    }
    rest -= seg;
  }
  return p[p.length - 1];
};

// ---------- sound effects (auto from actions, or explicit beat.sfx) ----------
const sfxFor = (a: Action | undefined, explicit?: string | string[] | false): { name: string; at: number }[] => {
  if (explicit === false) return [];
  const out: { name: string; at: number }[] = [];
  if (explicit) (Array.isArray(explicit) ? explicit : [explicit]).forEach((n, i) => out.push({ name: n, at: 2 + i * 6 }));
  if (!a) return out;
  let t = 2;
  const add = (name: string) => { if (!out.some((o) => o.name === name)) { out.push({ name, at: t }); t += 6; } };
  if (!explicit) {
    if (a.clear || a.camera) add("whoosh");
    if (a.show && a.show.length) add("pop");
    if (a.highlight && a.highlight.length) add("tick");
    if (a.set) {
      const vals = Object.values(a.set);
      if (vals.some((v) => isRed(v.color))) add("buzz");
      else if (vals.some((v) => typeof v.color === "string")) add("ding");
      if (vals.some((v) => v.expr !== undefined)) add("boop");
    }
  }
  return out;
};

// ---------- timeline state ----------
// semantic colour names (theme-aware) -> actual colour; hex values pass through
const F = (n: number) => n * (T.fs ?? 1) * UI;
const pc = (c?: string): string | undefined => {
  if (!c) return c;
  const m: Record<string, string> = {
    primary: C.go, red: C.red, green: C.green, accent: C.accent, blue: C.blue, purple: C.purple,
    orange: C.orange, pink: C.pink, muted: C.muted, text: C.text,
  };
  return m[c] ?? c;
};
const isRed = (c?: unknown) => c === "red" || c === "#f0625f";
const withAlpha = (c: string, a: string) => (/^#[0-9a-fA-F]{6}$/.test(c) ? `${c}${a}` : c);
const shadowFor = (bg: string): string => {
  if (T.shadow === "hard") return `${T.shadowOff}px ${T.shadowOff}px 0 ${T.shadowColor}`;
  if (T.shadow === "soft") {
    return T.light ? "0 12px 32px rgba(30,40,80,0.16), 0 2px 6px rgba(30,40,80,0.08)"
      : "0 10px 26px rgba(0,0,0,0.38), 0 2px 6px rgba(0,0,0,0.25)";
  }
  if (T.shadow === "glow") return `0 0 22px ${withAlpha(bg, "66")}`;
  return "none";
};
const joinShadow = (...p: string[]) => p.filter((x) => x && x !== "none").join(", ") || "none";
const boxSurface = (color: string, hl: boolean): React.CSSProperties => {
  const ringS = hl ? `0 0 0 5px ${C.accent}, 0 0 30px ${withAlpha(C.accent, "88")}` : "";
  const sh = joinShadow(ringS, shadowFor(color));
  if (T.boxStyle === "dark") {
    return { background: C.panel, color, border: `${T.outlineW || 2}px solid ${color}`,
      borderRadius: T.radius, boxShadow: sh };
  }
  if (T.boxStyle === "glass") {
    return { background: `linear-gradient(135deg, ${withAlpha(color, "70")}, ${withAlpha(color, "26")})`, color: C.text,
      border: `${T.outlineW || 1.5}px solid rgba(255,255,255,0.38)`, borderRadius: T.radius,
      backdropFilter: "blur(10px)", boxShadow: sh };
  }
  if (T.boxStyle === "tint") {
    return { background: withAlpha(color, "26"), color: C.text,
      border: `${T.outlineW || 2}px solid ${T.outline !== "none" ? T.outline : color}`,
      borderRadius: T.radius, boxShadow: sh };
  }
  return { background: color, color: ink(color),
    border: T.outlineW ? `${T.outlineW}px solid ${T.outline}` : "none", borderRadius: T.radius, boxShadow: sh };
};

const useSprings = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = (since: number, damping = 200) =>
    since < 0 ? 0 : spring({ frame: frame - since, fps, config: { damping } });
  return { frame, s };
};

const useLintProbe = () => {
  const on = !!(getInputProps() as { lint?: boolean }).lint;
  const [handle] = useState(() => (on ? delayRender("lint-probe") : null));
  useEffect(() => {
    if (!on || handle === null) return;
    (async () => {
      try { await document.fonts.ready; } catch { /* ignore */ }
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const eff = (el: Element, root: Element) => {
        let o = 1; let e: Element | null = el;
        while (e && e !== root.parentElement) { o *= parseFloat(getComputedStyle(e).opacity || "1"); e = e.parentElement; }
        return o;
      };
      const res: unknown[] = [];
      document.querySelectorAll("[data-nid]").forEach((w) => {
        const rects: number[][] = [];
        const kind = (w as HTMLElement).dataset.type;
        const push = (r: DOMRect, what: string) => {
          if (r.width < 1 || r.height < 1) return;
          rects.push([Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom), what as unknown as number]);
        };
        const walk = (el: Element) => {
          Array.from(el.childNodes).forEach((c) => {
            if (c.nodeType === 3 && (c.textContent ?? "").trim()) {
              const par = c.parentElement as Element;
              if (eff(par, w) < 0.15) return;
              const rg = document.createRange(); rg.selectNodeContents(c);
              push(rg.getBoundingClientRect(), "t:" + (c.textContent ?? "").trim().slice(0, 28));
            } else if (c.nodeType === 1) {
              const e = c as Element;
              const tag = e.tagName.toLowerCase();
              if (eff(e, w) < 0.15) return;
              if (tag === "img" || tag === "canvas") push(e.getBoundingClientRect(), "i");
              else if (tag === "svg") { if (kind === "plot") push(e.getBoundingClientRect(), "plot"); }
              else if (tag === "circle" || tag === "path" || tag === "rect" || tag === "line" || tag === "polygon") { /* inside svg */ }
              else {
                const cs = getComputedStyle(e);
                const hasBox = cs.backgroundColor !== "rgba(0, 0, 0, 0)" || parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== "none";
                if (hasBox && kind !== "plot") push(e.getBoundingClientRect(), "b");
              }
              if (tag !== "svg") walk(e);
              else e.querySelectorAll("text").forEach((t) => { if (eff(t, w) >= 0.15) push(t.getBoundingClientRect(), "t:" + (t.textContent ?? "").slice(0, 28)); });
            }
          });
        };
        walk(w);
        res.push({ id: (w as HTMLElement).dataset.nid, type: kind, rects });
      });
      // eslint-disable-next-line no-console
      console.log("LINTJSON" + JSON.stringify(res));
      continueRender(handle);
    })();
  }, [on, handle]);
};

export const DiagramScene = ({ nodes, edges = [], beats, subtitles }: Props) => {
  const { frame, s } = useSprings();
  useLintProbe();

  // beat start frames
  const starts: number[] = [];
  beats.reduce((acc, b) => { starts.push(acc); return acc + b.durationInFrames; }, 0);
  let cur = 0;
  starts.forEach((st, i) => { if (frame >= st) cur = i; });

  // per-element visibility events, cumulative overrides, highlights, camera
  const events: Record<string, { at: number; on: boolean }[]> = {};
  const push = (id: string, at: number, on: boolean) => { (events[id] ??= []).push({ at, on }); };
  const overrides: Record<string, Record<string, unknown>> = {};
  let hl: string[] = [];
  let flow: string[] = [];
  const setAt: Record<string, number> = {};
  let camPrev = { x: 960, y: 540, zoom: 1 }, camNext = camPrev, camAt = -1000;
  const allIds = [...nodes.map((n) => n.id), ...edges.map((e) => e.id)];
  for (let i = 0; i <= cur; i++) {
    const a = beats[i].do;
    if (!a) { flow = []; continue; }
    if (a.clear) {
      allIds.forEach((id) => {
        if (nodes.find((n) => n.id === id)?.type === "mascot") return;
        if (events[id]?.slice(-1)[0]?.on) push(id, starts[i], false);
      });
    }
    a.hide?.forEach((id) => push(id, starts[i], false));
    a.show?.forEach((id) => push(id, starts[i], true));
    if (a.set) Object.entries(a.set).forEach(([id, o]) => { overrides[id] = { ...(overrides[id] ?? {}), ...o }; setAt[id] = starts[i]; });
    if (a.highlight) hl = a.highlight;
    flow = a.flow ?? [];
    if (a.camera) {
      const c = a.camera;
      const f = c.focus ? nodes.find((n) => n.id === c.focus) : undefined;
      camPrev = camNext;
      camNext = { x: f ? f.x : c.x ?? 960, y: f ? f.y : c.y ?? 540, zoom: c.zoom ?? (f ? 1.5 : 1) };
      camAt = starts[i];
    }
  }
  const vis = (id: string) => {
    const ev = events[id];
    if (!ev || !ev.length) return 0;
    const last = ev[ev.length - 1];
    const p = s(last.at);
    return last.on ? p : 1 - p;
  };

  const { fps } = useVideoConfig();
  const lastShow = (id: string) => {
    const ev = events[id];
    if (!ev || !ev.length) return -1;
    const l = ev[ev.length - 1];
    return l.on ? l.at : -1;
  };
  // bouncy entrance (overshoots) and age since the element was last shown
  const popOf = (id: string) => {
    const at = lastShow(id);
    return at < 0 ? 0 : spring({ frame: frame - at, fps, config: { damping: 10, stiffness: 170, mass: 0.7 } });
  };
  const ageOf = (id: string) => { const at = lastShow(id); return at < 0 ? 0 : Math.max(0, frame - at); };
  const extra = (id: string) => ({ pop: popOf(id), age: ageOf(id), kick: frame - (setAt[id] ?? -9999) });

  const byId: Record<string, NodeSpec> = {};
  nodes.forEach((n) => { byId[n.id] = { ...n, ...(overrides[n.id] as Partial<NodeSpec>) }; });

  const camS = camAt < 0 ? 1 : s(camAt, 200);
  const totalFrames = beats.reduce((a, b) => a + b.durationInFrames, 0) || 1;
  const cam = {
    x: camPrev.x + (camNext.x - camPrev.x) * camS,
    y: camPrev.y + (camNext.y - camPrev.y) * camS,
    // slow continuous drift so a held shot never feels frozen
    zoom: (camPrev.zoom + (camNext.zoom - camPrev.zoom) * camS) * (1 + 0.03 * (frame / totalFrames)),
  };

  const beatStart = starts[cur] ?? 0;
  const order = (t?: string) => (t === "group" ? 0 : 1);
  const nodeList = Object.values(byId).sort((a, b) => order(a.type) - order(b.type));

  return (
    <AbsoluteFill>
      {beats.map((b, i) => (
        <Sequence key={i} from={starts[i]} durationInFrames={b.durationInFrames}>
          <Audio src={staticFile(b.audio)} />
          {sfxFor(b.do, b.sfx).map((e, k) => (
            <Sequence key={k} from={e.at} durationInFrames={40}>
              <Audio src={staticFile(`sfx/${e.name}.wav`)} volume={0.32} />
            </Sequence>
          ))}
        </Sequence>
      ))}
      <div style={{
        position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: "0 0",
        filter: T.wobble ? "url(#wob)" : undefined,
        transform: `translate(${960 - cam.x * cam.zoom}px, ${540 - cam.y * cam.zoom}px) scale(${cam.zoom})`,
      }}>
        {/* groups first */}
        {nodeList.filter((n) => n.type === "group").map((n) => (
          <div key={n.id} data-nid={n.id} data-type={n.type} style={{ display: "contents" }}>
            <NodeView n={n} p={vis(n.id)} hl={hl.includes(n.id)} frame={frame} {...extra(n.id)} />
          </div>
        ))}
        {/* edges */}
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {edges.map((e) => {
            const a = byId[e.from], b = byId[e.to];
            const o = { ...e, ...(overrides[e.id] as Partial<EdgeSpec>) };
            const p = vis(e.id);
            if (!a || !b || p <= 0.001) return null;
            const pts = routeEdge(a, b, o);
            const d = pts.map((q, i) => `${i ? "L" : "M"}${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(" ");
            const L = polyLen(pts);
            const col = pc(o.color) ?? T.edgeColor;
            const last = pts[pts.length - 1], prev = pts[Math.max(0, pts.length - 2)];
            const ang = Math.atan2(last.y - prev.y, last.x - prev.x);
            const hd = T.arrow;
            const tri = [[0, 0], [-hd, -hd * 0.55], [-hd, hd * 0.55]]
              .map(([px, py]) => `${(last.x + px * Math.cos(ang) - py * Math.sin(ang)).toFixed(1)},${(last.y + px * Math.sin(ang) + py * Math.cos(ang)).toFixed(1)}`)
              .join(" ");
            const mid = polyAt(pts, 0.5);
            const mask = `m_${e.id}`;
            const flowing = flow.includes(e.id);
            return (
              <g key={e.id} opacity={Math.min(1, p * 2)}
                style={T.edgeGlow ? { filter: `drop-shadow(0 0 6px ${col})` } : undefined}>
                <defs>
                  <mask id={mask} maskUnits="userSpaceOnUse" x={0} y={0} width={1920} height={1080}>
                    <path d={d} fill="none" stroke="#fff" strokeWidth={14} strokeDasharray={L}
                      strokeDashoffset={L * (1 - Math.min(1, p))} />
                  </mask>
                </defs>
                <path d={d} fill="none" stroke={col} strokeWidth={T.edgeW} strokeLinejoin="round" strokeLinecap="round"
                  strokeDasharray={o.dashed === true ? "11 9" : o.dashed === false ? undefined : T.edgeDash}
                  mask={`url(#${mask})`} />
                {o.arrow !== false && p > 0.85 && <polygon points={tri} fill={col} />}
                {o.label && p > 0.6 && (
                  <g>
                    <rect x={mid.x - o.label.length * 8 - 10} y={mid.y - 19} rx={10}
                      width={o.label.length * 16 + 20} height={38} fill={C.bg} />
                    <text x={mid.x} y={mid.y + 8} textAnchor="middle" fill={col} fontSize={F(26)}
                      fontWeight={fw(600)}>{o.label}</text>
                  </g>
                )}
                {flowing && [0, 1, 2].map((k) => {
                  const t = ((frame - beatStart) / 50 + k / 3) % 1;
                  const q = polyAt(pts, t);
                  return <circle key={k} cx={q.x} cy={q.y} r={T.edgeW + 5} fill={col === T.edgeColor ? C.go : col}
                    opacity={Math.sin(Math.PI * t) * 0.95 + 0.05} />;
                })}
              </g>
            );
          })}
        </svg>
        {nodeList.filter((n) => n.type !== "group" && n.type !== "mascot").map((n) => (
          <div key={n.id} data-nid={n.id} data-type={n.type} style={{ display: "contents" }}>
            <NodeView n={n} p={vis(n.id)} hl={hl.includes(n.id)} frame={frame} {...extra(n.id)} />
          </div>
        ))}
      </div>
      {/* presenter layer: fixed on screen, unaffected by camera pan/zoom */}
      {nodeList.filter((n) => n.type === "mascot").map((n) => (
        <div key={n.id} data-nid={n.id} data-type="mascot" style={{ display: "contents" }}>
          <NodeView n={n} p={vis(n.id)} hl={false} frame={frame} {...extra(n.id)} />
        </div>
      ))}
      {subtitles && beats[cur] && <Subtitle text={beats[cur].text} />}
    </AbsoluteFill>
  );
};

// ---------- node renderer ----------
const NodeView = ({ n, p, hl, frame, pop, age = 99, kick = 999 }: {
  n: NodeSpec; p: number; hl: boolean; frame: number; pop?: number; age?: number; kick?: number;
}) => {
  if (p <= 0.001) return null;
  const type = n.type ?? "icon";
  const { w, h } = dims(n);
  const base: React.CSSProperties = {
    position: "absolute", left: n.x - w / 2, top: n.y - h / 2, width: w, height: h,
    opacity: Math.min(1, p * 1.6),
    transform: (() => {
      const bouncy = pop !== undefined && type !== "group" && type !== "cells" && type !== "mascot";
      const sc = bouncy ? 0.5 + 0.5 * pop! : 0.88 + 0.12 * p;
      const float = type === "icon" || type === "box" ? Math.sin(frame / 20 + n.x * 0.013) * 3 : 0;
      return `translateY(${float}px) scale(${sc})`;
    })(),
  };
  const pulse = hl ? 1 + 0.025 * Math.sin(frame / 5) : 1;
  const col = pc(n.color);

  if (type === "icon") {
    const back = T.iconBackdrop === "circle";
    const inner = back ? w * 0.6 : w;
    const ringD = w * 1.24;
    return (
      <div style={{ ...base, transform: `${base.transform} scale(${pulse})` }}>
        {back && (
          <div style={{
            position: "absolute", left: w / 2 - ringD / 2, top: h / 2 - ringD / 2, width: ringD, height: ringD,
            borderRadius: "50%", background: T.iconBackdropFill,
            border: T.outlineW ? `${T.outlineW}px solid ${T.outline}` : "none",
            boxShadow: joinShadow(hl ? `0 0 0 5px ${C.accent}` : "", shadowFor(C.go)),
          }} />
        )}
        <div style={{ position: "absolute", left: (w - inner) / 2, top: (h - inner) / 2,
          ...(hl && !back ? { filter: `drop-shadow(0 0 12px ${C.accent})` } : {}) }}>
          {n.icon?.startsWith("img:") ? (
            // original-colour artwork from assets/library (staged to public/lib), never recoloured
            n.tile ? (
              <div style={{ width: inner, height: inner, borderRadius: inner * 0.22, background: "#f4f4f2",
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Img src={staticFile(`lib/${n.icon.slice(4)}.svg`)} style={{ width: inner * 0.7, height: inner * 0.7,
                  objectFit: "contain" }} />
              </div>
            ) : (
              <Img src={staticFile(`lib/${n.icon.slice(4)}.svg`)} style={{ width: inner, height: inner,
                objectFit: "contain" }} />
            )
          ) : (
            <Icon name={n.icon ?? "server"} size={inner} color={hl && !back ? T.hlInk : col} />
          )}
        </div>
        {n.label && (
          <div style={{ position: "absolute", top: h + (back ? 24 : 8), left: "50%", transform: "translateX(-50%)",
            width: "max-content", maxWidth: n.lw ?? 340, textAlign: "center", lineHeight: 1.2,
            fontSize: F(36), fontWeight: fw(600), color: hl ? T.hlInk : C.text }}>{n.label}
            {n.sub && <div style={{ fontSize: F(24), color: C.muted, fontWeight: fw(400) }}>{n.sub}</div>}
          </div>
        )}
      </div>
    );
  }
  if (type === "box") {
    const bg = col ?? C.go;
    return (
      <div style={{ ...base, ...boxSurface(bg, hl), display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", fontSize: F(n.size ?? 40), fontWeight: fw(700) }}>
        {T.bracket ? `[ ${n.label} ]` : n.label}
        {n.sub && <div style={{ fontSize: F(24), fontWeight: fw(400), opacity: 0.85 }}>{n.sub}</div>}
      </div>
    );
  }
  if (type === "group") {
    return (
      <div style={{ ...base, borderRadius: T.radius + 8, border: `3px ${T.groupDash} ${T.groupColor}`,
        background: T.groupFill, ...(hl ? { boxShadow: `0 0 0 5px ${C.accent}` } : {}) }}>
        {n.label && <div style={{ position: "absolute", left: 22, top: 14, fontSize: F(28), fontWeight: fw(600),
          color: C.muted }}>{n.label}</div>}
      </div>
    );
  }
  if (type === "pill") {
    const bg = col ?? C.go;
    return (
      <div style={{ ...base, ...boxSurface(bg, hl), borderRadius: h, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: F(n.size ?? 28), fontWeight: fw(600) }}>
        {n.label}
      </div>
    );
  }
  if (type === "equation") {
    return (
      <div style={{ ...base, transform: `${base.transform} scale(${pulse})` }}>
        <EquationView n={n} color={col ?? C.text} hl={hl} />
      </div>
    );
  }
  if (type === "stat") {
    return (
      <div style={{ ...base, transform: `${base.transform} scale(${pulse})` }}>
        <StatView n={n} color={col ?? C.accent} age={age} kick={kick} />
      </div>
    );
  }
  if (type === "table") {
    return (
      <div style={{ ...base, ...(hl ? { filter: `drop-shadow(0 0 14px ${C.accent})` } : {}) }}>
        <TableView n={n} color={col ?? C.go} kick={kick} />
      </div>
    );
  }
  if (type === "plot") {
    return (
      <div style={{ ...base, opacity: Math.min(1, p * 1.6) }}>
        <PlotView n={n} w={w} h={h} kick={kick} />
      </div>
    );
  }
  if (type === "badge") {
    const bg = col ?? C.accent;
    return (
      <div style={{ ...base, ...boxSurface(bg, hl), borderRadius: 30, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: F(34), fontWeight: fw(800) }}>{n.label}</div>
    );
  }
  if (type === "text") {
    return (
      <div style={{ ...base, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: F(n.size ?? 44), fontWeight: fw(700), color: col ?? C.text, whiteSpace: "nowrap",
        ...(T.edgeGlow ? { textShadow: `0 0 14px ${withAlpha(col ?? C.text, "88")}` } : {}) }}>
        {n.label}
      </div>
    );
  }
  if (type === "mascot") {
    const sz = n.size ?? 150;
    const bubbleW = (n.label?.length ?? 0) * F(19) + 44;
    const left = n.side === "left";
    return (
      <div style={{ ...base, transform: `${base.transform}${n.flip ? " scaleX(-1)" : ""} scale(${kick >= 0 && kick < 45 ? 1 + 0.22 * Math.exp(-kick / 7) * Math.cos(kick / 2.4) : 1})` }}>
        <Mascot char={n.char} expr={n.expr} look={n.look} point={n.point} size={sz} frame={frame} />
        {n.label && (
          <div style={{
            position: "absolute", top: -6, [left ? "right" : "left"]: sz * 0.98, width: bubbleW,
            padding: "12px 18px", borderRadius: T.radius + 6, background: T.bubbleBg, color: T.bubbleInk,
            border: T.bubbleBorder, boxShadow: shadowFor(C.go),
            fontSize: F(30), fontWeight: fw(600), textAlign: "center", whiteSpace: "nowrap",
          }}>
            {n.label}
          </div>
        )}
      </div>
    );
  }
  if (type === "code") {
    const fs = (n.size ?? 34) * UI;
    const render = (line: string) => line.split(/("[^"]*"|[A-Za-z_]+)/g).map((part, i) =>
      part === "go" || part === "chan" ? <span key={i} style={{ color: T.kw1, fontWeight: fw(700) }}>{part}</span>
        : part === "func" || part === "return" ? <span key={i} style={{ color: T.kw2, fontWeight: fw(700) }}>{part}</span>
        : part.startsWith('"') ? <span key={i} style={{ color: T.str }}>{part}</span>
        : <span key={i}>{part}</span>);
    return (
      <div style={{ ...base, borderRadius: T.radius, background: T.codeBg,
        border: `${T.outlineW || 2}px solid ${T.codeBorder}`, padding: "25px 40px", fontFamily: T.mono,
        fontSize: fs, lineHeight: 1.7, color: T.codeText,
        boxShadow: joinShadow(hl ? `0 0 0 5px ${C.accent}, 0 0 30px ${withAlpha(C.accent, "88")}` : "", shadowFor(C.go)) }}>
        {(n.lines ?? []).map((l, i) => {
          const a = Math.min(1, Math.max(0, (age - i * 5) / 8));
          return <div key={i} style={{ whiteSpace: "pre", opacity: a, transform: `translateX(${(1 - a) * 18}px)` }}>{render(l)}</div>;
        })}
      </div>
    );
  }
  // cells
  const rows = n.rows ?? 4, cols = n.cols ?? 8, total = rows * cols;
  const shown = Math.round(total * Math.min(1, p));
  const filled = n.fill ?? total;
  return (
    <div style={{ ...base, opacity: 1, transform: "none" }}>
      {Array.from({ length: total }).map((_, i) => {
        const r = Math.floor(i / cols), c = i % cols;
        const base0 = col ?? T.cells[r % T.cells.length];
        const on = i < filled;
        const isHi = n.hi?.includes(i);
        return (
          <div key={i} style={{ position: "absolute", left: c * 40, top: r * 40, width: 32, height: 32,
            borderRadius: T.cellRadius, opacity: i < shown ? 1 : 0,
            border: T.outlineW ? `${Math.min(3, T.outlineW)}px solid ${T.outline !== "none" ? T.outline : "transparent"}` : "none",
            boxSizing: "border-box",
            background: isHi ? C.accent : on ? base0 : T.cellEmpty,
            boxShadow: isHi ? `0 0 14px ${C.accent}` : T.edgeGlow && on ? `0 0 8px ${withAlpha(base0, "88")}` : "none" }} />
        );
      })}
      {n.label && <div style={{ position: "absolute", top: h + 14, left: -60, width: w + 120, textAlign: "center",
        fontSize: F(30), fontWeight: fw(600), color: C.text }}>{n.label}</div>}
    </div>
  );
};
