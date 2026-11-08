#!/usr/bin/env python3
"""Generate one instrumental track with ACE-Step. Run under tools/acestep venv.
Usage: gen_music.py --caption "..." --duration 120 --seed 7 --out path.wav"""
import argparse, os, sys, shutil, tempfile
ROOT = "/Users/khang/generate-video/tools/acestep"
sys.path.insert(0, ROOT)
os.chdir(ROOT)

ap = argparse.ArgumentParser()
ap.add_argument("--caption", required=True)
ap.add_argument("--duration", type=int, required=True)
ap.add_argument("--seed", type=int, default=7)
ap.add_argument("--out", required=True)
a = ap.parse_args()

from acestep.handler import AceStepHandler
from acestep.llm_inference import LLMHandler
from acestep.inference import GenerationParams, GenerationConfig, generate_music

dit = AceStepHandler()
msg, ok = dit.initialize_service(project_root=ROOT, config_path="acestep-v15-turbo",
                                 device="auto", offload_to_cpu=False)
if not ok:
    sys.exit(f"DiT init failed: {msg}")
tmp = tempfile.mkdtemp()
res = generate_music(
    dit, LLMHandler(),
    params=GenerationParams(task_type="text2music", thinking=False, caption=a.caption,
                            lyrics="[Instrumental]", instrumental=True, duration=a.duration,
                            inference_steps=8, guidance_scale=1.0, seed=a.seed),
    config=GenerationConfig(batch_size=1, audio_format="wav"), save_dir=tmp)
if not res.success:
    sys.exit(f"generation failed: {res.status_message}")
shutil.move(res.audios[0]["path"], a.out)
print("OK", a.out)
