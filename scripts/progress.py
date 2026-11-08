"""Progress reporting: terminal bar + out/work/progress.json + local web page with a live bar."""
import json, os, subprocess, sys, threading, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

PAGE = """<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Tiến độ tạo video</title>
<meta name="viewport" content="width=device-width,initial-scale=1"><style>
:root{--bg:#0b1220;--panel:#131c2e;--text:#e8eefc;--muted:#8a9bbd;--go:#00ADD8;--ok:#4ade80;--err:#f87171}
body{margin:0;padding:40px 20px;background:var(--bg);color:var(--text);font:17px/1.5 -apple-system,Arial,sans-serif}
main{max-width:760px;margin:auto}h1{color:var(--go);margin:0 0 4px;font-size:28px}
.sub{color:var(--muted);margin-bottom:28px}
.bar{height:34px;border-radius:17px;background:var(--panel);overflow:hidden}
.fill{height:100%;width:0;background:var(--go);transition:width .5s;border-radius:17px}
.pct{font-size:56px;font-weight:800;margin:18px 0 0}
.meta{color:var(--muted);margin:6px 0 24px}
ul{list-style:none;padding:0;margin:0}li{padding:8px 0;border-bottom:1px solid #1e2a44;display:flex;gap:12px}
li .dot{width:20px;text-align:center}li.done{color:var(--ok)}li.cur{color:var(--text);font-weight:700}li.todo{color:var(--muted)}
.final{margin-top:26px;padding:16px 18px;border-radius:12px;background:var(--panel);word-break:break-all}
.err{color:var(--err)}</style></head><body><main>
<h1 id="t">Đang tạo video…</h1><div class="sub" id="s"></div>
<div class="bar"><div class="fill" id="f"></div></div>
<div class="pct" id="p">0%</div><div class="meta" id="m"></div>
<ul id="l"></ul><div id="end"></div>
<script>
const $=id=>document.getElementById(id);
const fmt=s=>s==null?"…":(Math.floor(s/60)+" phút "+Math.round(s%60)+" giây");
async function tick(){
 try{
  const d=await (await fetch("progress.json?"+Date.now())).json();
  $("s").textContent=d.title||"";
  $("f").style.width=d.percent+"%"; $("p").textContent=Math.round(d.percent)+"%";
  $("m").textContent=(d.detail||"")+"  ·  đã chạy "+fmt(d.elapsed)+(d.state==="running"?"  ·  còn khoảng "+fmt(d.eta):"");
  $("l").innerHTML=d.stages.map(s=>{
    const c=s.status; const ic=c==="done"?"✓":c==="cur"?"▶":"○";
    return `<li class="${c}"><span class="dot">${ic}</span><span>${s.label}</span></li>`}).join("");
  if(d.state==="done"){$("t").textContent="Hoàn thành ✓";$("f").style.background="var(--ok)";
    $("end").innerHTML='<div class="final">Video đã lưu tại:<br><b>'+d.output+'</b></div>';return}
  if(d.state==="error"){$("t").textContent="Có lỗi";$("end").innerHTML='<div class="final err">'+d.detail+'</div>';return}
 }catch(e){}
 setTimeout(tick,700);
}
tick();
</script></main></body></html>"""


class Progress:
    def __init__(self, title, stages, path, serve=True, open_browser=True):
        """stages: list of (key, label, weight)."""
        self.title, self.stages = title, stages
        self.total_w = sum(w for _, _, w in stages)
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.t0 = time.time()
        self.cur, self.frac, self.detail = None, 0.0, "Đang chuẩn bị"
        self.state, self.output = "running", ""
        self._last_print = -1
        self.url = None
        self._lock = threading.Lock()
        if serve:
            self._serve(open_browser)
        self._write()

    # ----- state -----
    def snapshot(self):
        done_w = 0.0
        stages = []
        seen_cur = False
        for k, label, w in self.stages:
            if self.state == "done":
                st = "done"
            elif k == self.cur:
                st, seen_cur = "cur", True
            elif not seen_cur and self.cur is not None:
                st = "done"
            else:
                st = "todo"
            if st == "done":
                done_w += w
            elif st == "cur":
                done_w += w * self.frac
            stages.append({"key": k, "label": label, "status": st})
        pct = 100.0 if self.state == "done" else min(99.0, 100 * done_w / self.total_w)
        el = time.time() - self.t0
        eta = el / pct * (100 - pct) if pct >= 4 else None
        return {"title": self.title, "state": self.state, "percent": round(pct, 1),
                "detail": self.detail, "stages": stages, "elapsed": round(el, 1),
                "eta": None if eta is None else round(eta, 1), "output": self.output}

    def _write(self):
        with self._lock:
            snap = self.snapshot()
            try:   # several renders may share out/work/progress.json: never let a race kill a render
                tmp = self.path.with_suffix(f".{os.getpid()}.tmp")
                tmp.write_text(json.dumps(snap, ensure_ascii=False))
                tmp.replace(self.path)
            except OSError:
                pass
        return snap

    def update(self, stage=None, frac=None, detail=None):
        if stage is not None and stage != self.cur:
            self.cur, self.frac = stage, 0.0
        if frac is not None:
            self.frac = max(0.0, min(1.0, frac))
        if detail is not None:
            self.detail = detail
        snap = self._write()
        p = int(snap["percent"])
        if p != self._last_print:
            self._last_print = p
            filled = p * 30 // 100
            print(f"[{'█' * filled}{'░' * (30 - filled)}] {p:3d}%  {self.detail}", flush=True)

    def finish(self, output):
        self.state, self.output, self.detail = "done", str(output), "Hoàn thành"
        self._write()
        print(f"[{'█' * 30}] 100%  Hoàn thành → {output}", flush=True)
        time.sleep(3)  # let the web page catch the final state

    def fail(self, msg):
        self.state, self.detail = "error", msg
        self._write()
        time.sleep(3)

    # ----- web page -----
    def _serve(self, open_browser):
        prog = self

        class H(BaseHTTPRequestHandler):
            def log_message(self, *a):
                pass

            def do_GET(self):
                if self.path.startswith("/progress.json"):
                    body, ctype = json.dumps(prog.snapshot(), ensure_ascii=False).encode(), "application/json"
                else:
                    body, ctype = PAGE.encode(), "text/html; charset=utf-8"
                self.send_response(200)
                self.send_header("Content-Type", ctype)
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
                self.wfile.write(body)

        try:
            srv = ThreadingHTTPServer(("127.0.0.1", 0), H)
        except OSError:
            return
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        self.url = f"http://127.0.0.1:{srv.server_address[1]}/"
        print(f"Progress page: {self.url}", flush=True)
        if open_browser and sys.platform == "darwin":
            subprocess.Popen(["open", self.url])
