# Rà soát bản quyền & giấy phép

> Đây là bản rà soát kỹ thuật của người tạo dự án, **không phải tư vấn pháp lý**. Trước khi kiếm tiền hoặc đăng công khai
> số lượng lớn, hãy đọc lại điều khoản gốc của từng thành phần (liên kết bên dưới).
> Cập nhật: 2026-10-10.

## Tóm tắt rủi ro

| Mức | Hạng mục | Hành động |
|---|---|---|
| Trung bình | Giọng "Khang Mix" (giọng của bạn pha preset Hải Đăng) | Phần giọng của bạn an toàn; phần pha thừa hưởng điều kiện của preset VieNeu (dòng dưới). Đã bỏ các giọng clone từ file ElevenLabs |
| Trung bình | Giọng preset VieNeu (Hải Đăng, Ngọc Huyền, Thùy Dung) | Mã/model là Apache-2.0, nhưng nguồn dữ liệu giọng gốc do tác giả VieNeu công bố; xem mục "Giọng đọc" |
| Thấp | Nhạc nền sinh bằng ACE-Step | Model MIT; không bảo đảm tuyệt đối với Content ID |
| Thấp | Logo thương hiệu (Go, Docker...) | Nhãn hiệu của chủ sở hữu; chỉ dùng để nhắc đến họ |
| Rất thấp | Icon, mascot, theme, SFX, kịch bản | Tự tạo mới trong dự án |

## Thành phần

### Phần mềm
| Thành phần | Giấy phép | Ghi chú |
|---|---|---|
| Remotion | Giấy phép riêng của Remotion | Miễn phí cho cá nhân và công ty rất nhỏ; công ty lớn hơn cần giấy phép trả phí: https://www.remotion.dev/license |
| VieNeu-TTS (mã và model v3 Turbo) | Apache-2.0 | Đã kiểm tra trên Hugging Face |
| ACE-Step 1.5 (mã và model) | MIT | Đã kiểm tra trên Hugging Face |
| simple-icons | CC0-1.0 (dữ liệu) | Logo vẫn là nhãn hiệu của chủ sở hữu |
| ffmpeg, Node, uv, Python | LGPL/GPL, MIT... | Công cụ; không ràng buộc nội dung đầu ra |

### Font chữ (chỉ dùng font mã nguồn mở SIL OFL 1.1, cho phép dùng thương mại và nhúng vào video)
**Mali** (chữ thương hiệu và toàn bộ chữ trong video, theme `spectrum`), JetBrains Mono (bảng, code); các font tùy chọn khác trong theme/`channel.font`: Quicksand, Nunito, Comfortaa, Varela Round, Grandstander, Pangolin, Barlow, Space Grotesk, Baloo 2, Be Vietnam Pro, Patrick Hand, Lexend.
Không còn dùng font hệ thống của Apple (SF, Menlo, Helvetica) trong các theme.

### Hình ảnh và âm thanh tự tạo
| Hạng mục | Nguồn |
|---|---|
| 31 icon (nét), bộ pixel 12×12 | Vẽ trong dự án (`src/icons.tsx`) |
| 6 mascot (Bít, Miu, Cú, Giọt, Pix, Bóng) và avatar kênh (Bít "Eureka" + bóng đèn) | Thiết kế gốc (`src/mascot.tsx`, `src/Avatar.tsx`) |
| 9 theme (gồm `spectrum`) | Bảng màu và bố cục tự thiết kế (`src/theme.ts`) |
| Hiệu ứng âm thanh | Tổng hợp bằng ffmpeg (`scripts/make_sfx.py`) |
| Nhạc nền | Sinh bằng ACE-Step từ mô tả văn bản (`assets/music/`) |

### Giọng đọc
- **VieNeu preset**: dùng được theo giấy phép Apache-2.0 của model. Tôi **không xác minh được** giọng gốc dùng để huấn luyện từng preset đến từ đâu.
- **Giọng clone từ file ElevenLabs** (từng thử, đã loại khỏi dự án): clone từ giọng thư viện của người khác có thể vi phạm điều khoản và quyền của chủ giọng; không dùng lại.
- **Khang Mix**: pha embedding giọng của bạn với preset Hải Đăng và dùng mã đọc của preset; nguồn gốc giọng preset chưa xác minh được, nên nếu cần an toàn tuyệt đối hãy dùng giọng "Khang" thuần.
- **Giọng của chính bạn**: an toàn nhất.

### Nội dung tham khảo
Phong cách hình ảnh được tham khảo ở cấp độ ý tưởng (kể chuyện bằng một sơ đồ dựng dần); không dùng lại đồ họa, icon, màu, bố cục, font gốc hay nội dung của video tham chiếu. Video tham chiếu đã tải về chỉ để phân tích và đã được xóa.


## Thư viện icon (`assets/library/`)
Tải từ Iconify bằng `./make-video assets sync`; chỉ nhận MIT / Apache-2.0 / CC0 / BSD / ISC. Danh sách bộ, tác giả và giấy phép
nằm ở `assets/library/ATTRIBUTION.md` (tạo tự động). Logo thương hiệu (bộ `logos`) vẫn là nhãn hiệu của chủ sở hữu: dùng để *nhắc đến*
công nghệ, không dùng như dấu hiệu tài trợ/chứng thực.
