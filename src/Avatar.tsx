import React from "react";
import { AbsoluteFill } from "remotion";
import { C, applyTheme, brandFont } from "./theme";
import { Mascot } from "./mascot";

export type AvatarProps = { variant: "A" | "B" | "C" | "D" | "E"; theme?: string };

// circular "loop" arrow around (cx,cy); sweep from a0 to a1 degrees (clockwise), arrowhead at the end
export const LoopArrow = ({ cx = 400, cy = 400, r = 300, a0 = -55, a1 = 245, w = 36, color }: {
  cx?: number; cy?: number; r?: number; a0?: number; a1?: number; w?: number; color: string;
}) => {
  const rad = (d: number) => (d * Math.PI) / 180;
  const p = (d: number) => [cx + r * Math.cos(rad(d)), cy + r * Math.sin(rad(d))];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  // arrowhead (tangent direction at the end of a clockwise arc)
  const tx = -Math.sin(rad(a1)), ty = Math.cos(rad(a1));
  const nx = Math.cos(rad(a1)), ny = Math.sin(rad(a1));
  const L = w * 1.9, H = w * 1.5;
  const tip = [x1 + tx * L * 0.55, y1 + ty * L * 0.55];
  const b1 = [x1 - tx * L * 0.45 + nx * H, y1 - ty * L * 0.45 + ny * H];
  const b2 = [x1 - tx * L * 0.45 - nx * H, y1 - ty * L * 0.45 - ny * H];
  return (
    <g>
      <path d={`M${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1}`} stroke={color} strokeWidth={w}
        strokeLinecap="round" fill="none" />
      <polygon points={`${tip[0]},${tip[1]} ${b1[0]},${b1[1]} ${b2[0]},${b2[1]}`} fill={color} />
    </g>
  );
};

// "Eureka!" mascot (800x800 box, transparent): arm raised, wide-eyed grin, bulb lit on the antenna
export const EurekaBit = () => (
  <div style={{ position: "absolute", left: 0, top: 0, width: 800, height: 800 }}>
    {/* "Eureka!": arm raised with a pointing finger, wide-eyed grin, bulb lit on top of the antenna */}
    <div style={{ position: "absolute", left: 55, top: 108 }}>
      <Mascot expr="aha" look="up" point="eureka" size={690} frame={20} />
    </div>
    <div style={{ position: "absolute", left: 305, top: 38, width: 190, height: 190,
      background: "radial-gradient(circle, rgba(255,226,102,0.6) 0%, rgba(255,210,63,0.25) 40%, rgba(255,210,63,0) 70%)" }} />
    <svg width={190} height={190} viewBox="-10 -14 120 120"
      style={{ position: "absolute", left: 305, top: 62, overflow: "visible" }}>
      <defs>
        <linearGradient id="bulbG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff6b8" />
          <stop offset="0.55" stopColor="#ffd93d" />
          <stop offset="1" stopColor="#ffb21e" />
        </linearGradient>
      </defs>
      <g stroke="#ffe27a" strokeWidth={4.4} strokeLinecap="round">
        <path d="M50 -9v-5M18 2l-4-4M82 2l4-4M2 28l-5-1M98 28l5-1" />
      </g>
      <path d="M50 4C29 4 15 20 15 38c0 11 6 19 13 27 4 5 6 8 6 13h32c0-5 2-8 6-13 7-8 13-16 13-27C85 20 71 4 50 4z"
        fill="url(#bulbG)" />
      <path d="M39 51l11 14 11-14" fill="none" stroke="#ff9f1a" strokeWidth={4} strokeLinecap="round"
        strokeLinejoin="round" />
      <path d="M50 65v13" stroke="#ff9f1a" strokeWidth={4} strokeLinecap="round" />
      <rect x={35} y={80} width={30} height={7} rx={3.5} fill="#c5c9d1" />
      <rect x={38} y={89} width={24} height={6} rx={3} fill="#a9aeb8" />
      <ellipse cx={34} cy={26} rx={6} ry={11} transform="rotate(24 34 26)" fill="#ffffff" opacity={0.7} />
    </svg>
  </div>
);

export const Avatar = ({ variant, theme = "spectrum" }: AvatarProps) => {
  applyTheme(theme);
  const loop = C.accent;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${C.bg} 0%, ${C.panel} 100%)`,
      fontFamily: brandFont() }}>
      <div style={{ position: "absolute", left: 80, bottom: -260, width: 640, height: 520, borderRadius: "50%",
        background: "rgba(255,159,67,0.16)", filter: "blur(70px)" }} />
      {variant === "A" && (
        <>
          <svg width={800} height={800} style={{ position: "absolute" }}>
            <LoopArrow color={loop} />
          </svg>
          <div style={{ position: "absolute", left: 400 - 210, top: 400 - 235 }}>
            <Mascot expr="think" size={420} frame={20} />
          </div>
        </>
      )}
      {variant === "B" && (
        <>
          <svg width={800} height={800} style={{ position: "absolute" }}>
            <LoopArrow color={C.go} r={310} w={40} />
          </svg>
          <div style={{ position: "absolute", left: 0, top: 70, width: 800, textAlign: "center",
            fontSize: 600, fontWeight: 800, color: C.accent, lineHeight: 1 }}>?</div>
        </>
      )}
      {variant === "C" && <EurekaBit />}
      {variant === "E" && (
        <>
          <svg width={800} height={800} style={{ position: "absolute" }}>
            <LoopArrow color={loop} r={325} w={34} a0={-68} a1={232} />
          </svg>
          <div style={{ position: "absolute", left: 400 - 255, top: 400 - 285 }}>
            <Mascot expr="wow" size={510} frame={20} />
          </div>
          <div style={{ position: "absolute", left: 540, top: 150, width: 130, height: 130, borderRadius: "50%",
            background: "#f4f4f2", color: "#1b2234", fontSize: 104, fontWeight: 800, textAlign: "center",
            lineHeight: "130px", boxShadow: "0 8px 24px rgba(0,0,0,0.35)" }}>?</div>
        </>
      )}
      {variant === "D" && (
        <>
          <svg width={800} height={800} style={{ position: "absolute" }}>
            <LoopArrow color={C.go} r={320} w={34} a0={-30} a1={250} />
          </svg>
          <div style={{ position: "absolute", left: 0, top: 160, width: 800, textAlign: "center",
            fontSize: 360, fontWeight: 800, color: C.text, letterSpacing: -10, lineHeight: 1 }}>
            W<span style={{ color: C.accent }}>L</span>
          </div>
          <div style={{ position: "absolute", left: 0, top: 560, width: 800, textAlign: "center",
            fontSize: 70, fontWeight: 600, color: C.muted, letterSpacing: 6 }}>WHYLOOP</div>
        </>
      )}
    </AbsoluteFill>
  );
};
