import React from "react";
import { AbsoluteFill, Audio, Easing, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, T, applyTheme, brandFont, fw } from "./theme";
import { SCENES } from "./scenes";
import { Subtitle } from "./Subtitle";

type Scene = {
  id: string; kind: string; text: string; props: any; audio?: string | null; durationInFrames: number;
};
export type VideoProps = {
  timeline: {
    title: string; fps: number; scenes: Scene[];
    subtitles?: boolean; theme?: string;
    channel?: { name: string; tagline?: string; font?: string; fontWeight?: number; avatar?: string };
  };
};

// deterministic "neural constellation" points for the AI backdrop
const STARS = Array.from({ length: 46 }, (_, i) => {
  const f = (v: number) => v - Math.floor(v);
  return { x: 1920 * f(Math.sin(i * 12.9898) * 43758.5453), y: 1080 * f(Math.sin(i * 78.233) * 12345.6789) };
});
const LINKS = STARS.flatMap((a, i) => STARS.slice(i + 1).map((b) => ({ a, b, d: Math.hypot(a.x - b.x, a.y - b.y) })))
  .filter((l) => l.d < 270);

export const Backdrop = () => {
  switch (T.backdrop) {
    case "graphite":
      return (
        <>
          <AbsoluteFill style={{ background: "linear-gradient(180deg, #232427 0%, #1a1b1e 100%)" }} />
          <div style={{ position: "absolute", left: -240, bottom: -300, width: 760, height: 760, borderRadius: "50%",
            background: "rgba(255,159,67,0.075)", filter: "blur(110px)" }} />
          <div style={{ position: "absolute", right: -260, top: -280, width: 820, height: 820, borderRadius: "50%",
            background: "rgba(34,211,238,0.07)", filter: "blur(120px)" }} />
          <AbsoluteFill style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.055) 1.6px, transparent 2px)",
            backgroundSize: "46px 46px",
          }} />
        </>
      );
    case "dusk":
      return (
        <>
          <AbsoluteFill style={{ background: "linear-gradient(180deg, #1a2135 0%, #1e2740 62%, #2a2f4a 100%)" }} />
          <div style={{ position: "absolute", left: 260, bottom: -460, width: 1400, height: 760, borderRadius: "50%",
            background: "rgba(244,197,106,0.10)", filter: "blur(110px)" }} />
          <AbsoluteFill style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1.6px, transparent 2px)",
            backgroundSize: "44px 44px",
          }} />
        </>
      );
    case "crt":
      return (
        <>
          <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #0a1f10 0%, #040806 70%)" }} />
          <AbsoluteFill style={{
            backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 2px, transparent 2px, transparent 4px)",
          }} />
          <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 58%, rgba(0,0,0,0.6) 100%)" }} />
          <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 62, background: "#0b1a10",
            borderBottom: "1px solid rgba(51,255,102,0.25)" }}>
            {["#ff5c5c", "#ffd23f", "#33ff66"].map((c, i) => (
              <div key={i} style={{ position: "absolute", left: 28 + i * 34, top: 21, width: 20, height: 20,
                borderRadius: 10, background: c, opacity: 0.85 }} />
            ))}
          </div>
        </>
      );
    case "aurora":
      return (
        <>
          <AbsoluteFill style={{ background: "linear-gradient(160deg, #0b0820 0%, #190f3d 60%, #0b1030 100%)" }} />
          <div style={{ position: "absolute", left: -200, top: -240, width: 900, height: 900, borderRadius: "50%",
            background: "rgba(139,92,246,0.34)", filter: "blur(110px)" }} />
          <div style={{ position: "absolute", right: -260, top: 120, width: 800, height: 800, borderRadius: "50%",
            background: "rgba(34,211,238,0.22)", filter: "blur(120px)" }} />
          <div style={{ position: "absolute", left: 500, bottom: -420, width: 900, height: 700, borderRadius: "50%",
            background: "rgba(244,114,182,0.2)", filter: "blur(120px)" }} />
          <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
            {LINKS.map((l, i) => (
              <line key={i} x1={l.a.x} y1={l.a.y} x2={l.b.x} y2={l.b.y} stroke="#c4b5fd" strokeOpacity={0.13} strokeWidth={1.5} />
            ))}
            {STARS.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3.2} fill="#c4b5fd" opacity={0.35} />)}
          </svg>
        </>
      );
    case "paper":
      return (
        <AbsoluteFill style={{
          backgroundImage:
            "linear-gradient(rgba(60,50,30,0.07) 2px, transparent 2px), linear-gradient(90deg, rgba(60,50,30,0.07) 2px, transparent 2px)",
          backgroundSize: "54px 54px",
        }} />
      );
    case "dots":
      return (
        <AbsoluteFill style={{
          backgroundImage: "radial-gradient(rgba(17,17,17,0.16) 2.5px, transparent 3px)",
          backgroundSize: "34px 34px",
        }} />
      );
    case "neon":
      return (
        <>
          <AbsoluteFill style={{ background: "linear-gradient(160deg, #0a0b1e 0%, #150a33 100%)" }} />
          <AbsoluteFill style={{
            backgroundImage:
              "linear-gradient(rgba(0,229,255,0.07) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(0,229,255,0.07) 1.5px, transparent 1.5px)",
            backgroundSize: "72px 72px",
          }} />
          <AbsoluteFill style={{
            background: "radial-gradient(ellipse at 50% 120%, rgba(255,61,242,0.22), transparent 60%)",
          }} />
        </>
      );
    case "soft":
      return (
        <>
          <AbsoluteFill style={{ background: "linear-gradient(180deg, #f8f9fd 0%, #eceffc 100%)" }} />
          <div style={{ position: "absolute", left: -180, top: -200, width: 700, height: 700, borderRadius: "50%",
            background: "rgba(79,70,229,0.10)", filter: "blur(60px)" }} />
          <div style={{ position: "absolute", right: -200, bottom: -240, width: 760, height: 760, borderRadius: "50%",
            background: "rgba(236,72,153,0.09)", filter: "blur(70px)" }} />
        </>
      );
    default:
      return (
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
          <path d="M1100 1080 C1250 800 1450 760 1620 860 C1760 940 1860 880 1920 820 L1920 1080 Z"
            fill="rgba(255,255,255,0.035)" />
          <path d="M1380 1080 C1500 930 1650 910 1800 980 C1850 1005 1890 1000 1920 990 L1920 1080 Z"
            fill="rgba(255,255,255,0.03)" />
        </svg>
      );
  }
};

// Channel identity: icon + name (+ slogan). Big and centred during the intro, then flies to the
// top-right corner and stays there for the whole video.
const BrandTag = ({ ch, introFrames, outroStart }: {
  ch: NonNullable<VideoProps["timeline"]["channel"]>; introFrames: number; outroStart: number;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const family = brandFont(ch.font);
  const weight = ch.fontWeight ?? 600;
  const has = introFrames > 0;
  const t0 = Math.max(0, introFrames - 22), t1 = introFrames + 12;
  const tIn = has
    ? interpolate(frame, [t0, t1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp",
        easing: Easing.bezier(0.65, 0, 0.35, 1) })
    : 1;
  // sign-off: the tag flies back to the centre (mirror of the intro)
  const tOut = outroStart >= 0
    ? interpolate(frame, [outroStart - 6, outroStart + 24], [0, 1], { extrapolateLeft: "clamp",
        extrapolateRight: "clamp", easing: Easing.bezier(0.65, 0, 0.35, 1) })
    : 0;
  const t = tIn * (1 - tOut);
  const L = (a: number, b: number) => a + (b - a) * t;
  const enter = has ? spring({ frame, fps, config: { damping: 8, stiffness: 130, mass: 0.9 } }) : 1;
  const settle = Math.max(0, 1 - frame / 45);
  const outSettle = outroStart >= 0 && frame >= outroStart ? Math.max(0, 1 - (frame - outroStart) / 50) : 0;
  const wobble = (1 - t) * Math.sin(frame / 4.5) * 5 * Math.max(settle, outSettle);       // little wiggle on arrival
  const idle = t >= 0.999 ? Math.sin(frame / 24) * 2.5 : t <= 0.001 && frame > introFrames ? Math.sin(frame / 18) * 4 : 0;               // gentle bob in the corner
  const size = L(250, 66);
  const letters = ch.name.split("");
  const slogan = (ch.tagline ?? "").split(" ");
  const sloganOp = Math.max(0, 1 - t * 2.2);
  return (
    <>
      {ch.avatar && (
        <Img src={staticFile(ch.avatar)} style={{
          position: "absolute", left: L(960, 1846) - size / 2, top: L(330, 60) - size / 2 + idle,
          width: size, height: size, borderRadius: "50%",
          transform: `scale(${0.3 + 0.7 * enter}) rotate(${wobble}deg)`, opacity: Math.min(1, enter * 1.6),
          boxShadow: "0 8px 26px rgba(0,0,0,0.35)",
        }} />
      )}
      <div style={{
        position: "absolute", left: L(960, 1846 - 33 - 18), top: L(555, 60), whiteSpace: "nowrap",
        transform: `translate(${-L(50, 100)}%, -50%)`, fontFamily: family, fontWeight: weight,
        fontSize: L(124, 40), color: C.go, letterSpacing: L(1, 0), lineHeight: 1,
        textShadow: t > 0.6 ? "0 2px 10px rgba(0,0,0,0.4)" : "none",
      }}>
        {letters.map((ch2, i) => {
          const k = has ? spring({ frame: frame - (10 + i * 3), fps, config: { damping: 9, stiffness: 160 } }) : 1;
          return (
            <span key={i} style={{ display: "inline-block", opacity: Math.min(1, k * 1.6),
              transform: `translateY(${(1 - k) * 46}px) scale(${0.6 + 0.4 * k})` }}>{ch2}</span>
          );
        })}
      </div>
      {slogan.length > 0 && sloganOp > 0.001 && (
        <div style={{
          position: "absolute", left: 960, top: 668, transform: "translateX(-50%)", display: "flex", gap: 16,
          fontFamily: family, fontWeight: Math.max(400, weight - 100), fontSize: 50, color: C.muted,
          opacity: sloganOp, whiteSpace: "nowrap",
        }}>
          {slogan.map((w, i) => {
            const k = has ? spring({ frame: frame - (34 + i * 6), fps, config: { damping: 14, stiffness: 140 } }) : 1;
            return <span key={i} style={{ opacity: k, transform: `translateY(${(1 - k) * 22}px)` }}>{w}</span>;
          })}
        </div>
      )}
    </>
  );
};

export const Video = ({ timeline }: VideoProps) => {
  applyTheme(timeline.theme); // sets C/T before any child renders
  let from = 0;
  const subs = timeline.subtitles !== false;
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: T.font, color: C.text }}>
      {/* hand-drawn wobble used by the "sketch" theme (static seed → stable lines) */}
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="wob" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves={2} seed={4} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={4.5} />
        </filter>
      </svg>
      <Backdrop />
      {timeline.scenes.map((s) => {
        const Scene = SCENES[s.kind];
        const start = from;
        from += s.durationInFrames;
        const hasBeats = Array.isArray(s.props?.beats);
        return (
          <Sequence key={s.id} from={start} durationInFrames={s.durationInFrames}>
            {s.audio && <Audio src={staticFile(s.audio)} />}
            <Scene {...s.props} subtitles={subs} />
            {subs && !hasBeats && s.kind !== "intro" && s.kind !== "endcard" && <Subtitle text={s.text} />}
          </Sequence>
        );
      })}
      {timeline.channel?.name && (
        <BrandTag ch={timeline.channel}
          introFrames={timeline.scenes[0]?.kind === "intro" ? timeline.scenes[0].durationInFrames : 0}
          outroStart={(() => {
            let acc = 0;
            for (const sc of timeline.scenes) {
              if (sc.kind === "signoff") return acc;
              acc += sc.durationInFrames;
            }
            return -1;
          })()} />
      )}
    </AbsoluteFill>
  );
};
