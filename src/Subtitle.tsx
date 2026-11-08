import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C } from "./theme";

export const Subtitle = ({ text }: { text: string }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 56 }}>
      <div
        style={{
          opacity: o, maxWidth: 1500, textAlign: "center", fontSize: 38, lineHeight: 1.4,
          padding: "14px 28px", borderRadius: 14, background: "rgba(0,0,0,0.55)", color: C.text,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
