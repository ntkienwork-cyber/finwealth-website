Thư mục này chứa các file PDF báo cáo ngày.

CÁCH CHÍNH: dùng trang quản trị /admin.html
-------------------------------------------
Mở finwealthvietnam.com/admin.html (hoặc http://localhost:8080/admin.html khi
chạy local), nhập mật khẩu quản trị (ADMIN_PASSWORD), điền ngày/tiêu đề/tóm tắt
và chọn file PDF rồi bấm "Tải lên". Hệ thống tự lưu file và cập nhật danh sách
— không cần đụng vào code hay deploy lại.

- Khi chạy local (node server.js): file PDF được lưu vào thư mục này,
  danh sách được lưu trong data/reports.json.
- Khi deploy lên Vercel: file PDF và danh sách được lưu trên Vercel Blob
  Storage (không lưu trong thư mục này) — xem README.md mục "Trang quản trị
  đăng báo cáo".

CÁCH THỦ CÔNG (chỉ dùng khi chạy ở local, không áp dụng khi đã deploy Vercel)
------------------------------------------------------------------------------
1. Đặt file PDF vào thư mục này, đặt tên theo quy tắc: YYYY-MM-DD-tieu-de-ngan.pdf
2. Mở file data/reports.json (ở thư mục gốc) và thêm một mục mới:
   {
     "date": "2026-09-16",
     "title": "Điểm tin thị trường phiên 16/09/2026",
     "summary": "Tóm tắt ngắn 1-2 câu về nội dung báo cáo.",
     "file": "reports/2026-09-16-diem-tin-thi-truong.pdf"
   }

Lưu ý: 3 mục mẫu hiện có trong data/reports.json là DỮ LIỆU GIẢ ĐỊNH để demo —
sau khi deploy lên Vercel, danh sách thật sẽ bắt đầu trống và chỉ hiển thị
báo cáo bạn đăng qua /admin.html.
