// Visual lint: renders the last frame of every beat in headless Chrome and measures real element boxes.
// usage: node scripts/lint_frames.mjs <props.json> <out-dir> [--png] [--beats 3,5,9]
// props.json = {"timeline": {...}} with every beat's durationInFrames set (frames are taken just before each beat ends).
import path from "node:path";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";

const [propsFile, outDir, ...rest] = process.argv.slice(2);
const png = rest.includes("--png");
const only = rest.includes("--beats") ? new Set(rest[rest.indexOf("--beats") + 1].split(",").map(Number)) : null;
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const props = JSON.parse(fs.readFileSync(propsFile, "utf8"));
fs.mkdirSync(outDir, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts"), webpackOverride: (c) => c });
const inputProps = { ...props, lint: true };
const browser = await openBrowser("chrome", { chromiumOptions: {}, chromeMode: "headless-shell" }).catch(() => openBrowser("chrome"));
const comp = await selectComposition({ serveUrl, id: "Main", inputProps, puppeteerInstance: browser });
const scene = props.timeline.scenes.find((s) => s.kind === "diagram");
const beats = scene.props.beats;
let t0 = 0;
const results = [];
for (let i = 0; i < beats.length; i++) {
  const end = t0 + beats[i].durationInFrames;
  t0 = end;
  if (only && !only.has(i + 1)) continue;
  let lint = null;
  await renderStill({
    composition: comp, serveUrl, inputProps, frame: end - 3, puppeteerInstance: browser, scale: 0.5,
    output: png ? path.join(outDir, `b${String(i + 1).padStart(3, "0")}.png`) : path.join(outDir, "tmp.png"),
    onBrowserLog: (l) => { if (l.text.startsWith("LINTJSON")) lint = JSON.parse(l.text.slice(8)); },
  });
  results.push({ beat: i + 1, nodes: lint });
}
fs.writeFileSync(path.join(outDir, "lint.json"), JSON.stringify(results));
await browser.close({ silent: true });
console.log("done", results.length);
process.exit(0);
