import { loadFont as loadPatrickHand } from "@remotion/google-fonts/PatrickHand";
import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadBaloo2 } from "@remotion/google-fonts/Baloo2";
import { loadFont as loadBeVietnamPro } from "@remotion/google-fonts/BeVietnamPro";
import { loadFont as loadLexend } from "@remotion/google-fonts/Lexend";
import { loadFont as loadBarlow } from "@remotion/google-fonts/Barlow";
import { loadFont as loadQuicksand } from "@remotion/google-fonts/Quicksand";
import { loadFont as loadNunito } from "@remotion/google-fonts/Nunito";
import { loadFont as loadComfortaa } from "@remotion/google-fonts/Comfortaa";
import { loadFont as loadVarela } from "@remotion/google-fonts/VarelaRound";
import { loadFont as loadMali } from "@remotion/google-fonts/Mali";
import { loadFont as loadGrandstander } from "@remotion/google-fonts/Grandstander";
import { loadFont as loadPangolin } from "@remotion/google-fonts/Pangolin";

// Only open-licence (SIL OFL) fonts are rendered into videos: Barlow + JetBrains Mono as the base.
export const SANS = '"Barlow", "Helvetica Neue", Arial, sans-serif';
export const MONO = '"JetBrains Mono", Menlo, monospace';

type Colors = {
  bg: string; panel: string; text: string; muted: string; go: string; accent: string; green: string;
  red: string; blue: string; purple: string; orange: string; pink: string;
};
export type Struct = {
  light: boolean; font: string; mono: string;
  backdrop: "hills" | "paper" | "neon" | "dots" | "soft" | "crt" | "aurora" | "dusk" | "graphite";
  radius: number; outlineW: number; outline: string;
  shadow: "none" | "hard" | "soft" | "glow"; shadowOff: number; shadowColor: string;
  boxStyle: "solid" | "tint" | "dark" | "glass";
  edgeW: number; edgeDash?: string; edgeColor: string; edgeGlow: boolean; arrow: number;
  iconStroke: number; iconInk: string; iconBackdrop: "none" | "circle"; iconBackdropFill: string;
  groupDash: string; groupColor: string; groupFill: string;
  codeBg: string; codeBorder: string; codeText: string; kw1: string; kw2: string; str: string;
  cellRadius: number; cellEmpty: string; cells: string[];
  faceDark: string; bubbleBg: string; bubbleInk: string; bubbleBorder: string;
  hlInk: string; labelStyle: "plain" | "pill"; wobble: boolean; fs?: number; weightShift?: number;
  iconStyle?: "line" | "glow2" | "pixel" | "duo"; bracket?: boolean; tagLeft?: number; mascot?: string;
  tagPos?: "tl" | "br";
};

const CLASSIC: Colors = {
  bg: "#222426", panel: "#2f3237", text: "#ececec", muted: "#9aa0a6", go: "#19c3a0", accent: "#ffc933",
  green: "#4ade80", red: "#f0625f", blue: "#3fc1ff", purple: "#a78bfa", orange: "#ffa347", pink: "#f472b6",
};

type ThemeDef = { name: string; colors: Colors; struct: Struct; load?: () => void };

export const THEMES: Record<string, ThemeDef> = {
  classic: {
    name: "Classic (tối, nét đứt)",
    colors: CLASSIC,
    struct: {
      light: false, font: SANS, mono: MONO, backdrop: "hills", radius: 18, outlineW: 0, outline: "none",
      shadow: "none", shadowOff: 0, shadowColor: "none", boxStyle: "solid",
      edgeW: 4, edgeDash: "11 9", edgeColor: "#9aa0a6", edgeGlow: false, arrow: 15,
      iconStroke: 3.5, iconInk: "#ececec", iconBackdrop: "none", iconBackdropFill: "transparent",
      groupDash: "dashed", groupColor: "rgba(255,255,255,0.32)", groupFill: "rgba(255,255,255,0.045)",
      codeBg: "#17191b", codeBorder: "#3a3d42", codeText: "#ececec", kw1: "#ffc933", kw2: "#19c3a0", str: "#4ade80",
      cellRadius: 8, cellEmpty: "#ffffff", cells: ["#3fc1ff", "#a78bfa", "#ffa347", "#f472b6", "#19c3a0", "#ffc933"],
      faceDark: "#12302a", bubbleBg: "#f4f4f2", bubbleInk: "#1a1d1f", bubbleBorder: "none",
      hlInk: "#ffc933", labelStyle: "plain", wobble: false,
    },
  },
  sketch: {
    name: "Sketch (giấy kẻ ô, vẽ tay)",
    colors: {
      bg: "#fbf6ea", panel: "#fffdf7", text: "#2b2a28", muted: "#7a7466", go: "#2f6fed", accent: "#f5b301",
      green: "#2f9e5b", red: "#e5484d", blue: "#2f6fed", purple: "#8e5bd9", orange: "#f08a24", pink: "#e8588d",
    },
    load: () => { loadPatrickHand("normal", { subsets: ["vietnamese", "latin"], weights: ["400"] }); },
    struct: {
      light: true, font: '"Patrick Hand", "Avenir Next", "Helvetica Neue", sans-serif', mono: MONO, backdrop: "paper",
      radius: 14, outlineW: 3, outline: "#2b2a28", shadow: "none", shadowOff: 0, shadowColor: "none",
      boxStyle: "tint", edgeW: 4.5, edgeDash: undefined, edgeColor: "#2b2a28", edgeGlow: false, arrow: 19,
      iconStroke: 4, iconInk: "#2b2a28", iconBackdrop: "none", iconBackdropFill: "transparent",
      groupDash: "dashed", groupColor: "rgba(43,42,40,0.45)", groupFill: "rgba(245,179,1,0.07)",
      codeBg: "#fffdf7", codeBorder: "#2b2a28", codeText: "#2b2a28", kw1: "#d9480f", kw2: "#2f6fed", str: "#2f9e5b",
      cellRadius: 6, cellEmpty: "#e8e1cf", cells: ["#2f6fed", "#f08a24", "#2f9e5b", "#e8588d", "#8e5bd9", "#f5b301"],
      faceDark: "#1f2a44", bubbleBg: "#fffdf7", bubbleInk: "#2b2a28", bubbleBorder: "3px solid #2b2a28",
      hlInk: "#d9480f", labelStyle: "plain", wobble: true, fs: 1.22,
    },
  },
  neon: {
    name: "Neon (terminal, phát sáng)",
    colors: {
      bg: "#0a0b1e", panel: "#12162e", text: "#e8ecff", muted: "#7f86b2", go: "#00e5ff", accent: "#d4ff3a",
      green: "#39ff88", red: "#ff4d6d", blue: "#4d8bff", purple: "#b26bff", orange: "#ff9f43", pink: "#ff3df2",
    },
    load: () => {
      loadSpaceGrotesk("normal", { subsets: ["vietnamese", "latin"], weights: ["500", "700"] });
      loadJetBrainsMono("normal", { subsets: ["vietnamese", "latin"], weights: ["400", "700"] });
    },
    struct: {
      light: false, font: '"Space Grotesk", "Helvetica Neue", sans-serif', mono: '"JetBrains Mono", Menlo, monospace',
      backdrop: "neon", radius: 6, outlineW: 2, outline: "none", shadow: "glow", shadowOff: 0, shadowColor: "none",
      boxStyle: "dark", edgeW: 3.5, edgeDash: undefined, edgeColor: "#4d5a9c", edgeGlow: true, arrow: 14,
      iconStroke: 3, iconInk: "#00e5ff", iconBackdrop: "none", iconBackdropFill: "transparent",
      groupDash: "solid", groupColor: "rgba(77,90,156,0.55)", groupFill: "rgba(0,229,255,0.04)",
      codeBg: "#0d1024", codeBorder: "rgba(0,229,255,0.45)", codeText: "#cfe8ff", kw1: "#d4ff3a", kw2: "#00e5ff", str: "#39ff88",
      cellRadius: 4, cellEmpty: "#1b2040", cells: ["#00e5ff", "#ff3df2", "#d4ff3a", "#b26bff", "#ff9f43", "#4d8bff"],
      faceDark: "#06101a", bubbleBg: "#12162e", bubbleInk: "#e8ecff", bubbleBorder: "2px solid #00e5ff",
      hlInk: "#d4ff3a", labelStyle: "plain", wobble: false, iconStyle: "glow2", mascot: "bit",
    },
  },
  sticker: {
    name: "Sticker (pastel, viền đen, bóng cứng)",
    colors: {
      bg: "#fdf0d5", panel: "#ffffff", text: "#111111", muted: "#5c5547", go: "#3a86ff", accent: "#ffbe0b",
      green: "#06d6a0", red: "#ff4d6d", blue: "#3a86ff", purple: "#8338ec", orange: "#fb8500", pink: "#ff70a6",
    },
    load: () => { loadBaloo2("normal", { subsets: ["vietnamese", "latin"], weights: ["500", "700", "800"] }); },
    struct: {
      light: true, font: '"Baloo 2", "Avenir Next", sans-serif', mono: MONO, backdrop: "dots",
      radius: 14, outlineW: 4, outline: "#111111", shadow: "hard", shadowOff: 6, shadowColor: "#111111",
      boxStyle: "solid", edgeW: 5.5, edgeDash: undefined, edgeColor: "#111111", edgeGlow: false, arrow: 20,
      iconStroke: 4.5, iconInk: "#111111", iconBackdrop: "circle", iconBackdropFill: "#ffe28a",
      groupDash: "dashed", groupColor: "#111111", groupFill: "rgba(255,255,255,0.5)",
      codeBg: "#ffffff", codeBorder: "#111111", codeText: "#111111", kw1: "#d90429", kw2: "#3a86ff", str: "#06a77d",
      cellRadius: 7, cellEmpty: "#ffffff", cells: ["#3a86ff", "#ff70a6", "#06d6a0", "#fb8500", "#8338ec", "#ffbe0b"],
      faceDark: "#111111", bubbleBg: "#ffffff", bubbleInk: "#111111", bubbleBorder: "4px solid #111111",
      hlInk: "#ff4d6d", labelStyle: "pill", wobble: false,
    },
  },
  minimal: {
    name: "Minimal (sáng, bo tròn, bóng mềm)",
    colors: {
      bg: "#f6f7fb", panel: "#ffffff", text: "#1b2333", muted: "#6b7280", go: "#4f46e5", accent: "#f59e0b",
      green: "#10b981", red: "#ef4444", blue: "#3b82f6", purple: "#8b5cf6", orange: "#f97316", pink: "#ec4899",
    },
    load: () => { loadBeVietnamPro("normal", { subsets: ["vietnamese", "latin"], weights: ["400", "600", "700"] }); },
    struct: {
      light: true, font: '"Be Vietnam Pro", "Helvetica Neue", sans-serif', mono: MONO, backdrop: "soft",
      radius: 22, outlineW: 0, outline: "none", shadow: "soft", shadowOff: 0, shadowColor: "none",
      boxStyle: "solid", edgeW: 3.5, edgeDash: undefined, edgeColor: "#94a3b8", edgeGlow: false, arrow: 14,
      iconStroke: 4.4, iconInk: "#4338ca", iconBackdrop: "circle", iconBackdropFill: "#dfe1ff",
      groupDash: "solid", groupColor: "#cbd5e1", groupFill: "rgba(255,255,255,0.7)",
      codeBg: "#1e2433", codeBorder: "#1e2433", codeText: "#e2e8f0", kw1: "#fbbf24", kw2: "#818cf8", str: "#34d399",
      cellRadius: 9, cellEmpty: "#e2e8f0", cells: ["#4f46e5", "#3b82f6", "#10b981", "#f97316", "#ec4899", "#8b5cf6"],
      faceDark: "#1e1b4b", bubbleBg: "#ffffff", bubbleInk: "#1b2333", bubbleBorder: "1px solid #e2e8f0",
      hlInk: "#4f46e5", labelStyle: "plain", wobble: false,
    },
  },
  terminal: {
    name: "Terminal (CRT xanh phosphor, icon pixel)",
    colors: {
      bg: "#040806", panel: "#08140c", text: "#c9ffd6", muted: "#5f9b6e", go: "#33ff66", accent: "#ffd23f",
      green: "#33ff66", red: "#ff5c5c", blue: "#4dd0ff", purple: "#c792ea", orange: "#ffa94d", pink: "#ff6ec7",
    },
    load: () => { loadJetBrainsMono("normal", { subsets: ["vietnamese", "latin"], weights: ["400", "700"] }); },
    struct: {
      light: false, font: '"JetBrains Mono", Menlo, monospace', mono: '"JetBrains Mono", Menlo, monospace',
      backdrop: "crt", radius: 2, outlineW: 2, outline: "none", shadow: "glow", shadowOff: 0, shadowColor: "none",
      boxStyle: "dark", edgeW: 3, edgeDash: "7 7", edgeColor: "#3f8f55", edgeGlow: true, arrow: 14,
      iconStroke: 3, iconInk: "#33ff66", iconBackdrop: "none", iconBackdropFill: "transparent",
      groupDash: "dashed", groupColor: "rgba(51,255,102,0.35)", groupFill: "rgba(51,255,102,0.04)",
      codeBg: "#020503", codeBorder: "rgba(51,255,102,0.6)", codeText: "#c9ffd6", kw1: "#ffd23f", kw2: "#4dd0ff", str: "#33ff66",
      cellRadius: 0, cellEmpty: "#0f2216", cells: ["#33ff66", "#4dd0ff", "#ffd23f", "#ff6ec7", "#c792ea", "#ffa94d"],
      faceDark: "#031008", bubbleBg: "#08140c", bubbleInk: "#c9ffd6", bubbleBorder: "2px solid #33ff66",
      hlInk: "#ffd23f", labelStyle: "plain", wobble: false, fs: 0.92,
      iconStyle: "pixel", bracket: true, tagLeft: 150, mascot: "bit",
    },
  },
  ai: {
    name: "AI (cực quang, mạng nơ-ron, kính mờ)",
    colors: {
      bg: "#0b0820", panel: "#16123a", text: "#f1eeff", muted: "#9d94c9", go: "#a78bfa", accent: "#ff5fa2",
      green: "#34d399", red: "#fb7185", blue: "#38bdf8", purple: "#c4b5fd", orange: "#fb923c", pink: "#f472b6",
    },
    load: () => { loadLexend("normal", { subsets: ["vietnamese", "latin"], weights: ["400", "600", "700"] }); },
    struct: {
      light: false, font: '"Lexend", "Helvetica Neue", sans-serif', mono: MONO, backdrop: "aurora",
      radius: 22, outlineW: 1.5, outline: "none", shadow: "glow", shadowOff: 0, shadowColor: "none",
      boxStyle: "glass", edgeW: 3.5, edgeDash: undefined, edgeColor: "#8b7fe0", edgeGlow: true, arrow: 15,
      iconStroke: 3.2, iconInk: "#ffffff", iconBackdrop: "none", iconBackdropFill: "transparent",
      groupDash: "solid", groupColor: "rgba(255,255,255,0.18)", groupFill: "rgba(255,255,255,0.045)",
      codeBg: "rgba(10,8,34,0.8)", codeBorder: "rgba(167,139,250,0.55)", codeText: "#ece8ff", kw1: "#ff5fa2", kw2: "#38bdf8", str: "#34d399",
      cellRadius: 10, cellEmpty: "#2a2458", cells: ["#a78bfa", "#38bdf8", "#f472b6", "#34d399", "#fb923c", "#c4b5fd"],
      faceDark: "#1a1240", bubbleBg: "rgba(255,255,255,0.12)", bubbleInk: "#f1eeff", bubbleBorder: "1.5px solid rgba(255,255,255,0.4)",
      hlInk: "#ff5fa2", labelStyle: "plain", wobble: false, fs: 0.97,
      iconStyle: "duo", mascot: "bit",
    },
  },
  dusk: {
    name: "Dusk (xanh chiều tà, dịu mắt, Barlow)",
    colors: {
      bg: "#1b2234", panel: "#262f47", text: "#eaeef7", muted: "#97a3bd", go: "#7fa8ff", accent: "#f4c56a",
      green: "#78d3a6", red: "#f08a86", blue: "#74c3f0", purple: "#b7a2f2", orange: "#f2a672", pink: "#f0a3c4",
    },
    struct: {
      light: false, font: SANS, mono: MONO, backdrop: "dusk",
      radius: 16, outlineW: 0, outline: "none", shadow: "soft", shadowOff: 0, shadowColor: "none",
      boxStyle: "solid", edgeW: 3.5, edgeDash: undefined, edgeColor: "#8d99b5", edgeGlow: false, arrow: 14,
      iconStroke: 3.2, iconInk: "#dfe6f5", iconBackdrop: "circle", iconBackdropFill: "#2f3a57",
      groupDash: "solid", groupColor: "rgba(255,255,255,0.16)", groupFill: "rgba(255,255,255,0.04)",
      codeBg: "#141a2a", codeBorder: "#33405f", codeText: "#e6ebf7", kw1: "#f4c56a", kw2: "#7fa8ff", str: "#78d3a6",
      cellRadius: 9, cellEmpty: "#33405f", cells: ["#7fa8ff", "#b7a2f2", "#f2a672", "#f0a3c4", "#78d3a6", "#f4c56a"],
      faceDark: "#161c2d", bubbleBg: "#eef1fa", bubbleInk: "#1b2234", bubbleBorder: "none",
      hlInk: "#f4c56a", labelStyle: "plain", wobble: false, fs: 1.1, mascot: "bit", tagPos: "br",
    },
  },
  spectrum: {
    name: "Spectrum (xám than trung tính, nhiều màu rõ, tương phản cao)",
    colors: {
      bg: "#1e1f22", panel: "#2c2e33", text: "#f6f7f9", muted: "#a7acb5", go: "#22d3ee", accent: "#ffd23f",
      green: "#34d399", red: "#ff5c5c", blue: "#4c8dff", purple: "#a97bff", orange: "#ff9f43", pink: "#ff7eb6",
    },
    load: () => { loadMali("normal", { subsets: ["vietnamese", "latin"] as any, weights: ["400", "500", "600", "700"] as any }); },
    struct: {
      light: false, font: '"Mali", "Helvetica Neue", sans-serif', mono: MONO, backdrop: "graphite",
      radius: 16, outlineW: 0, outline: "none", shadow: "soft", shadowOff: 0, shadowColor: "none",
      boxStyle: "solid", edgeW: 4, edgeDash: undefined, edgeColor: "#d7dae0", edgeGlow: false, arrow: 15,
      iconStroke: 3.4, iconInk: "#f3f4f6", iconBackdrop: "circle", iconBackdropFill: "#33363c",
      groupDash: "dashed", groupColor: "rgba(255,255,255,0.30)", groupFill: "rgba(255,255,255,0.04)",
      codeBg: "#141517", codeBorder: "#3b3e45", codeText: "#f1f2f4", kw1: "#ffd23f", kw2: "#22d3ee", str: "#34d399",
      cellRadius: 9, cellEmpty: "#3a3d44",
      cells: ["#22d3ee", "#a97bff", "#ff9f43", "#ff7eb6", "#34d399", "#ffd23f", "#4c8dff", "#ff5c5c"],
      faceDark: "#101114", bubbleBg: "#f6f7f9", bubbleInk: "#1e1f22", bubbleBorder: "none",
      hlInk: "#ffd23f", labelStyle: "plain", wobble: false, fs: 1, mascot: "bit", tagPos: "br",
    },
  },
};

// Brand wordmark fonts (light, friendly, Vietnamese-capable, SIL OFL). Selected by config.channel.font.
const BV = { subsets: ["vietnamese", "latin"] as any };
export const BRAND_FONTS: Record<string, () => string> = {
  quicksand: () => loadQuicksand("normal", { ...BV, weights: ["500", "600", "700"] }).fontFamily,
  nunito: () => loadNunito("normal", { ...BV, weights: ["500", "600", "700"] }).fontFamily,
  comfortaa: () => loadComfortaa("normal", { ...BV, weights: ["500", "600", "700"] }).fontFamily,
  varela: () => loadVarela("normal", { ...BV, weights: ["400"] }).fontFamily,
  baloo2: () => loadBaloo2("normal", { ...BV, weights: ["500", "600"] }).fontFamily,
  mali: () => loadMali("normal", { ...BV, weights: ["400", "500", "600", "700"] }).fontFamily,
  grandstander: () => loadGrandstander("normal", { ...BV, weights: ["500", "600"] }).fontFamily,
  pangolin: () => loadPangolin("normal", { ...BV, weights: ["400"] }).fontFamily,
};
export const brandFont = (id?: string) => (BRAND_FONTS[id ?? "quicksand"] ?? BRAND_FONTS.quicksand)();

// Mutable on purpose: components import C/T and read current theme values at render time.
export const C: Colors = { ...CLASSIC };
export const T: Struct = { ...THEMES.classic.struct };

export const applyTheme = (id?: string) => {
  const th = THEMES[id ?? "classic"] ?? THEMES.classic;
  loadBarlow("normal", { subsets: ["vietnamese", "latin"], weights: ["400", "500", "600", "700"] });
  loadJetBrainsMono("normal", { subsets: ["vietnamese", "latin"], weights: ["400", "700"] });
  Object.assign(C, th.colors);
  Object.assign(T, { fs: 1, iconStyle: "line", bracket: false, tagLeft: 40, mascot: "bit", weightShift: -100 }, th.struct);
  th.load?.();
};

// Global on-screen size factor: videos are watched on phones, so every text/number/icon is scaled up by this.
export const UI = 1.3;

// Global weight helper: everything is one step lighter than the weight written in the components.
export const fw = (w: number) => Math.max(400, w + (T.weightShift ?? -100));
