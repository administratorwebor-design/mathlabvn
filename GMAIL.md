# Gửi thông báo phụ huynh bằng Gmail

## Cấu hình

1. Chọn Gmail dùng chung để gửi thông báo. Bật **Xác minh 2 bước** trong tài khoản Google.
2. Mở https://myaccount.google.com/apppasswords và tạo mật khẩu ứng dụng cho Math Lab. Nếu Google không cung cấp mục này, kiểm tra chính sách tài khoản Google Workspace hoặc dùng một tài khoản hỗ trợ mật khẩu ứng dụng.
3. Máy local: thêm vào `.env` (không commit). Render: mở **Environment**, thêm các biến sau rồi khởi động lại/deploy:

```dotenv
GMAIL_USER=dia-chi-gui@gmail.com
GMAIL_APP_PASSWORD=mat-khau-ung-dung-16-ky-tu
GMAIL_FROM_NAME=Math Lab
```

Dùng mật khẩu ứng dụng 16 ký tự, không dùng mật khẩu đăng nhập Google. Có thể dán cả khoảng trắng mà Google hiển thị. Không gửi mật khẩu vào chat hoặc đưa vào mã nguồn. Máy chủ kết nối `smtp.gmail.com:465` bằng TLS; môi trường chạy phải cho phép cổng SMTP này. Dự án cấu hình Render Starter; các gói chặn SMTP cần đổi môi trường hoặc phương thức gửi.

## Sử dụng

Giáo viên vào **Thông báo phụ huynh**, chọn lớp hoặc một học sinh, nhập tiêu đề/lời nhắn, tùy chọn kèm kết quả hiện tại → **Xem trước** → kiểm tra địa chỉ và từng nội dung → **Xác nhận gửi**.

Email phụ huynh lấy từ tài khoản đã liên kết qua chức năng nhập Excel. Tài khoản cũ chưa có email: quản trị vào **Quản lý tài khoản → Email phụ huynh và khôi phục tài khoản**, chọn phụ huynh và lưu địa chỉ chính xác. App liệt kê học sinh thiếu địa chỉ; không tự đoán email. Hai con có cùng email phụ huynh được gộp vào một email trong đợt gửi; không lộ địa chỉ các gia đình khác. Báo cáo chỉ gồm con nằm trong phạm vi đã chọn và được phân công cho giáo viên.

## Trạng thái và giới hạn

- Gửi qua hàng đợi đã lưu trong cơ sở dữ liệu; UI cập nhật lịch sử mỗi 5 giây và có nút làm mới. Giáo viên chỉ xem lịch sử của mình.
- Gmail chấp nhận gửi không có nghĩa là email đã đến hộp thư hoặc phụ huynh đã đọc. Cần kiểm tra thư rác/thư trả lại trong tài khoản gửi nếu có vấn đề.
- Tối đa 200 người nhận mỗi đợt, 300 email/24 giờ cho toàn hệ thống; Gmail vẫn có thể áp dụng hạn mức thấp hơn.
- Gửi lại cùng xác nhận hoặc cùng nội dung/người nhận trong 15 phút trả về đợt cũ. Không tự gửi lại email lỗi hoặc chưa rõ kết quả. Với lỗi từ chối, sửa cấu hình/địa chỉ rồi soạn đợt mới sau 15 phút hoặc đổi nội dung. Với lỗi chưa rõ kết quả, kiểm tra thư đã gửi trước khi tạo đợt mới để tránh trùng thư.
- Khi khởi động lại, các thư chờ đã được giáo viên xác nhận tiếp tục gửi. Thư đang gửi lúc máy chủ dừng được đánh dấu chưa rõ kết quả, không tự gửi lại.
- Dùng một server và ổ dữ liệu bền vững như `render.yaml`. Không chạy nhiều tiến trình trên cùng file dữ liệu/hàng đợi.
- Không gửi mật khẩu tài khoản học sinh hoặc phụ huynh trong báo cáo.

Kiểm thử dùng bộ gửi giả lập; không gửi thư thật từ script kiểm thử. Cần cấu hình Gmail thật để kiểm tra giao thư đầu cuối.
