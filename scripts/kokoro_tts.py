#!/usr/bin/env python3
"""English TTS worker (Kokoro-82M via kokoro-onnx, Apache-2.0). Runs in its own venv: tools/kokoro/.venv.

  python scripts/kokoro_tts.py jobs.json
jobs.json = [{"text": "...", "voice": "am_michael", "out": "path.wav", "speed": 1.0}, ...]
Models are downloaded once into tools/kokoro/models. Needs espeak-ng (brew install espeak-ng).
"""
import json, os, sys, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MODELS = ROOT / "tools" / "kokoro" / "models"
BASE = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/"
FILES = ["kokoro-v1.0.onnx", "voices-v1.0.bin"]
ESPEAK_LIBS = ["/opt/homebrew/lib/libespeak-ng.dylib", "/usr/local/lib/libespeak-ng.dylib",
               "/usr/lib/x86_64-linux-gnu/libespeak-ng.so.1", "/usr/lib/aarch64-linux-gnu/libespeak-ng.so.1"]
ESPEAK_DATA = ["/opt/homebrew/share/espeak-ng-data", "/usr/local/share/espeak-ng-data",
               "/usr/lib/x86_64-linux-gnu/espeak-ng-data", "/usr/lib/aarch64-linux-gnu/espeak-ng-data",
               "/usr/share/espeak-ng-data"]


def first_existing(paths):
    return next((p for p in paths if Path(p).exists()), None)


def main():
    from kokoro_onnx import Kokoro, EspeakConfig
    import soundfile as sf
    MODELS.mkdir(parents=True, exist_ok=True)
    for f in FILES:
        if not (MODELS / f).exists():
            print(f"[kokoro] tải {f}…", flush=True)
            urllib.request.urlretrieve(BASE + f, MODELS / (f + ".part"))
            (MODELS / (f + ".part")).replace(MODELS / f)
    lib = os.environ.get("ESPEAK_LIB") or first_existing(ESPEAK_LIBS)
    data = os.environ.get("ESPEAK_DATA") or first_existing(ESPEAK_DATA)
    if not lib or not data:
        sys.exit("Thiếu espeak-ng: brew install espeak-ng (hoặc đặt ESPEAK_LIB / ESPEAK_DATA)")
    k = Kokoro(str(MODELS / FILES[0]), str(MODELS / FILES[1]), espeak_config=EspeakConfig(lib_path=lib, data_path=data))
    for j in json.loads(Path(sys.argv[1]).read_text()):
        v = j["voice"]
        audio, sr = k.create(j["text"], voice=v, speed=float(j.get("speed", 1.0)),
                             lang="en-gb" if v.startswith("b") else "en-us")
        sf.write(j["out"], audio, sr)


if __name__ == "__main__":
    main()
