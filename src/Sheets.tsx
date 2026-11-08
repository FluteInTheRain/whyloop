import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { C, T, applyTheme } from "./theme";
import { Backdrop } from "./Video";
import { Icon, CUSTOM_ICON_NAMES } from "./icons";
import { Mascot, CHARS, EXPRS } from "./mascot";
import { EquationView, PlotView, StatView, TableView } from "./math";

export type SheetProps = { theme: string };

const Frame = ({ children, title }: { children: React.ReactNode; title: string }) => (
  <AbsoluteFill style={{ background: C.bg, fontFamily: T.font, color: C.text }}>
    <Backdrop />
    <div style={{ position: "absolute", left: 60, top: T.backdrop === "crt" ? 88 : 36, fontSize: 40, fontWeight: 700 }}>{title}</div>
    {children}
  </AbsoluteFill>
);

export const IconSheet = ({ theme }: SheetProps) => {
  applyTheme(theme);
  const names = ["db", ...CUSTOM_ICON_NAMES.filter((n) => n !== "db"), "brand:go", "brand:docker", "brand:redis"];
  const cols = 9, cw = 190, ch = 205;
  return (
    <Frame title={`Bộ icon · ${theme}`}>
      {names.map((n, i) => {
        const x = 60 + (i % cols) * cw, y = 150 + Math.floor(i / cols) * ch;
        const back = T.iconBackdrop === "circle";
        const size = back ? 76 : 100;
        return (
          <div key={n} style={{ position: "absolute", left: x, top: y, width: cw - 20, textAlign: "center" }}>
            <div style={{ position: "relative", width: 120, height: 120, margin: "0 auto" }}>
              {back && <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: T.iconBackdropFill,
                border: T.outlineW ? `${T.outlineW}px solid ${T.outline}` : "none",
                boxShadow: T.shadow === "hard" ? `${T.shadowOff}px ${T.shadowOff}px 0 ${T.shadowColor}` : "none" }} />}
              <div style={{ position: "absolute", left: (120 - size) / 2, top: (120 - size) / 2 }}>
                <Icon name={n} size={size} />
              </div>
            </div>
            <div style={{ fontSize: 22, color: C.muted, marginTop: 6, fontFamily: T.mono }}>{n.replace("brand:", "")}</div>
          </div>
        );
      })}
    </Frame>
  );
};

export const MascotSheet = ({ theme }: SheetProps) => {
  applyTheme(theme);
  const labels: Record<string, string> = {
    bit: "Bít · robot", miu: "Miu · mèo", cu: "Cú · cú đeo kính", giot: "Giọt · slime", pix: "Pix · 8-bit", bong: "Bóng · ma debug",
  };
  const cw = 235;
  return (
    <Frame title="Mascot gốc · 6 nhân vật × 6 biểu cảm">
      {EXPRS.map((e, j) => (
        <div key={e} style={{ position: "absolute", left: 270 + j * cw, top: 120, width: cw, textAlign: "center",
          fontSize: 26, color: C.muted, fontFamily: T.mono }}>{e}</div>
      ))}
      {CHARS.map((c, i) => (
        <React.Fragment key={c}>
          <div style={{ position: "absolute", left: 40, top: 215 + i * 142, fontSize: 28, fontWeight: 700, width: 240 }}>
            {labels[c]}
          </div>
          {EXPRS.map((e, j) => (
            <div key={e} style={{ position: "absolute", left: 270 + j * cw + 55, top: 168 + i * 142 }}>
              <Mascot char={c} expr={e} look="right" point={e === "wink" ? "right" : undefined} size={112} frame={30} />
            </div>
          ))}
        </React.Fragment>
      ))}
    </Frame>
  );
};

// equation + plot nodes, for checking KaTeX fonts/colours and chart styling
export const MathSheet = ({ theme }: SheetProps) => {
  applyTheme(theme);
  const pts = [[1, 2.2], [2, 3.1], [3, 4.9], [4, 5.2], [5, 7.4], [6, 7.9], [7, 9.6]];
  const fit = (x: number) => 1.2 + 1.2 * x;
  return (
    <Frame title={`Công thức & biểu đồ \u00b7 ${theme}`}>
      <div style={{ position: "absolute", left: 90, top: 170, width: 800, height: 120 }}>
        <EquationView n={{ tex: "\\hat{y} = w x + b", size: 72 }} color={C.text} hl={false} />
      </div>
      <div style={{ position: "absolute", left: 90, top: 330, width: 800, height: 150 }}>
        <EquationView n={{ tex: "L = \\frac{1}{n}\\sum_{i=1}^{n}\\left(y_i - \\hat{y}_i\\right)^2", size: 60 }}
          color={C.accent} hl={false} />
      </div>
      <div style={{ position: "absolute", left: 90, top: 520, width: 800, height: 120 }}>
        <EquationView n={{ tex: "w^{*} = \\arg\\min_w \\; L(w)", size: 60 }} color={C.purple} hl />
      </div>
      <div style={{ position: "absolute", left: 980, top: 150, width: 860, height: 560 }}>
        <PlotView w={860} h={560} kick={999} n={{
          xrange: [0, 8], yrange: [0, 12], xlabel: "Diện tích", ylabel: "Giá",
          series: [
            { type: "points", data: pts, label: "Dữ liệu" },
            { type: "segments", data: pts.map(([x, y]) => [x, y, x, fit(x)]), color: C.red, label: "Sai số" },
            { type: "fn", fn: "1.2 + 1.2*x", label: "Đường khớp", color: C.green },
          ] }} />
      </div>
      <div style={{ position: "absolute", left: 760, top: 720, width: 300, height: 190 }}>
        <StatView n={{ value: 60, suffix: "%", label: "đoán đúng", size: 110 }} color={C.accent} age={999} kick={9999} />
      </div>
      <div style={{ position: "absolute", left: 1120, top: 740 }}>
        <TableView n={{ rows: [["Ngân sách", "Doanh số"], ["1,2", "3,4"], ["2,5", "6,1"], ["4,0", "7,3"]], colw: 200, hi: [2] }}
          color={C.go} kick={999} />
      </div>
      <div style={{ position: "absolute", left: 90, top: 700, width: 600, height: 330 }}>
        <PlotView w={600} h={330} kick={999} n={{ xrange: [-3, 3], yrange: [0, 9], series: [{ type: "fn", fn: "x^2" }] }} />
      </div>
    </Frame>
  );
};

// contact sheet of library icons: props.ids = ["logos/python", ...] (staged in public/lib)
export const LibSheet = ({ ids, title = "Thư viện icon" }: { ids: string[]; title?: string }) => {
  applyTheme("spectrum");
  const cols = 12, cw = 150, ch = 138;
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: T.font, color: C.text }}>
      <div style={{ position: "absolute", left: 40, top: 14, fontSize: 30, fontWeight: 700 }}>{title}</div>
      {ids.map((id, i) => (
        <div key={id} style={{ position: "absolute", left: 40 + (i % cols) * cw, top: 70 + Math.floor(i / cols) * ch,
          width: cw - 10, textAlign: "center" }}>
          <Img src={staticFile(`lib/${id}.svg`)} style={{ width: 76, height: 76, objectFit: "contain" }} />
          <div style={{ fontSize: 15, color: C.muted, marginTop: 6, lineHeight: 1.15, wordBreak: "break-all" }}>
            {id.split("/")[1]}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
