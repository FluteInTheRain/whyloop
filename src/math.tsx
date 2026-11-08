import React from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { C, T, fw, UI } from "./theme";

// Math nodes for the diagram scene: `equation` (KaTeX) and `plot` (SVG chart).
// Colours arrive already resolved (hex); series colours cycle through the theme palette.

export type Series = {
  type: "points" | "line" | "fn" | "bars" | "segments";
  barw?: number;              // bars: bar width as a fraction of the plot width (default 0.6 / number of bars)
  data?: number[][];          // points/line/bars: [x,y]; segments: [x1,y1,x2,y2]
  fn?: string;                // fn: expression in x, e.g. "2*x+1", "x^2", "sin(x)"
  color?: string; label?: string; dashed?: boolean; width?: number; r?: number;
};
export type MathNode = {
  tex?: string; size?: number; w?: number; h?: number;
  xrange?: [number, number]; yrange?: [number, number]; series?: Series[]; step?: number;
  xlabel?: string; ylabel?: string; axes?: boolean; grid?: boolean;
  center?: boolean;           // plot: shift the figure so the axes box (not the label gutter) is centred on the node's x
  // stat: big animated number
  value?: number; decimals?: number; prefix?: string; suffix?: string; from?: number; label?: string; group?: boolean;
  locale?: string;
  // table: rows of strings; first row is the header unless header === false; step = data rows shown
  rows?: string[][]; header?: boolean; colw?: number; colws?: number[]; rowh?: number; fs?: number; hi?: number[];
  xticks?: number[]; yticks?: number[];
};

export const eqDims = (n: MathNode) => {
  const fs = (n.size ?? 56) * UI;
  const tex = n.tex ?? "";
  const rows = tex.split("\\\\").length;
  const plain = tex.replace(/\\[a-zA-Z]+/g, "x").replace(/[{}^_ ]/g, "");
  return { w: n.w ?? Math.max(160, plain.length * fs * 0.52 + 40), h: n.h ?? fs * 1.7 * rows };
};
const fmtNum = (v: number, d: number, group = true, locale = "vi-VN") =>
  v.toLocaleString(locale, { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: group });
export const statDims = (n: MathNode) => {
  const size = (n.size ?? 96) * UI;
  const len = `${n.prefix ?? ""}${fmtNum(n.value ?? 0, n.decimals ?? 0, n.group, n.locale)}${n.suffix ?? ""}`.length;
  return { w: n.w ?? Math.max(220, len * size * 0.62 + 40), h: n.h ?? size * 1.25 + (n.label ? size * 0.62 : 0) };
};
export const tableDims = (n: MathNode) => {
  const rows = n.rows ?? [];
  const cols = Math.max(1, ...rows.map((r) => r.length));
  const w = n.colws ? n.colws.reduce((a, b) => a + b, 0) : cols * (n.colw ?? 170);
  return { w: n.w ?? w, h: n.h ?? rows.length * ((n.rowh ?? 58) * UI) };
};
export const plotDims = (n: MathNode) => ({ w: n.w ?? 760, h: n.h ?? 520 });

export const EquationView = ({ n, color, hl }: { n: MathNode; color: string; hl: boolean }) => {
  const html = katex.renderToString(n.tex ?? "", { throwOnError: false, displayMode: true, output: "html" });
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
      color, fontSize: (n.size ?? 56) * UI, fontWeight: fw(500), whiteSpace: "nowrap",
      ...(hl ? { filter: `drop-shadow(0 0 14px ${C.accent})` } : {}) }}>
      <div className="eq" dangerouslySetInnerHTML={{ __html: html }} style={{ margin: 0 }} />
      <style>{`.eq .katex-display{margin:0}.eq .katex{font-size:1em}`}</style>
    </div>
  );
};

// draw order: curves first, so residual segments and points stay visible on top
const ZORDER: Record<Series["type"], number> = { bars: 0, fn: 1, line: 1, segments: 2, points: 3 };

// semantic colour names (same vocabulary as diagram nodes) -> theme colours
const semantic = (c?: string): string | undefined => {
  if (!c) return c;
  const m: Record<string, string> = {
    primary: C.go, red: C.red, green: C.green, accent: C.accent, blue: C.blue, purple: C.purple,
    orange: C.orange, pink: C.pink, muted: C.muted, text: C.text,
  };
  return m[c] ?? c;
};

const niceStep = (span: number) => {
  const raw = span / 5, mag = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / mag;
  return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * mag;
};
const ticks = (a: number, b: number) => {
  const st = niceStep(b - a), out: number[] = [];
  for (let v = Math.ceil(a / st) * st; v <= b + 1e-9; v += st) out.push(Math.round(v / st) * st);
  return out;
};
const fmt = (v: number) => (Math.abs(v) >= 1000 ? `${v / 1000}k` : `${+v.toFixed(2)}`);
const compile = (expr: string): ((x: number) => number) => {
  try {
    // eslint-disable-next-line no-new-func
    return new Function("x", `with(Math){return (${expr.replace(/\^/g, "**")});}`) as (x: number) => number;
  } catch { return () => NaN; }
};

export const PlotView = ({ n, w, h, kick }: { n: MathNode; w: number; h: number; kick: number }) => {
  const [x0, x1] = n.xrange ?? [0, 10], [y0, y1] = n.yrange ?? [0, 10];
  const yt = n.yticks ?? ticks(y0, y1);
  const tickFs = Math.round(26 * UI), labFs = Math.round(32 * UI);
  const tickW = Math.max(...yt.map((v) => fmt(v).length)) * tickFs * 0.62;
  const L = Math.round(tickW + 24 + (n.ylabel ? labFs * 1.5 : 0)), B = Math.round((n.xlabel ? 90 : 60) * UI), R = 30;
  const pw = w - L - R;
  const series = n.series ?? [];
  // legend: laid out in rows above the plot area so it can never sit on the data
  const legend: { i: number; x: number; y: number; label: string }[] = [];
  let lx = 0, ly = 0;
  series.forEach((sr, i) => {
    if (!sr.label) return;
    const wi = 44 + sr.label.length * Math.round(30 * UI) * 0.54 + 26;
    if (lx > 0 && lx + wi > pw) { lx = 0; ly += Math.round(30 * UI * 1.35); }
    legend.push({ i, x: lx, y: ly, label: sr.label });
    lx += wi;
  });
  const Tp = 16 + (legend.length ? ly + Math.round(30 * UI * 1.4) : 0);
  const ph = h - B - Tp;
  const sx = (x: number) => L + ((x - x0) / (x1 - x0)) * pw;
  const sy = (y: number) => Tp + ph - ((y - y0) / (y1 - y0)) * ph;
  const palette = [C.go, C.accent, C.green, C.red, C.purple, C.orange];
  const showAxes = n.axes !== false;
  const xt = n.xticks ?? ticks(x0, x1);
  const prog = (i: number) => {
    if (n.step === undefined) return 1;
    if (i < n.step - 1) return 1;
    if (i === n.step - 1) return Math.min(1, Math.max(0, kick / 26));
    return 0;
  };
  const clipId = `clip-${Math.round(w)}-${Math.round(h)}-${series.length}`;
  return (
    <svg width={w} height={h} style={{ overflow: "visible", ...(n.center ? { transform: `translateX(${-Math.round((L - R) / 2)}px)` } : {}) }}>
      <defs><clipPath id={clipId}><rect x={L} y={Tp} width={pw} height={ph} /></clipPath></defs>
      {n.grid !== false && [...xt.map((v) => <line key={`gx${v}`} x1={sx(v)} x2={sx(v)} y1={Tp} y2={Tp + ph}
        stroke={C.text} strokeOpacity={0.08} strokeWidth={1.5} />),
        ...yt.map((v) => <line key={`gy${v}`} x1={L} x2={L + pw} y1={sy(v)} y2={sy(v)}
          stroke={C.text} strokeOpacity={0.08} strokeWidth={1.5} />)]}
      {showAxes && (
        <g stroke={C.muted} strokeWidth={3} strokeLinecap="round">
          <line x1={L} x2={L + pw} y1={Tp + ph} y2={Tp + ph} />
          <line x1={L} x2={L} y1={Tp} y2={Tp + ph} />
        </g>
      )}
      {showAxes && xt.map((v) => (
        <text key={`tx${v}`} x={sx(v)} y={Tp + ph + tickFs + 6} textAnchor="middle" fontSize={tickFs} fill={C.muted}
          fontFamily={T.mono}>{fmt(v)}</text>
      ))}
      {showAxes && yt.map((v) => (
        <text key={`ty${v}`} x={L - 12} y={sy(v) + 11} textAnchor="end" fontSize={tickFs} fill={C.muted}
          fontFamily={T.mono}>{fmt(v)}</text>
      ))}
      {n.xlabel && <text x={L + pw / 2} y={h - 10} textAnchor="middle" fontSize={labFs} fontWeight={fw(600)}
        fill={C.text}>{n.xlabel}</text>}
      {n.ylabel && <text transform={`translate(${Math.round(labFs * 0.8)} ${Tp + ph / 2}) rotate(-90)`} textAnchor="middle" fontSize={labFs}
        fontWeight={fw(600)} fill={C.text}>{n.ylabel}</text>}
      <g clipPath={`url(#${clipId})`}>
        {series.map((s, i) => ({ s, i })).sort((a, b) => ZORDER[a.s.type] - ZORDER[b.s.type]).map(({ s, i }) => {
          const p = prog(i);
          if (p <= 0) return null;
          const col = semantic(s.color) ?? palette[i % palette.length];
          const sw = (s.width ?? 4) * 1.4;
          const dash = s.dashed ? "16 12" : undefined;
          if (s.type === "points") {
            const d = s.data ?? [];
            return <g key={i}>{d.map(([x, y], k) => {
              const a = Math.min(1, Math.max(0, p * (d.length + 1) - k));
              return <circle key={k} cx={sx(x)} cy={sy(y)} r={(s.r ?? 8) * UI * (0.4 + 0.6 * a)} fill={col} opacity={a}
                stroke={C.bg} strokeWidth={1.5} />;
            })}</g>;
          }
          if (s.type === "bars") {
            const d = s.data ?? [], bw = (s.barw ?? 0.6 / Math.max(d.length, 1)) * pw;
            return <g key={i}>{d.map(([x, y], k) => (
              <rect key={k} x={sx(x) - bw / 2} width={bw} y={sy(y * p)} height={Math.max(0, sy(y0) - sy(y * p))}
                rx={8} fill={col} />
            ))}</g>;
          }
          if (s.type === "segments") {
            return <g key={i}>{(s.data ?? []).map(([ax, ay, bx, by], k) => (
              <line key={k} x1={sx(ax)} y1={sy(ay)} x2={sx(ax + (bx - ax) * p)} y2={sy(ay + (by - ay) * p)}
                stroke={col} strokeWidth={Math.max(2, sw - 2)} strokeDasharray={dash ?? "8 7"} strokeLinecap="round" />
            ))}</g>;
          }
          const pts: [number, number][] = s.type === "fn"
            ? (() => { const f = compile(s.fn ?? "x"); const o: [number, number][] = [];
                for (let k = 0; k <= 160; k++) { const x = x0 + ((x1 - x0) * k) / 160; const y = f(x);
                  if (Number.isFinite(y)) o.push([x, y]); } return o; })()
            : (s.data ?? []).map(([x, y]) => [x, y]);
          const path = pts.map(([x, y], k) => `${k ? "L" : "M"}${sx(x).toFixed(1)} ${sy(y).toFixed(1)}`).join("");
          return <path key={i} d={path} fill="none" stroke={col} strokeWidth={sw} strokeLinecap="round"
            strokeLinejoin="round" pathLength={1} strokeDasharray={p < 1 ? `${p} 1` : dash}
            strokeDashoffset={0} />;
        })}
      </g>
      {legend.map((lg) => (prog(lg.i) > 0.3 ? (
        <g key={`lg${lg.i}`} transform={`translate(${L + lg.x} ${12 + lg.y})`}>
          <rect x={0} y={-4} width={30} height={9} rx={4.5} fill={semantic(series[lg.i].color) ?? palette[lg.i % palette.length]} />
          <text x={42} y={6} fontSize={Math.round(30 * UI)} fill={C.text} fontWeight={fw(500)}>{lg.label}</text>
        </g>
      ) : null))}
    </svg>
  );
};

// number that counts up from `from` (default 0) to `value` when shown, or when `value` is changed by a beat's `set`
export const StatView = ({ n, color, age, kick }: { n: MathNode; color: string; age: number; kick: number }) => {
  const size = (n.size ?? 96) * UI, d = n.decimals ?? 0, to = n.value ?? 0, from = n.from ?? 0;
  const t = kick < 9000 && n.from !== undefined ? kick / 30 : age / 36;
  const e = 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", color }}>
      <div style={{ fontSize: size, fontWeight: fw(800), lineHeight: 1.15, whiteSpace: "nowrap",
        fontVariantNumeric: "tabular-nums" }}>
        {n.prefix}{fmtNum(from + (to - from) * e, d, n.group, n.locale)}{n.suffix}
      </div>
      {n.label && <div style={{ fontSize: size * 0.34, fontWeight: fw(500), color: C.muted, marginTop: 12, lineHeight: 1.2,
        whiteSpace: "nowrap" }}>{n.label}</div>}
    </div>
  );
};

export const TableView = ({ n, color, kick }: { n: MathNode; color: string; kick: number }) => {
  const rows = n.rows ?? [];
  const head = n.header !== false;
  const { w } = tableDims(n);
  const cols = Math.max(1, ...rows.map((r) => r.length));
  const base = n.colws ?? Array(cols).fill(n.colw ?? 170);
  const sum = base.reduce((x: number, y: number) => x + y, 0);
  const cws = base.map((c: number) => (c * w) / sum);
  const rh = (n.rowh ?? 58) * UI, fs = (n.fs ?? 30) * UI;
  const visData = n.step === undefined ? rows.length : n.step + (head ? 1 : 0);
  const boxH = Math.max(1, Math.min(rows.length, visData)) * rh;
  return (
    <div style={{ position: "relative", width: w, height: boxH, borderRadius: 16, overflow: "hidden",
      border: `3px solid ${color}`, background: "rgba(255,255,255,0.04)", boxSizing: "border-box" }}>
      {rows.map((r, i) => {
        const isHead = head && i === 0;
        const shown = i < visData;
        const last = i === visData - 1 && n.step !== undefined;
        const a = shown ? (last ? Math.min(1, kick / 14) : 1) : 0;
        const hi = n.hi?.includes(i);
        return (
          <div key={i} style={{ position: "absolute", left: 0, top: i * rh, width: w, height: rh, display: "flex",
            alignItems: "center", opacity: a, transform: `translateY(${(1 - a) * 10}px)`,
            background: isHead ? `${color}33` : hi ? `${C.accent}33` : i % 2 ? "rgba(255,255,255,0.03)" : "transparent",
            borderTop: i ? `1px solid rgba(255,255,255,0.1)` : "none" }}>
            {r.map((cell, j) => {
              const fit = Math.max(18, Math.min(fs, (cws[j] - 28) / (Math.max(1, cell.length) * 0.62)));
              return (
                <div key={j} style={{ width: cws[j], textAlign: "center", fontSize: fit, whiteSpace: "nowrap",
                  fontWeight: isHead ? fw(700) : fw(500), color: isHead ? color : hi ? C.accent : C.text,
                  fontFamily: isHead ? undefined : T.mono }}>{cell}</div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
