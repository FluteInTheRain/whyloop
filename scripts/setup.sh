#!/usr/bin/env bash
# Reinstall everything that is not stored in git (third-party tools, models are downloaded on first use).
set -euo pipefail
cd "$(dirname "$0")/.."
command -v uv >/dev/null   || { echo "Cần cài uv: https://docs.astral.sh/uv/"; exit 1; }
command -v node >/dev/null || { echo "Cần cài Node.js"; exit 1; }
command -v ffmpeg >/dev/null || { echo "Cần cài ffmpeg (brew install ffmpeg)"; exit 1; }
mkdir -p tools
if [ ! -d tools/vieneu ]; then git clone https://github.com/pnnbao97/VieNeu-TTS tools/vieneu; fi
git -C tools/vieneu checkout 85344322b7258b4e25479b692e8e3396baf9db34
(cd tools/vieneu && uv sync)
if [ ! -d tools/acestep ]; then git clone https://github.com/ace-step/ACE-Step-1.5 tools/acestep; fi
git -C tools/acestep checkout ca1e85fe9430179831e6bc6be790c332190a3866
(cd tools/acestep && uv sync)
# English voice (Kokoro-82M, Apache-2.0): own venv, model downloaded on first use; needs espeak-ng
command -v espeak-ng >/dev/null || echo "Gợi ý: brew install espeak-ng (cần cho giọng tiếng Anh)"
uv venv tools/kokoro/.venv -q
uv pip install -q --python tools/kokoro/.venv/bin/python kokoro-onnx soundfile
npm install
python3 scripts/make_sfx.py
echo "Xong. Việc tiếp theo:"
echo "  1) Đăng ký giọng của bạn:  ./make-video voice add <file-audio> --name \"Khang\""
echo "  2) Sinh nhạc nền (assets/music/lofi_chill.wav, minimal_techno.wav) bằng scripts/gen_music.py"
echo "  3) Dựng intro/outro:       ./make-video brand build"
