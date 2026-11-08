import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, MONO, fw } from "./theme";
import { DiagramScene } from "./diagram";
import { Mascot } from "./mascot";
import { Icon } from "./icons";

// ---------- helpers ----------
const useIn = (delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 200 } });
};

const Center: React.FC<{ children: React.ReactNode; top?: number }> = ({ children, top = 0 }) => (
  <AbsoluteFill style={{
    justifyContent: "center", alignItems: "center", paddingBottom: 120, paddingTop: top,
  }}>
    {children}
  </AbsoluteFill>
);

const Heading = ({ text }: { text?: string }) => {
  const a = useIn(0);
  if (!text) return null;
  return (
    <div style={{
      position: "absolute", top: 70, left: 0, right: 0, textAlign: "center", fontSize: 64,
      fontWeight: fw(800), color: C.go, opacity: a, transform: `translateY(${(1 - a) * 30}px)`,
    }}>
      {text}
    </div>
  );
};

// ---------- title / outro ----------
const Title = ({ heading, sub }: { heading: string; sub?: string }) => {
  const a = useIn(0);
  const b = useIn(10);
  const size = heading.length > 18 ? 120 : 170;
  return (
    <Center>
      <div style={{ textAlign: "center", maxWidth: 1700 }}>
        <div style={{
          fontSize: size, fontWeight: fw(800), color: C.go, letterSpacing: -3, lineHeight: 1.1,
          opacity: a, transform: `translateY(${(1 - a) * 60}px)`,
        }}>
          {heading}
        </div>
        {sub && (
          <div style={{
            fontSize: 56, color: C.muted, marginTop: 24,
            opacity: b, transform: `translateY(${(1 - b) * 40}px)`,
          }}>
            {sub}
          </div>
        )}
      </div>
    </Center>
  );
};

// ---------- bullets ----------
const Bullets = ({ heading, items, numbered }: {
  heading?: string; items: string[]; numbered?: boolean;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <Heading text={heading} />
      <Center top={heading ? 60 : 0}>
        <div style={{ width: 1500 }}>
          {items.map((it, i) => {
            const p = spring({ frame: frame - (14 + i * 22), fps, config: { damping: 200 } });
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 28, marginBottom: 34,
                opacity: p, transform: `translateX(${(1 - p) * 60}px)`,
              }}>
                <div style={{
                  flex: "0 0 auto", width: 64, height: 64, borderRadius: 32, background: C.go,
                  color: C.bg, fontSize: 36, fontWeight: fw(800), display: "flex",
                  alignItems: "center", justifyContent: "center",
                }}>
                  {numbered ? i + 1 : "•"}
                </div>
                <div style={{ fontSize: 50, lineHeight: 1.25 }}>{it}</div>
              </div>
            );
          })}
        </div>
      </Center>
    </>
  );
};

// ---------- compare: two bars ----------
type BarSpec = { label: string; value: string; ratio?: number };
const Bar = ({ label, value, ratio, color, delay }: BarSpec & { color: string; delay: number }) => {
  const p = useIn(delay);
  const W = 1300;
  return (
    <div style={{ marginBottom: 70 }}>
      <div style={{ fontSize: 46, marginBottom: 16, color: C.text, opacity: p }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        <div style={{
          width: Math.max(14, W * (ratio ?? 1) * p), height: 64, borderRadius: 12, background: color,
        }} />
        <div style={{ fontSize: 52, fontWeight: fw(700), color, opacity: p }}>{value}</div>
      </div>
    </div>
  );
};

const Compare = ({ top, bottom }: { top: BarSpec; bottom: BarSpec }) => (
  <Center>
    <div>
      <Bar {...top} ratio={top.ratio ?? 1} color={C.red} delay={4} />
      <Bar {...bottom} ratio={bottom.ratio ?? 0.004} color={C.go} delay={34} />
    </div>
  </Center>
);

// ---------- versus: two columns ----------
type Side = { title: string; points: string[] };
const Column = ({ side, color, delay }: { side: Side; color: string; delay: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = useIn(delay);
  return (
    <div style={{
      width: 800, background: C.panel, borderRadius: 28, padding: "40px 48px",
      borderTop: `8px solid ${color}`, opacity: p, transform: `translateY(${(1 - p) * 40}px)`,
    }}>
      <div style={{ fontSize: 56, fontWeight: fw(800), color, marginBottom: 28 }}>{side.title}</div>
      {side.points.map((pt, i) => {
        const q = spring({ frame: frame - (delay + 20 + i * 18), fps, config: { damping: 200 } });
        return (
          <div key={i} style={{
            fontSize: 42, lineHeight: 1.3, marginBottom: 20, opacity: q,
            transform: `translateX(${(1 - q) * 30}px)`,
          }}>
            <span style={{ color }}>▸ </span>{pt}
          </div>
        );
      })}
    </div>
  );
};

const Versus = ({ left, right }: { left: Side; right: Side }) => (
  <Center>
    <div style={{ display: "flex", gap: 60, alignItems: "flex-start" }}>
      <Column side={left} color={C.go} delay={0} />
      <Column side={right} color={C.accent} delay={16} />
    </div>
  </Center>
);

// ---------- flow: node -> node -> node ----------
const Flow = ({ nodes, caption }: { nodes: string[]; caption?: string }) => {
  const frame = useCurrentFrame();
  const n = nodes.length;
  const boxW = Math.min(320, Math.floor((1700 - (n - 1) * 90) / n));
  const fs = n > 4 ? 32 : 40;
  return (
    <Center>
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
          {nodes.map((label, i) => {
            const at = 10 + i * 22;
            const on = interpolate(frame, [at, at + 10], [0, 1], {
              extrapolateLeft: "clamp", extrapolateRight: "clamp",
            });
            return (
              <React.Fragment key={i}>
                <div style={{
                  width: boxW, minHeight: 150, borderRadius: 22, padding: 16, textAlign: "center",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: fs,
                  fontWeight: fw(700), lineHeight: 1.2,
                  background: on > 0.5 ? "rgba(0,173,216,0.18)" : C.panel,
                  border: `4px solid ${on > 0.5 ? C.go : "#27344f"}`,
                  opacity: 0.35 + 0.65 * on, transform: `scale(${0.94 + 0.06 * on})`,
                }}>
                  {label}
                </div>
                {i < n - 1 && (
                  <div style={{
                    fontSize: 54, color: on > 0.5 ? C.accent : "#27344f", fontWeight: fw(800),
                  }}>→</div>
                )}
              </React.Fragment>
            );
          })}
        </div>
        {caption && (
          <div style={{ marginTop: 60, textAlign: "center", fontSize: 40, color: C.muted }}>
            {caption}
          </div>
        )}
      </div>
    </Center>
  );
};

// ---------- fanout: many items -> middle -> few workers ----------
const Fanout = ({ left = "Tác vụ", middle = "Bộ điều phối", right = "Worker", count = 12,
  workers = 3, caption }: {
  left?: string; middle?: string; right?: string; count?: number; workers?: number; caption?: string;
}) => {
  const frame = useCurrentFrame();
  const appear = useIn(0);
  const X0 = 220, XS = 960, X1 = 1640;
  const yFor = (i: number, n: number, top: number, bottom: number) =>
    top + ((bottom - top) * (i + 0.5)) / n;
  const gy = (i: number) => yFor(i % 6, 6, 190, 740);
  const ty = (t: number) => yFor(t, workers, 230, 700);
  const Label = ({ x, text, color }: { x: number; text: string; color: string }) => (
    <div style={{
      position: "absolute", left: x - 250, width: 500, top: 90, textAlign: "center",
      fontSize: 44, fontWeight: fw(700), color,
    }}>
      {text}
    </div>
  );
  return (
    <AbsoluteFill style={{ opacity: appear }}>
      <Label x={X0} text={left} color={C.go} />
      <Label x={XS} text={middle} color={C.accent} />
      <Label x={X1} text={right} color={C.red} />
      <div style={{
        position: "absolute", left: XS - 110, top: 330, width: 220, height: 340, borderRadius: 24,
        border: `4px solid ${C.accent}`, background: "rgba(255,203,71,0.08)",
      }} />
      {Array.from({ length: workers }).map((_, t) => (
        <div key={t} style={{
          position: "absolute", left: X1 - 90, top: ty(t) - 45, width: 180, height: 90,
          borderRadius: 18, background: C.panel, border: `3px solid ${C.red}`, display: "flex",
          alignItems: "center", justifyContent: "center", fontSize: 34, color: C.red, fontWeight: fw(700),
        }}>
          W{t + 1}
        </div>
      ))}
      {Array.from({ length: count }).map((_, i) => {
        const cycle = 90;
        const local = (frame - 10 - i * 7 + cycle * 10) % cycle;
        const p = Math.max(0, local / cycle);
        const t = i % workers;
        const x = interpolate(p, [0, 0.45, 0.55, 1], [X0, XS - 30, XS + 30, X1 - 130]);
        const y = interpolate(p, [0, 0.45, 0.55, 1], [gy(i), 500, 500, ty(t)]);
        const o = interpolate(p, [0, 0.05, 0.95, 1], [0, 1, 1, 0]);
        return (
          <div key={i} style={{
            position: "absolute", left: x - 22, top: y - 22, width: 44, height: 44, borderRadius: 22,
            background: C.go, opacity: o, boxShadow: `0 0 18px ${C.go}`,
          }} />
        );
      })}
      {caption && (
        <div style={{
          position: "absolute", left: 0, right: 0, top: 780, textAlign: "center", fontSize: 40,
          color: C.muted,
        }}>
          {caption}
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---------- code ----------
const KEYWORDS = new Set([
  "func", "def", "class", "return", "if", "else", "for", "while", "import", "from", "const", "let",
  "var", "function", "async", "await", "package", "type", "struct", "interface", "chan", "select",
  "defer", "range", "package", "main", "public", "private", "static", "new",
]);

const Code = ({ lines, highlight = [], lanes, emphasis = ["go"] }: {
  lines: string[]; highlight?: number[]; lanes?: string[]; emphasis?: string[];
}) => {
  const frame = useCurrentFrame();
  const panel = useIn(0);
  const render = (line: string) =>
    line.split(/("[^"]*"|[A-Za-z_]+)/g).map((part, i) => {
      if (emphasis.includes(part)) {
        return <span key={i} style={{ color: C.accent, fontWeight: fw(700) }}>{part}</span>;
      }
      if (KEYWORDS.has(part)) {
        return <span key={i} style={{ color: C.go, fontWeight: fw(700) }}>{part}</span>;
      }
      if (part.startsWith('"')) return <span key={i} style={{ color: C.green }}>{part}</span>;
      return <span key={i}>{part}</span>;
    });
  const size = lines.some((l) => l.length > 38) ? 38 : 46;
  return (
    <Center>
      <div style={{ display: "flex", gap: 90, alignItems: "center" }}>
        <div style={{
          background: C.panel, borderRadius: 24, padding: "44px 56px", fontFamily: MONO,
          fontSize: size, lineHeight: 1.7, opacity: panel, transform: `scale(${0.94 + 0.06 * panel})`,
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        }}>
          {lines.map((l, i) => {
            const on = highlight.includes(i);
            const reveal = interpolate(frame, [20 + i * 14, 30 + i * 14], [0, 1], {
              extrapolateLeft: "clamp", extrapolateRight: "clamp",
            });
            return (
              <div key={i} style={{
                opacity: reveal, whiteSpace: "pre", padding: "0 14px", borderRadius: 8,
                background: on ? "rgba(0,173,216,0.16)" : "transparent",
              }}>
                {render(l)}
              </div>
            );
          })}
        </div>
        {lanes && lanes.length > 0 && (
          <div style={{ width: 520 }}>
            {lanes.map((label, i) => {
              const start = 40;
              const p = interpolate(frame, [start + i * 6, start + i * 6 + 40], [0, 1], {
                extrapolateLeft: "clamp", extrapolateRight: "clamp",
              });
              return (
                <div key={i} style={{ marginBottom: 36, opacity: p > 0 ? 1 : 0.25 }}>
                  <div style={{ fontSize: 30, color: C.muted, marginBottom: 8 }}>{label}</div>
                  <div style={{ height: 30, borderRadius: 15, background: C.panel }}>
                    <div style={{
                      height: 30, borderRadius: 15, width: `${p * 100}%`, background: C.green,
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Center>
  );
};

// ---------- stat: one big number ----------
const Stat = ({ value, label, sub }: { value: string; label: string; sub?: string }) => {
  const a = useIn(0);
  const b = useIn(14);
  const c = useIn(26);
  return (
    <Center>
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontSize: 230, fontWeight: fw(900), color: C.accent, lineHeight: 1,
          opacity: a, transform: `scale(${0.8 + 0.2 * a})`,
        }}>
          {value}
        </div>
        <div style={{ fontSize: 66, fontWeight: fw(700), marginTop: 20, opacity: b }}>{label}</div>
        {sub && <div style={{ fontSize: 42, color: C.muted, marginTop: 14, opacity: c }}>{sub}</div>}
      </div>
    </Center>
  );
};

// ---------- image: file in public/images, slow zoom ----------
const Pic = ({ src, caption }: { src: string; caption?: string }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const z = interpolate(frame, [0, durationInFrames], [1, 1.08]);
  return (
    <Center>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 1300, height: 650, borderRadius: 24, overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}>
          <Img src={staticFile(`images/${src}`)} style={{
            width: "100%", height: "100%", objectFit: "cover", transform: `scale(${z})`,
          }} />
        </div>
        {caption && <div style={{ fontSize: 38, color: C.muted, marginTop: 24 }}>{caption}</div>}
      </div>
    </Center>
  );
};


// ---------- channel intro (auto-prepended). The visuals live in <BrandTag/> (Video.tsx) so the
// title can fly to the top-right corner and stay there; this scene only plays the sting. ----------
const Intro = (_: { name?: string; tagline?: string }) => (
  <Audio src={staticFile("sfx/sting.wav")} volume={0.5} />
);

// ---------- end card: open question + next video (auto-appended) ----------
const EndCard = ({ question, sources, askLabel = "Câu hỏi dành cho bạn" }:
  { name?: string; question: string; next?: string; sources?: string; askLabel?: string }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const outA = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const a = useIn(0), d = useIn(40);
  const words = question.split(" ");
  return (
    <AbsoluteFill style={{ opacity: outA }}>
      <Audio src={staticFile("sfx/ding.wav")} volume={0.4} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 60 }}>
        <div style={{ width: 1500, textAlign: "center" }}>
          <div style={{ fontSize: 40, fontWeight: fw(700), color: C.accent, letterSpacing: 2, opacity: a,
            transform: `translateY(${(1 - a) * 24}px)`, textTransform: "uppercase" }}>
            {askLabel}
          </div>
          <div style={{ fontSize: question.length > 70 ? 56 : 68, fontWeight: fw(800), lineHeight: 1.25,
            marginTop: 26, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 18px",
            maxWidth: 1180, marginLeft: "auto", marginRight: "auto" }}>
            {words.map((w, i) => {
              const k = spring({ frame: frame - (14 + i * 4), fps, config: { damping: 11, stiffness: 150 } });
              return (
                <span key={i} style={{ display: "inline-block", opacity: Math.min(1, k * 1.5),
                  transform: `translateY(${(1 - k) * 36}px) scale(${0.8 + 0.2 * k})` }}>{w}</span>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 120, bottom: 150, opacity: d,
        transform: `translateY(${(1 - d) * 40}px) rotate(${Math.sin(frame / 7) * 4}deg)` }}>
        <Mascot expr="wink" size={150} frame={frame} point="right" />
      </div>
      {sources ? (
        <div style={{ position: "absolute", left: 360, right: 360, bottom: 52, textAlign: "center", opacity: d,
          fontSize: 28, fontWeight: fw(500), color: C.muted, lineHeight: 1.35 }}>{sources}</div>
      ) : null}
    </AbsoluteFill>
  );
};


// ---------- sign-off: invite to subscribe. The brand (icon, name, slogan) is drawn by <BrandTag/>,
// which flies back to the centre of the screen at the start of this scene. ----------
const Signoff = ({ subscribeLabel = "Đăng ký kênh", subscribedLabel = "Đã đăng ký" }:
  { name?: string; line?: string; subscribeLabel?: string; subscribedLabel?: string }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const a = spring({ frame: frame - 14, fps, config: { damping: 9, stiffness: 150 } });
  const pressAt = Math.min(56, Math.max(30, durationInFrames - 58));
  const press = frame > pressAt + 2;                       // the button gets "pressed" once
  const k = interpolate(frame, [pressAt, pressAt + 5, pressAt + 12], [1, 0.9, 1.05],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const out = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const bell = press ? Math.sin(frame / 2.2) * 14 * Math.max(0, 1 - (frame - pressAt) / 36) : 0;
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <Audio src={staticFile("sfx/sting.wav")} volume={0.45} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 800, display: "flex", justifyContent: "center" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 22, padding: "18px 46px", borderRadius: 999,
          background: press ? C.panel : C.red, color: press ? C.text : "#ffffff",
          border: press ? `3px solid ${C.muted}` : "3px solid transparent",
          fontSize: 46, fontWeight: fw(700), opacity: Math.min(1, a * 1.6),
          transform: `scale(${(0.5 + 0.5 * a) * k})`, boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
        }}>
          <span style={{ display: "inline-block", transform: `rotate(${bell}deg)`, transformOrigin: "50% 10%" }}>
            <Icon name="bell" size={52} color={press ? C.accent : "#ffffff"} />
          </span>
          {press ? subscribedLabel : subscribeLabel}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// empty filler scene (used to give the standalone intro/outro clips a short tail/lead-in)
const Pad = () => null;

export const SCENES: Record<string, React.ComponentType<any>> = {
  title: Title,
  outro: Title,
  bullets: Bullets,
  compare: Compare,
  versus: Versus,
  flow: Flow,
  fanout: Fanout,
  scheduler: Fanout, // legacy alias
  code: Code,
  stat: Stat,
  image: Pic,
  diagram: DiagramScene,
  intro: Intro,
  endcard: EndCard,
  signoff: Signoff,
  pad: Pad,
};
