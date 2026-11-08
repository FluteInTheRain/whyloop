"""Upload an episode to YouTube with the YouTube Data API v3 (OAuth, installed-app flow).

  ./make-video youtube auth                       one-time browser consent (interactive: run it yourself with `!`)
  ./make-video youtube status                     who am I? (must be the channel in config.json -> channel.youtube_channel_id)
  ./make-video youtube upload <episode> [--privacy private|unlisted|public] [--publish-at 2026-10-20T09:00:00+07:00]
                                        [--dry-run] [--force]
  ./make-video youtube resume <episode>           redo the steps after the upload (thumbnail, captions, playlist)
  ./make-video youtube public <episode>           make an uploaded video public (see the note on unverified API projects)
  ./make-video youtube captions <episode> [--lang vi]   replace the caption track(s) of an uploaded video with the files in youtube.json
  ./make-video youtube delete <video_id> --yes    permanently delete a video of the channel (cannot be undone)

Bilingual episodes: youtube.json has language (main language of title/description/audio), captions as {lang: file} and
localizations {lang: {title, description_file}}. The extra audio track cannot be uploaded through the API (the v3 client
has no audioTracks resource): add it by hand in YouTube Studio -> Subtitles -> Add language -> Audio.

Files (never committed): ~/.config/whyloop/youtube_client_secret.json (OAuth client, Desktop app) and
~/.config/whyloop/youtube_token.json (created by `auth`). Episode metadata: <episode>/youtube.json.
"""
import argparse, json, re, sys
from datetime import date, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONF = Path.home() / ".config" / "whyloop"
SECRET = CONF / "youtube_client_secret.json"
TOKEN = CONF / "youtube_token.json"
SCOPES = ["https://www.googleapis.com/auth/youtube", "https://www.googleapis.com/auth/youtube.force-ssl",
          "https://www.googleapis.com/auth/youtube.upload"]


def die(msg):
    sys.exit(msg)


def config():
    return json.loads((ROOT / "config.json").read_text())


def episode(arg):
    d = Path(arg)
    d = d if d.is_dir() else d.parent
    if not (d / "episode.json").exists():
        die(f"Không phải thư mục tập (thiếu episode.json): {arg}")
    return d, json.loads((d / "episode.json").read_text())


def save_episode(d, ep):
    (d / "episode.json").write_text(json.dumps(ep, ensure_ascii=False, indent=2) + "\n")


# ---------- metadata ----------
CAPTION_NAMES = {"vi": "Tiếng Việt", "en": "English"}


def caption_files(m):
    """youtube.json captions: a file name (legacy, in the main language) or {lang: file}."""
    c = m.get("captions")
    if not c:
        return {}
    return c if isinstance(c, dict) else {m.get("language", "vi"): c}


def build_request(d, ep, privacy=None, publish_at=None):
    mj = d / "youtube.json"
    if not mj.exists():
        die(f"Thiếu {mj}")
    m = json.loads(mj.read_text())
    desc = (d / m.get("description_file", "description.md")).read_text().strip()
    problems = []
    def check_text(tag, title, text):
        if len(title) > 100:
            problems.append(f"{tag}: tiêu đề {len(title)} ký tự (tối đa 100)")
        if len(text.encode()) > 5000:
            problems.append(f"{tag}: mô tả {len(text.encode())} byte (tối đa 5000)")
        if "<" in text or ">" in text or "<" in title or ">" in title:
            problems.append(f"{tag}: tiêu đề/mô tả chứa < hoặc > (YouTube không cho phép)")
    check_text(m.get("language", "vi"), m["title"], desc)
    localizations = {}
    for lg, loc in (m.get("localizations") or {}).items():
        ldesc = (d / loc["description_file"]).read_text().strip()
        check_text(lg, loc["title"], ldesc)
        localizations[lg] = {"title": loc["title"], "description": ldesc}
    tags = m.get("tags", [])
    if sum(len(t) + 1 for t in tags) > 480:
        problems.append("tổng độ dài thẻ vượt ~500 ký tự")
    video = ROOT / ep["render"]["file"] if ep.get("render") else None
    if not video or not video.exists():
        problems.append(f"không thấy file video: {video}")
    caps = caption_files(m)
    for key, f in [("thumbnail", m.get("thumbnail"))] + [(f"captions.{lg}", f) for lg, f in caps.items()]:
        if f and not (d / f).exists():
            problems.append(f"không thấy {key}: {f}")
    if ep.get("render", {}).get("stale"):
        problems.append("video đã lỗi thời so với kịch bản (render.stale): hãy dựng lại")
    priv = privacy or m.get("privacy", "private")
    body = {
        "snippet": {"title": m["title"], "description": desc, "tags": tags, "categoryId": str(m.get("category_id", "27")),
                    "defaultLanguage": m.get("language", "vi"), "defaultAudioLanguage": m.get("language", "vi")},
        "status": {"privacyStatus": "private" if publish_at else priv, "selfDeclaredMadeForKids": bool(m.get("made_for_kids", False)),
                   "embeddable": True, "publicStatsViewable": True, "license": "youtube"},
    }
    if localizations:
        body["localizations"] = localizations
    if publish_at:
        body["status"]["publishAt"] = publish_at
    if m.get("contains_synthetic_media") is not None:
        body["status"]["containsSyntheticMedia"] = bool(m["contains_synthetic_media"])
    return m, body, video, problems


# ---------- API plumbing ----------
def service():
    try:
        from google.auth.transport.requests import Request
        from google.oauth2.credentials import Credentials
        from googleapiclient.discovery import build
    except ImportError:
        die("Thiếu thư viện Google: chạy qua ./make-video youtube … (tự cài bằng uv)")
    if not TOKEN.exists():
        die("Chưa đăng nhập. Chạy:  ! ./make-video youtube auth   (xem README: Đăng YouTube tự động)")
    creds = Credentials.from_authorized_user_file(str(TOKEN), SCOPES)
    if not creds.valid:
        if creds.refresh_token:
            creds.refresh(Request())
            TOKEN.write_text(creds.to_json())
        else:
            die("Token hết hạn. Chạy lại:  ! ./make-video youtube auth")
    return build("youtube", "v3", credentials=creds, cache_discovery=False)


def cmd_auth(_a):
    from google_auth_oauthlib.flow import InstalledAppFlow
    if not SECRET.exists():
        die(f"Chưa có {SECRET}\nTạo OAuth client (loại Desktop app) trong Google Cloud, tải JSON về và lưu đúng đường dẫn đó.")
    flow = InstalledAppFlow.from_client_secrets_file(str(SECRET), SCOPES)
    creds = flow.run_local_server(port=0, prompt="consent", authorization_prompt_message="Mở trình duyệt để cấp quyền…")
    CONF.mkdir(parents=True, exist_ok=True)
    TOKEN.write_text(creds.to_json())
    TOKEN.chmod(0o600)
    print(f"Đã lưu token: {TOKEN}\nChạy tiếp: ./make-video youtube status")


def channel_info(yt):
    r = yt.channels().list(part="id,snippet", mine=True).execute()
    return r.get("items", [])


def cmd_status(_a):
    yt = service()
    items = channel_info(yt)
    want = config().get("channel", {}).get("youtube_channel_id")
    if not items:
        die("Tài khoản đã cấp quyền không có kênh YouTube. Khi đăng nhập hãy chọn đúng kênh (Brand Account).")
    for c in items:
        ok = "ĐÚNG kênh trong config" if c["id"] == want else f"KHÁC kênh trong config ({want})"
        print(f"Kênh: {c['snippet']['title']}  ({c['id']})  → {ok}")


def need_right_channel(yt):
    want = config().get("channel", {}).get("youtube_channel_id")
    ids = [c["id"] for c in channel_info(yt)]
    if want and want not in ids:
        die(f"Đang đăng nhập kênh {ids}, không phải kênh trong config ({want}). Chạy lại auth và chọn đúng kênh.")


def ensure_playlist(yt, title, privacy="public"):
    if re.fullmatch(r"PL[\w-]{8,}", title):  # an existing playlist id: use as is
        if not yt.playlists().list(part="id", id=title).execute().get("items"):
            die(f"Không thấy danh sách phát {title} trên kênh đang đăng nhập.")
        return title
    page = None
    while True:
        r = yt.playlists().list(part="id,snippet", mine=True, maxResults=50, pageToken=page).execute()
        for p in r.get("items", []):
            if p["snippet"]["title"] == title:
                return p["id"]
        page = r.get("nextPageToken")
        if not page:
            break
    r = yt.playlists().insert(part="snippet,status", body={"snippet": {"title": title, "defaultLanguage": "vi",
                              "description": "Series Machine Learning theo giáo trình ISLR, kênh WhyLoop."},
                              "status": {"privacyStatus": privacy}}).execute()
    return r["id"]


def finish(yt, d, ep, m, vid):
    """Steps after the upload; each one is independent so a failure leaves a note instead of losing the video."""
    from googleapiclient.http import MediaFileUpload
    done = ep.setdefault("youtube", {}).setdefault("steps", {})
    if m.get("thumbnail") and not done.get("thumbnail"):
        try:
            yt.thumbnails().set(videoId=vid, media_body=MediaFileUpload(str(d / m["thumbnail"]))).execute()
            done["thumbnail"] = True
            print("✓ thumbnail")
        except Exception as e:  # noqa: BLE001
            print(f"✗ thumbnail: {e}\n  (kênh cần được xác minh số điện thoại để dùng thumbnail tùy chỉnh)")
    caps_done = done.setdefault("captions", {}) if isinstance(done.get("captions"), (dict, type(None))) else {}
    for lg, f in caption_files(m).items():
        if caps_done.get(lg):
            continue
        try:
            yt.captions().insert(part="snippet", body={"snippet": {"videoId": vid, "language": lg,
                                 "name": CAPTION_NAMES.get(lg, lg), "isDraft": False}},
                                 media_body=MediaFileUpload(str(d / f), mimetype="application/octet-stream")).execute()
            caps_done[lg] = True
            print(f"✓ phụ đề {lg}")
        except Exception as e:  # noqa: BLE001
            print(f"✗ phụ đề {lg}: {e}")
    done["captions"] = caps_done
    if m.get("playlist") and not done.get("playlist"):
        try:
            pid = ensure_playlist(yt, m["playlist"])
            yt.playlistItems().insert(part="snippet", body={"snippet": {"playlistId": pid,
                                      "resourceId": {"kind": "youtube#video", "videoId": vid}}}).execute()
            done["playlist"] = pid
            print(f"✓ danh sách phát: {m['playlist']}")
        except Exception as e:  # noqa: BLE001
            print(f"✗ danh sách phát: {e}")
    save_episode(d, ep)


def cmd_upload(a):
    d, ep = episode(a.episode)
    m, body, video, problems = build_request(d, ep, a.privacy, a.publish_at)
    if problems:
        die("Chưa thể đăng:\n  - " + "\n  - ".join(problems))
    if ep.get("youtube", {}).get("video_id") and not a.force:
        die(f"Tập này đã tải lên: {ep['youtube'].get('url')}\n(dùng `resume` để làm nốt các bước, hoặc --force để tải bản mới)")
    if a.dry_run:
        print(json.dumps({"video": str(video), "size_MB": round(video.stat().st_size / 1e6, 1), "body": body,
                          "thumbnail": m.get("thumbnail"), "captions": caption_files(m), "playlist": m.get("playlist")},
                         ensure_ascii=False, indent=2))
        print("\n[dry-run] không gọi API.")
        return
    from googleapiclient.http import MediaFileUpload
    yt = service()
    need_right_channel(yt)
    req = yt.videos().insert(part="snippet,status" + (",localizations" if body.get("localizations") else ""), body=body,
                             media_body=MediaFileUpload(str(video), chunksize=8 * 1024 * 1024, resumable=True))
    resp, last = None, -1
    while resp is None:
        st, resp = req.next_chunk()
        if st and int(st.progress() * 100) != last:
            last = int(st.progress() * 100)
            print(f"  tải lên {last}%", flush=True)
    vid = resp["id"]
    ep["youtube"] = {"video_id": vid, "url": f"https://youtu.be/{vid}", "privacy": body["status"]["privacyStatus"],
                     "uploaded_at": datetime.now().isoformat(timespec="seconds"), "published_at": None, "steps": {}}
    save_episode(d, ep)
    print(f"✓ video: https://youtu.be/{vid}  (chế độ: {body['status']['privacyStatus']})")
    finish(yt, d, ep, m, vid)
    if body["status"]["privacyStatus"] == "public":
        mark_published(d, ep)
    print("Xong. Kiểm tra trong YouTube Studio (video có thể còn đang xử lý).")


def cmd_resume(a):
    d, ep = episode(a.episode)
    vid = ep.get("youtube", {}).get("video_id")
    if not vid:
        die("Tập này chưa được tải lên.")
    m = json.loads((d / "youtube.json").read_text())
    finish(service(), d, ep, m, vid)


def cmd_captions(a):
    from googleapiclient.http import MediaFileUpload
    d, ep = episode(a.episode)
    vid = ep.get("youtube", {}).get("video_id")
    if not vid:
        die("Tập này chưa được tải lên.")
    m = json.loads((d / "youtube.json").read_text())
    files = caption_files(m)
    if a.lang:
        files = {a.lang: files[a.lang]} if a.lang in files else die(f"youtube.json không có phụ đề '{a.lang}'")
    yt = service()
    need_right_channel(yt)
    cur = {c["snippet"]["language"]: c["id"] for c in
           yt.captions().list(part="snippet", videoId=vid).execute().get("items", [])
           if c["snippet"].get("trackKind") == "standard"}
    for lg, f in files.items():
        media = MediaFileUpload(str(d / f), mimetype="application/octet-stream")
        if lg in cur:
            yt.captions().update(part="snippet", body={"id": cur[lg], "snippet": {"isDraft": False}}, media_body=media).execute()
            print(f"✓ đã thay phụ đề {lg} bằng {f}")
        else:
            yt.captions().insert(part="snippet", body={"snippet": {"videoId": vid, "language": lg,
                                 "name": CAPTION_NAMES.get(lg, lg), "isDraft": False}}, media_body=media).execute()
            print(f"✓ đã thêm phụ đề {lg} từ {f}")
        ep.setdefault("youtube", {}).setdefault("steps", {}).setdefault("captions", {})[lg] = True
    save_episode(d, ep)


def cmd_delete(a):
    if not a.yes:
        die("Xóa video là vĩnh viễn. Thêm --yes để xác nhận.")
    yt = service()
    need_right_channel(yt)
    r = yt.videos().list(part="snippet,status", id=a.video_id).execute().get("items", [])
    if not r:
        die(f"Không thấy video {a.video_id} trong kênh này (hoặc đã xóa).")
    print(f"Xóa: {r[0]['snippet']['title']}  ({a.video_id}, {r[0]['status']['privacyStatus']})")
    yt.videos().delete(id=a.video_id).execute()
    print("✓ đã xóa")


def mark_published(d, ep):
    ep["status"] = "published"
    ep["youtube"]["published_at"] = date.today().isoformat()
    ep["youtube"]["privacy"] = "public"
    save_episode(d, ep)
    print("✓ đã đánh dấu published trong episode.json (chạy ./make-video catalog để cập nhật catalog.md)")


def cmd_public(a):
    d, ep = episode(a.episode)
    vid = ep.get("youtube", {}).get("video_id")
    if not vid:
        die("Tập này chưa được tải lên.")
    yt = service()
    cur = yt.videos().list(part="status,snippet", id=vid).execute()["items"][0]
    cur["status"]["privacyStatus"] = "public"
    yt.videos().update(part="status", body={"id": vid, "status": cur["status"]}).execute()
    mark_published(d, ep)


def main():
    ap = argparse.ArgumentParser(prog="make-video youtube")
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("auth")
    sub.add_parser("status")
    u = sub.add_parser("upload")
    u.add_argument("episode")
    u.add_argument("--privacy", choices=["private", "unlisted", "public"])
    u.add_argument("--publish-at", help="ISO 8601 with offset; the video is uploaded as private and goes public then")
    u.add_argument("--dry-run", action="store_true")
    u.add_argument("--force", action="store_true")
    cp = sub.add_parser("captions")
    cp.add_argument("episode")
    cp.add_argument("--lang")
    dl = sub.add_parser("delete")
    dl.add_argument("video_id")
    dl.add_argument("--yes", action="store_true")
    for n in ("resume", "public"):
        sub.add_parser(n).add_argument("episode")
    a = ap.parse_args()
    {"auth": cmd_auth, "status": cmd_status, "upload": cmd_upload, "resume": cmd_resume, "public": cmd_public,
     "delete": cmd_delete, "captions": cmd_captions}[a.cmd](a)


if __name__ == "__main__":
    main()
