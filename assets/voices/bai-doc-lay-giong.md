# Bài đọc lấy giọng (~10 phút)

**Cách đọc:** đọc như đang kể chuyện cho một người bạn, không đọc diễn văn. Giữ tốc độ vừa phải, ngắt nghỉ tự nhiên ở dấu chấm và dấu phẩy.
Nếu đọc vấp, cứ dừng một nhịp rồi đọc lại câu đó, không cần thu lại từ đầu. Các dòng bắt đầu bằng `##` là tiêu đề phần, **không đọc**; nghỉ khoảng 3 giây giữa các phần.

---

## Phần 1. Một buổi sáng của người lập trình viên

Sáng nay tôi thức dậy lúc sáu giờ rưỡi, pha một ly cà phê, rồi mở máy tính lên như mọi ngày. Việc đầu tiên không phải là viết code, mà là đọc lại những gì mình đã làm hôm qua. Thói quen nhỏ này giúp tôi tiết kiệm rất nhiều thời gian.

Bạn có bao giờ mở một dự án cũ và tự hỏi: ai đã viết đoạn code này vậy? Rồi nhìn vào lịch sử commit, và nhận ra người đó chính là mình ba tháng trước. Chuyện này xảy ra thường xuyên hơn bạn nghĩ.

Vì vậy, tôi luôn cố viết code sao cho người khác đọc là hiểu. Đặt tên biến rõ ràng, chia hàm nhỏ, và thêm vài dòng ghi chú ở những chỗ khó. Không cần quá nhiều, chỉ cần đủ để tương lai của mình không phải chửi rủa quá khứ.

Hôm nay tôi có ba việc cần làm. Thứ nhất, sửa một lỗi nhỏ ở trang đăng nhập. Thứ hai, viết thêm kiểm thử cho phần thanh toán. Và thứ ba, ghi lại một video ngắn để giải thích một khái niệm mà nhiều người hay nhầm lẫn.

Nghe thì đơn giản, nhưng thực tế luôn có những bất ngờ. Một lỗi tưởng chừng chỉ mất mười phút có thể ngốn cả buổi chiều. Đó là lý do tôi không bao giờ hứa chắc chắn khi ai đó hỏi: bao lâu thì xong?

## Phần 2. API là gì, nói cho dễ hiểu

Hãy thử tưởng tượng bạn bước vào một nhà hàng. Bạn không vào thẳng bếp để tự nấu món ăn. Bạn ngồi xuống, gọi món, và người phục vụ mang yêu cầu của bạn vào bếp. Một lúc sau, họ bưng món ăn ra cho bạn.

API hoạt động giống hệt như người phục vụ đó. Ứng dụng của bạn gửi một yêu cầu, API chuyển yêu cầu đến máy chủ, và máy chủ trả về kết quả. Bạn không cần biết bên trong bếp được tổ chức thế nào, chỉ cần biết cách gọi món cho đúng.

Khi nói về REST API, chúng ta thường nhắc đến bốn động từ quen thuộc. GET để lấy dữ liệu. POST để tạo dữ liệu mới. PUT để cập nhật. Và DELETE để xóa.

Dữ liệu trả về thường ở dạng JSON, một định dạng văn bản đơn giản, dễ đọc cho cả người lẫn máy. Ví dụ, một người dùng có thể được mô tả bằng tên, tuổi, và địa chỉ email.

Có một điều quan trọng mà nhiều người mới học thường bỏ qua: mã trạng thái. Hai trăm nghĩa là thành công. Bốn trăm linh bốn nghĩa là không tìm thấy. Năm trăm nghĩa là máy chủ đã gặp sự cố. Chỉ cần nhớ ba con số này, bạn đã hiểu được phần lớn những gì xảy ra khi một ứng dụng bị lỗi.

## Phần 3. Chuyện chạy song song

Bây giờ hãy nói về một chủ đề thú vị hơn: làm nhiều việc cùng một lúc.

Giả sử chương trình của bạn cần lấy dữ liệu từ ba dịch vụ khác nhau. Mỗi dịch vụ mất khoảng hai trăm mili giây để phản hồi. Nếu bạn gọi lần lượt từng cái, tổng thời gian sẽ là sáu trăm mili giây. Nghe có vẻ không nhiều, nhưng với hàng nghìn người dùng cùng lúc, con số đó nhanh chóng trở thành vấn đề lớn.

Còn nếu ba lời gọi chạy song song thì sao? Tổng thời gian chỉ còn khoảng hai trăm mili giây. Nhanh hơn gấp ba lần, mà bạn gần như không phải làm thêm gì nhiều.

Trong ngôn ngữ Go, điều này được thực hiện bằng goroutine. Bạn chỉ cần thêm từ khóa go phía trước một lời gọi hàm. Vậy thôi! Một goroutine rất nhẹ, chỉ tốn khoảng hai kilobyte bộ nhớ lúc khởi tạo, nên bạn có thể tạo ra hàng chục nghìn cái mà máy tính vẫn thở bình thường.

Tuy nhiên, đừng vội mừng. Khi nhiều thứ chạy cùng lúc, những vấn đề mới sẽ xuất hiện. Chúng có thể tranh nhau cùng một dữ liệu, hoặc chờ đợi lẫn nhau mãi mãi. Những lỗi kiểu này rất khó tìm, vì chúng không phải lúc nào cũng xảy ra.

Đó là lý do người ta tạo ra channel, một cách để các goroutine trao đổi dữ liệu với nhau một cách an toàn. Thay vì cùng chia sẻ một vùng nhớ, chúng gửi và nhận thông điệp. Nghe đơn giản, nhưng đây là một trong những ý tưởng đẹp nhất của ngôn ngữ này.

## Phần 4. Bộ nhớ đệm và cái giá của sự nhanh

Có một câu nói nổi tiếng trong giới lập trình: chỉ có hai việc thực sự khó, đó là đặt tên và vô hiệu hóa bộ nhớ đệm.

Bộ nhớ đệm, hay cache, là nơi lưu tạm những dữ liệu hay được dùng, để lần sau lấy ra nhanh hơn. Hãy hình dung bạn để chai nước ngay trên bàn làm việc thay vì mỗi lần khát lại phải xuống tầng một. Rõ ràng là tiện hơn nhiều.

Nhưng sự tiện lợi luôn đi kèm cái giá. Nếu dữ liệu gốc đã thay đổi mà bộ nhớ đệm vẫn giữ bản cũ, người dùng sẽ nhìn thấy thông tin sai. Bạn đã bao giờ cập nhật ảnh đại diện, nhưng mãi mà trang web vẫn hiện ảnh cũ chưa? Rất có thể đó chính là cache.

Vậy làm thế nào để cân bằng? Cách phổ biến nhất là đặt thời gian sống cho dữ liệu. Ví dụ, sau năm phút, bản lưu tạm sẽ tự hết hạn và hệ thống sẽ lấy dữ liệu mới. Đơn giản, nhưng hiệu quả.

Một công cụ rất phổ biến cho việc này là Redis. Nó lưu dữ liệu ngay trong bộ nhớ, nên tốc độ đọc ghi cực kỳ nhanh, thường chỉ tính bằng phần nghìn giây. Rất nhiều hệ thống lớn trên thế giới đang dùng nó mỗi ngày.

## Phần 5. Container, và vì sao ai cũng nhắc đến Docker

Chắc hẳn bạn đã từng nghe câu này: trên máy tôi chạy được mà. Đây có lẽ là câu nói gây đau đầu nhất trong lịch sử phát triển phần mềm.

Một chương trình chạy tốt trên máy của bạn, nhưng khi đưa sang máy chủ thì lỗi tung tóe. Nguyên nhân thường là phiên bản thư viện khác nhau, cấu hình khác nhau, hoặc hệ điều hành khác nhau.

Container giải quyết vấn đề này bằng một ý tưởng khá thông minh: đóng gói chương trình cùng với mọi thứ nó cần để chạy vào một chiếc hộp. Dù chiếc hộp đó được mang đến đâu, bên trong vẫn y như cũ.

Docker là công cụ phổ biến nhất để làm điều này. Bạn viết một tệp mô tả, gọi là Dockerfile, rồi dùng nó để tạo ra một image. Từ image đó, bạn có thể khởi chạy bao nhiêu container tùy thích.

Khi hệ thống lớn dần lên, bạn sẽ cần quản lý hàng trăm container cùng lúc. Lúc này, Kubernetes xuất hiện như một người điều phối, quyết định container nào chạy ở máy nào, và tự khởi động lại khi có cái gặp sự cố.

## Phần 6. Bảo mật, thứ luôn bị nhớ ra muộn nhất

Nói thật lòng, bảo mật là phần mà hầu hết chúng ta chỉ nghĩ đến khi sự cố đã xảy ra. Đừng để mình rơi vào tình huống đó.

Quy tắc đầu tiên: không bao giờ tin dữ liệu người dùng gửi lên. Bất kỳ thứ gì đến từ bên ngoài, dù là một ô tìm kiếm hay một tệp tải lên, đều cần được kiểm tra cẩn thận.

Quy tắc thứ hai: không lưu mật khẩu dưới dạng văn bản thường. Hãy băm chúng bằng một thuật toán phù hợp, và thêm muối để mỗi mật khẩu có một giá trị băm riêng.

Quy tắc thứ ba, và cũng là quy tắc tôi thấy nhiều người vi phạm nhất: đừng đưa khóa bí mật vào kho mã nguồn. Chỉ một phút sơ ý đẩy lên GitHub, và các công cụ quét tự động có thể tìm thấy nó chỉ sau vài giây.

Khi nói về xác thực, bạn sẽ gặp những khái niệm như token, OAuth, hay JWT. Chúng nghe có vẻ phức tạp, nhưng ý tưởng cốt lõi rất đơn giản: thay vì gửi mật khẩu mỗi lần, bạn nhận một chiếc vé có thời hạn, và dùng chiếc vé đó để chứng minh mình là ai.

## Phần 7. Lời khuyên cho người mới bắt đầu

Cuối cùng, nếu bạn đang ở những bước đầu tiên của con đường này, tôi có vài lời khuyên.

Đừng cố học mọi thứ cùng lúc. Chọn một ngôn ngữ, một dự án nhỏ, rồi làm cho đến khi nó chạy được. Cảm giác nhìn thấy sản phẩm của chính mình hoạt động là động lực tuyệt vời nhất.

Đừng sợ lỗi. Thật ra, mỗi lỗi bạn gặp phải và tự sửa được đều là một bài học mà không cuốn sách nào có thể dạy thay. Người giỏi không phải là người không bao giờ mắc lỗi, mà là người biết cách tìm ra nguyên nhân nhanh hơn.

Hãy đọc code của người khác. Mở mã nguồn của những dự án nổi tiếng, xem họ tổ chức thư mục ra sao, đặt tên thế nào, xử lý lỗi kiểu gì. Bạn sẽ học được rất nhiều điều mà không giáo trình nào đề cập.

Và quan trọng nhất, hãy kiên nhẫn với bản thân. Ai cũng từng không hiểu con trỏ là gì, từng loay hoay cả ngày vì thiếu một dấu ngoặc. Điều đó hoàn toàn bình thường.

Cảm ơn bạn đã lắng nghe đến tận đây. Hy vọng những chia sẻ hôm nay giúp ích được cho bạn, dù chỉ một chút. Hẹn gặp lại bạn trong những video tiếp theo!
