# Hồ sơ lỗi và khắc phục

## Học sinh

Khi làm bài, nhập cách làm trước khi xem gợi ý. Đáp án đầu và cách làm được lưu cố định. Máy chủ kiểm tra đáp án số/biểu thức bằng bộ kiểm tra toán học; dữ liệu `initialCorrect` do trình duyệt gửi không quyết định điểm lượt mới.

Nếu sai, bấm **AI phân tích cách làm của em**. AI phải trích đúng đoạn trong cách làm đã nộp, phân loại lỗi và đưa hướng khắc phục. Kết quả là giả thuyết chờ giáo viên xác nhận. Thiếu cách làm thì lưu **Chưa đủ bằng chứng**, không suy diễn từ chủ đề hoặc đáp án cuối.

Menu **Hồ sơ lỗi & khắc phục** có tần suất loại lỗi, bằng chứng, điểm nhiệm vụ, trạng thái kỹ năng, bài luyện đề xuất, phân tích Gemini và bảng trước–sau. Các loại lỗi gồm quy tắc dấu, biến đổi tương đương, tính toán, kiến thức/điều kiện, đọc/mô hình hóa đề, chưa biết bắt đầu và chưa đủ bằng chứng.

## Giáo viên

Menu **Bản đồ lỗi lớp**:

- Tạo nhóm lớp từ học sinh được quản trị phân công, cùng khối trong hồ sơ.
- Xem số học sinh mắc từng loại lỗi, phân bố theo kỹ năng; tách số lượt đã xác nhận và chờ xem xét.
- Bấm tên học sinh để đọc cách làm, yêu cầu AI phân tích, xác nhận/sửa loại lỗi và ghi bằng chứng cùng hướng khắc phục.
- Chọn 1–30 câu cụ thể, giao cho từng học sinh hoặc cả lớp, kèm hạn hoàn thành.
- Xem bảng điểm từng nhiệm vụ hoặc nhờ Gemini phân tích lớp. AI chỉ nhận thống kê với nhãn HS 1, HS 2… thay cho tên; các bài AI chọn được đánh dấu vào bộ câu hỏi để giáo viên xem rồi giao.
- Trong hồ sơ cá nhân, dùng **Giao bài này** để giao bài khắc phục đề xuất, hạn 7 ngày.
- Khi soạn bài luyện ở Kho bài học, có thể đánh dấu loại lỗi mà bài nhắm tới. Các nhãn này dùng để tìm bài khắc phục, không phải bằng chứng học sinh thực sự mắc lỗi đó.

## Điểm và so sánh trước–sau

Điểm nhiệm vụ là `số câu có đáp án đầu đúng / số câu được giao × 10`. Mỗi câu dùng lượt đầu sau thời điểm giao; chưa trả lời tính 0 tạm thời và ghi rõ chưa hoàn thành. Sửa sau gợi ý không thay điểm đầu. Đây là chấm đáp án của kho bài hiện có, chưa chấm điểm tự động mọi dạng tự luận/chứng minh.

So sánh trước–sau dùng một bài sai đã hoàn thành sửa và lượt làm đầu của **bài khác cùng kỹ năng sau đó**. Hiển thị chưa kiểm chứng nếu chưa có lượt phù hợp. Tái mắc chỉ đếm khi các lượt sai có cùng nhãn lỗi; lỗi chưa phân loại không được gán nguyên nhân. Các bài cùng kỹ năng chưa được hiệu chuẩn độ khó, nên báo cáo không khẳng định quan hệ nhân quả hay học sinh đã thành thạo.

Gợi ý theo quy tắc ưu tiên cùng kỹ năng, nhãn lỗi và khối lớp, hạn chế bài đã làm đúng sau lỗi gần nhất. Gemini chọn từ danh sách câu có thật, không tự bịa đường dẫn. Gợi ý AI đã lưu được ẩn khi đổi khối, có thêm bài làm/hoàn thành hoặc giáo viên thay chẩn đoán.

## Phụ huynh và dữ liệu cũ

Phụ huynh chỉ xem hồ sơ của con được liên kết; không phân loại lỗi hoặc giao bài. Giáo viên chỉ xem lớp/học sinh được phân công. Dữ liệu cũ giữ nguyên; không có cách làm thì hiển thị chưa đủ bằng chứng. Chưa triển khai gửi Gmail.

## Kiểm tra

- `npm test`: quyền truy cập, điểm máy chủ, dữ liệu trước/sau, nhãn lỗi, bằng chứng AI, lưu và khởi động lại.
- `node scripts/check-learning.mjs`: trình duyệt kiểm tra toàn luồng tạo lớp, giao câu, làm bài, AI, xác nhận, giao bài khắc phục, báo cáo và màn hình điện thoại; phản hồi Gemini được giả lập để chạy không tốn API.
- `node scripts/check-content.mjs` và `node scripts/check-routing-stats.mjs`: tương thích chức năng soạn bài, tiến độ và điều hướng hiện có.

Không có dữ liệu kiểm thử được ghi vào tài khoản thật hoặc snapshot deploy.
