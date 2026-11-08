#!/usr/bin/env python3
"""Synthesize the small UI sound effects with ffmpeg -> assets/sfx + public/sfx."""
import shutil, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SFX = {
    # name: (lavfi source, extra filters)
    "pop": ("aevalsrc='0.7*sin(2*PI*(380+1500*t)*t)*exp(-t*34)':d=0.18:s=44100:c=mono", ""),
    "tick": ("aevalsrc='0.55*sin(2*PI*2400*t)*exp(-t*150)':d=0.06:s=44100:c=mono", ""),
    "ding": ("aevalsrc='0.45*(sin(2*PI*1318*t)+0.5*sin(2*PI*1975*t))*exp(-t*8)':d=0.7:s=44100:c=mono", ""),
    "buzz": ("aevalsrc='0.4*(2*mod(120*t,1)-1)*exp(-t*9)':d=0.4:s=44100:c=mono", "lowpass=f=1400"),
    "boop": ("aevalsrc='0.6*sin(2*PI*(520-380*t)*t)*exp(-t*14)':d=0.25:s=44100:c=mono", ""),
    # channel sting: C5-E5-G5-C6 rising bell arpeggio
    "sting": ("aevalsrc='0.34*(sin(2*PI*523.25*t)*exp(-t*5)*gte(t,0)"
              "+sin(2*PI*659.25*(t-0.12))*exp(-(t-0.12)*5)*gte(t,0.12)"
              "+sin(2*PI*783.99*(t-0.24))*exp(-(t-0.24)*4.5)*gte(t,0.24)"
              "+0.6*sin(2*PI*1046.5*(t-0.36))*exp(-(t-0.36)*3.5)*gte(t,0.36))':d=1.8:s=44100:c=mono", ""),
    "whoosh": ("anoisesrc=d=0.55:c=pink:a=0.5:r=44100",
               "bandpass=f=1500:w=2.2,afade=t=in:d=0.22,afade=t=out:st=0.2:d=0.35,volume=5"),
}

for d in (ROOT / "assets" / "sfx", ROOT / "public" / "sfx"):
    d.mkdir(parents=True, exist_ok=True)
for name, (src, flt) in SFX.items():
    out = ROOT / "assets" / "sfx" / f"{name}.wav"
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", src]
    if flt:
        cmd += ["-af", flt]
    subprocess.run(cmd + ["-ar", "44100", "-ac", "1", str(out)], check=True)
    shutil.copy(out, ROOT / "public" / "sfx" / f"{name}.wav")
    print("sfx", name)
