# Deploy lên Render

1. Đưa mã nguồn lên GitHub. Không đưa `.env`, `private/`, `artifacts/` hoặc `node_modules/` lên Git; `.gitignore` đã loại các mục này.
2. Trên Render chọn **New → Blueprint**, kết nối repository rồi dùng `render.yaml`.
3. Điền các giá trị bí mật được hỏi:
   - `GEMINI_API_KEY`: khóa thật từ Google AI Studio, dùng cho tạo nội dung và phản hồi bài làm.
   - `INITIAL_ADMIN_PASSWORD`: mật khẩu quản trị do bạn chọn, ít nhất 12 ký tự.
4. Deploy rồi mở URL HTTPS Render cấp. Đăng nhập bằng `quantri` và mật khẩu vừa đặt. Trong trang quản trị, tạo học sinh, giáo viên, phụ huynh và liên kết học sinh với giáo viên/phụ huynh.
5. Đăng nhập giáo viên → Kho bài học → Soạn công thức & bài luyện tập. Nhập yêu cầu, tạo bản nháp AI, kiểm tra và duyệt đăng.

Blueprint dùng dịch vụ **Starter trả phí** và Persistent Disk 1 GB (có phí lưu trữ). Kiểm tra giá Render hiển thị trước khi tạo. Không dùng ổ đĩa tạm của dịch vụ miễn phí để giữ dữ liệu thật. App dùng một tiến trình/một instance; chưa hỗ trợ chia sẻ cơ sở dữ liệu giữa nhiều instance.

Nếu tạo Web Service thủ công: build `npm ci --omit=dev`, start `npm run start:render`, health check `/api/status`. Thêm disk tại `/var/data`, đặt `MATH_DB_PATH=/var/data/math-lab/accounts.json`, `HOST=0.0.0.0`, `COOKIE_SECURE=true`, `NODE_ENV=production`, `GEMINI_MODEL=gemini-2.5-flash` và hai biến bí mật ở trên. Để Render tự cấp `PORT`.

Tài khoản quản trị chỉ được tạo khi cơ sở dữ liệu trống; redeploy không đặt lại mật khẩu hoặc xóa dữ liệu. Sau lần chạy đầu, có thể bỏ `INITIAL_ADMIN_PASSWORD` khỏi Environment. Mỗi lần restart cần đăng nhập lại vì phiên đăng nhập lưu trong bộ nhớ.

## Dữ liệu demo đang ở máy local

Repo đã kèm bản khởi tạo `deploy-seed/accounts.json`: 4 tài khoản, 20 bài học đã nạp và 10 lượt làm bài hiện tại. Mật khẩu, salt và hash local đã được loại bỏ. Bản này vẫn chứa hồ sơ và tiến độ học tập; người có quyền đọc repo cũng đọc được dữ liệu đó.

Lần đầu chạy khi chưa có file cơ sở dữ liệu, app tự nạp bản khởi tạo vào Persistent Disk. ID, liên kết vai trò và tiến độ được giữ nguyên. Mật khẩu quản trị lấy từ `INITIAL_ADMIN_PASSWORD`; các vai trò khác có mật khẩu ngẫu nhiên mới. Trong **Render → Shell**, chạy `cat /var/data/math-lab/initial-credentials.json` để xem thông tin đăng nhập và lưu riêng. Không đưa file này lên Git. Mật khẩu local cũ không dùng trên Render.

Nếu cơ sở dữ liệu đã tồn tại, app tuyệt đối không nạp đè bản khởi tạo. Redeploy giữ nguyên dữ liệu đang có trên disk. Các thay đổi local sau bản snapshot này không tự đồng bộ lên Render.

## Kiểm tra sau deploy

- `/api/status` trả `ai: true` khi đã đặt khóa; đây chỉ là kiểm tra có cấu hình, chưa xác nhận khóa hợp lệ.
- Tạo một bản nháp từ tài khoản giáo viên để xác nhận Gemini gọi được. Nếu thất bại, kiểm tra khóa, model, hạn mức và quyền API trong Google AI Studio.
- Đăng một nội dung thử, restart dịch vụ rồi kiểm tra nội dung còn nguyên.
- Không gửi khóa vào chat hoặc đặt khóa trong JavaScript phía trình duyệt.
