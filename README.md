# Website Finwealth — finwealthvietnam.com

Cổng thông tin thị trường tài chính của Công ty TNHH Finwealth (Finwealth Ltd. — hoạt động trong lĩnh vực tư vấn, quản lý). Trang chủ tổng hợp tin tức thị trường từ vài nguồn uy tín + bảng điện VN-Index/cổ phiếu vốn hoá lớn theo thời gian thực; ngoài ra có kho báo cáo ngày và trang liên hệ (Zalo OA).

Theo đúng bộ nhận diện thương hiệu (`Finwealth_Brand_Identity.pptx`): màu Dark Emerald `#0C3D30` / Navy `#0B1F3A` / Gold `#C3A24E`, font Source Serif 4 + Be Vietnam Pro, logo "4 cột trụ tăng dần".

## ⚠️ Thay đổi kiến trúc quan trọng

Bản này **không còn là web tĩnh 100%** như trước — trang chủ cần một API nhỏ (`/api/news`) để tổng hợp tin tức từ RSS (trình duyệt không thể tự đọc RSS của các báo do bị chặn CORS). API này là một **serverless function**, chạy được miễn phí trên **Vercel** hoặc **Netlify**, nhưng **sẽ không chạy được nếu chỉ upload lên hosting cPanel tĩnh thông thường**. Nếu bạn bắt buộc phải dùng cPanel, cho mình biết để đổi cách lấy tin (ví dụ: một cron job chạy định kỳ ghi ra file JSON tĩnh).

Trang quản trị đăng báo cáo (`/admin.html`) cần thêm **Vercel Blob Storage** để lưu file PDF và danh sách báo cáo lâu dài (xem mục "Trang quản trị đăng báo cáo" bên dưới) — bắt buộc nếu deploy lên Vercel.

Bảng điện giá chứng khoán cũng cần một API nhỏ (`/api/market`, lấy dữ liệu từ FireAnt — xem mục bên dưới). Các trang tĩnh còn lại (Giới thiệu, Liên hệ) vẫn là HTML/CSS/JS thuần.

## Cấu trúc thư mục

```
finwealth-website/
├── index.html            Trang chủ: tin tức tổng hợp + bảng điện (sidebar 1/5)
├── about.html            Giới thiệu công ty & cổng thông tin
├── reports.html          Kho báo cáo ngày (tìm kiếm + lọc theo tháng)
├── contact.html          Liên hệ (Zalo OA + form)
├── admin.html            Trang nội bộ để Team Insight đăng báo cáo ngày (có mật khẩu)
├── css/style.css         Toàn bộ style, biến màu/font ở đầu file
├── js/main.js            Nav mobile, form liên hệ, footer year
├── js/news.js            Fetch + render tin tức trang chủ từ /api/news
├── js/market.js          Vẽ biểu đồ VN-Index (SVG, 16:9) + danh sách cổ phiếu từ /api/market
├── js/reports.js         Tìm kiếm/lọc cho trang báo cáo, đọc từ /api/reports
├── lib/fetchNews.js            Logic tổng hợp RSS dùng chung (Vercel/Netlify/local đều gọi file này)
├── lib/fetchMarket.js          Lấy dữ liệu VN-Index + cổ phiếu từ FireAnt (dùng chung, mọi môi trường)
├── lib/reportsStore.blob.js    Lưu trữ báo cáo trên Vercel Blob (dùng bởi api/*.js — production)
├── lib/reportsStore.local.js   Lưu trữ báo cáo bằng file cục bộ (chỉ dùng bởi server.js — local)
├── api/news.js                 Serverless function cho Vercel — GET /api/news
├── api/market.js                Serverless function cho Vercel — GET /api/market
├── api/reports.js               Serverless function cho Vercel — GET /api/reports
├── api/upload-report.js         Serverless function cho Vercel — POST /api/upload-report
├── api/delete-report.js         Serverless function cho Vercel — POST /api/delete-report
├── netlify/functions/news.js   Bản tương đương cho Netlify (chỉ có phần tin tức)
├── server.js              Server Node.js để chạy thử toàn bộ ở local (xem bên dưới)
├── package.json           Khai báo dependency @vercel/blob (cho api/*.js khi deploy Vercel)
├── data/reports.json      Danh sách báo cáo — chỉ dùng khi chạy local qua server.js
├── reports/               Nơi lưu PDF báo cáo khi chạy local qua server.js
└── assets/                Logo SVG (logo-mark.svg, logo-mark-white.svg)
```

## Chạy thử ở local

Cần Node.js (bản 18 trở lên, vì dùng `fetch` có sẵn). Từ thư mục `finwealth-website/`:

```bash
node server.js
```

Mở `http://localhost:8080`. Server này vừa phục vụ file tĩnh, vừa xử lý `/api/news` giống hệt trên Vercel — dùng để xem trước đầy đủ tính năng, **không dùng cho production**.

---

## Nguồn tin tức đang dùng

Cấu hình tại [`lib/fetchNews.js`](lib/fetchNews.js), biến `SOURCES`:

| Nguồn | RSS |
|---|---|
| VnExpress — Kinh doanh | `https://vnexpress.net/rss/kinh-doanh.rss` |
| CafeF — Thị trường chứng khoán | `https://cafef.vn/thi-truong-chung-khoan.rss` |
| VnEconomy — Chứng khoán | `https://vneconomy.vn/chung-khoan.rss` |

Mỗi tin chỉ hiển thị tiêu đề + tóm tắt ngắn (~200 ký tự) + link về bài gốc, luôn ghi rõ tên nguồn — không sao chép toàn văn, để tôn trọng bản quyền của các báo. Muốn thêm/bớt nguồn: sửa mảng `SOURCES` trong `lib/fetchNews.js` (cần tìm URL RSS thật của nguồn đó, thường có ở footer trang báo hoặc `/rss`).

## Bảng điện (VN-Index & cổ phiếu vốn hoá lớn)

Tự dựng (không nhúng iframe/widget bên thứ ba) để làm chủ hoàn toàn tỷ lệ hiển thị, màu sắc và hiệu ứng hover — xem `js/market.js` (vẽ SVG) + `lib/fetchMarket.js` (lấy dữ liệu) + `api/market.js` (endpoint `/api/market`).

**Nguồn dữ liệu:** API công khai của FireAnt (nền tảng dữ liệu tài chính Việt Nam) — cùng nguồn dữ liệu widget nhúng của họ sử dụng, nhưng gọi trực tiếp để tự vẽ giao diện:
- `GET https://www.fireant.vn/api/Data/Markets/HistoricalQuotes?symbol=HOSTC&startDate=...&endDate=...` — lịch sử VN-Index (mã nội bộ `HOSTC` = chỉ số HOSE) dùng để vẽ biểu đồ 6 tháng, tỷ lệ 16:9.
- `GET https://www.fireant.vn/api/Data/Markets/Quotes?symbols=VCB,VIC,HPG,FPT,VNM,VHM` — giá + điểm/% thay đổi trong ngày của các cổ phiếu vốn hoá lớn.

*Lưu ý đã thử TradingView trước — họ không cấp phép hiển thị dữ liệu sàn HOSE qua widget nhúng công khai (báo lỗi "This symbol is only available on TradingView"), nên không dùng được.*

Muốn đổi danh sách mã cổ phiếu: sửa mảng `STOCK_SYMBOLS` trong `lib/fetchMarket.js`. Muốn đổi khung thời gian biểu đồ: sửa `HISTORY_MONTHS`. Dữ liệu chỉ mang tính tham khảo, có thể có độ trễ.

## Trang quản trị đăng báo cáo (`/admin.html`)

Team Insight tự đăng báo cáo ngày (PDF) trực tiếp qua trình duyệt, không cần đụng code hay deploy lại. Trang có mật khẩu bảo vệ, **không được gắn link công khai** trong menu — chỉ chia sẻ URL trực tiếp cho người cần dùng: `finwealthvietnam.com/admin.html`.

### Cách hoạt động
- File PDF và danh sách báo cáo được lưu trên **Vercel Blob Storage** (khi đã deploy) — bền vững, không mất khi deploy lại, khác với cách cũ (sửa file JSON trong repo).
- Khi chạy local (`node server.js`), thay vào đó lưu vào thư mục `reports/` + `data/reports.json` trên máy để tiện test mà không cần tài khoản Vercel.
- Giới hạn dung lượng file: khoảng 3MB/PDF (do giới hạn kích thước request của Vercel Functions — thường dư sức cho báo cáo dạng văn bản + vài biểu đồ).

### Thiết lập trên Vercel (bắt buộc trước khi dùng thật)
1. Trong Vercel Dashboard → project → tab **Storage** → **Create Database** → chọn **Blob** → đặt **Public** → tạo store, kết nối với project này (chọn cả môi trường Production/Preview/Development).
2. Vào **Settings → Environment Variables**, thêm biến `ADMIN_PASSWORD` với một mật khẩu mạnh do bạn tự đặt (đây là mật khẩu Team Insight sẽ dùng để đăng nhập `/admin.html`). Không dùng mật khẩu mặc định của local.
3. Deploy lại project để biến môi trường có hiệu lực.

### Chạy thử ở local
Mặc định `server.js` dùng mật khẩu `finwealth-admin-2026` nếu bạn chưa đặt biến `ADMIN_PASSWORD` — chỉ để test, không dùng mật khẩu này khi lên production. Muốn đặt mật khẩu riêng khi test local:

```bash
ADMIN_PASSWORD="mat-khau-cua-ban" node server.js
```

### Lưu ý bảo mật
Đây là cơ chế bảo vệ đơn giản (1 mật khẩu dùng chung cho cả team, không có tài khoản riêng từng người, không có nhật ký ai đã đăng gì). Phù hợp cho một nhóm nội bộ nhỏ. Nếu sau này cần nhiều người dùng với tài khoản riêng, phân quyền, hoặc lịch sử chỉnh sửa — đây sẽ là một nâng cấp lớn hơn, cho biết nếu bạn cần.

---

## Các bước để hoàn thiện website

### 1. Nội dung cần điền (tìm từ khoá `[ ... ]` màu đỏ nghiêng)
- [ ] Email, hotline, địa chỉ văn phòng (`contact.html`)
- [ ] Số Giấy chứng nhận đăng ký doanh nghiệp, mô tả chi tiết lĩnh vực hoạt động (`about.html`)
- [ ] Link Facebook, LinkedIn thật (hiện đang là `#`)

### 2. Báo cáo ngày
- [ ] Tạo Vercel Blob Storage + đặt biến `ADMIN_PASSWORD` (xem mục "Trang quản trị đăng báo cáo" ở trên) trước khi Team Insight dùng `/admin.html` thật.
- [ ] Sau khi deploy lần đầu, danh sách báo cáo sẽ trống — dùng `/admin.html` để đăng báo cáo đầu tiên (3 mục mẫu hiện tại chỉ tồn tại khi chạy local).

### 3. Kết nối form liên hệ
Form ở `contact.html` hiện chỉ demo (`js/main.js`). Chọn 1 hướng: dùng dịch vụ nhận form không cần backend (Formspree, Web3Forms), hoặc thêm một API route nhỏ gửi email qua Resend/SendGrid — mình có thể triển khai tiếp.

### 4. Domain & DNS — finwealthvietnam.com
- [ ] Trỏ domain về Vercel/Netlify (thường qua CNAME hoặc A record theo hướng dẫn của nhà cung cấp)
- [ ] SSL/HTTPS tự động có sẵn trên Vercel/Netlify

### 5. Deploy — Vercel (khuyến nghị)
Kết nối repo Git hoặc kéo-thả thư mục qua `vercel` CLI / dashboard. Vercel tự nhận diện các file trong `api/` là serverless function và tự `npm install` gói `@vercel/blob` khai báo trong `package.json`, không cần cấu hình thêm. **Nhớ hoàn tất bước tạo Blob Storage + đặt `ADMIN_PASSWORD`** ở mục "Trang quản trị đăng báo cáo" trước khi dùng `/admin.html` thật.

Nếu dùng Netlify thay vì Vercel: tính năng tin tức (`/api/news`) đã có sẵn bản tương đương (`netlify/functions/news.js` + rule redirect trong `netlify.toml`), nhưng **trang quản trị đăng báo cáo (`/admin.html`) hiện chỉ triển khai cho Vercel Blob** — cần viết lại `lib/reportsStore.blob.js` bằng `@netlify/blobs` nếu muốn dùng trên Netlify, cho biết nếu bạn cần mình làm tiếp phần này.

### 6. SEO & đo lường
- [ ] Google Search Console + Google Analytics/Plausible
- [ ] `sitemap.xml`, `robots.txt`
- [ ] Ảnh Open Graph khi chia sẻ link lên Zalo/Facebook

### 7. Kiểm thử trước khi ra mắt
- [ ] Test trên mobile thật, kiểm tra tốc độ tải (Google PageSpeed Insights)
- [ ] Theo dõi log lỗi của `/api/news` sau khi deploy (một nguồn RSS đổi cấu trúc/đổi URL có thể khiến tin từ nguồn đó tạm thời không hiển thị — code đã xử lý để các nguồn còn lại vẫn chạy bình thường)
- [ ] Đọc lại disclaimer ở footer với bộ phận pháp lý nếu cần

### 8. Sau khi ra mắt
- [ ] Theo dõi phản hồi qua Zalo OA và form liên hệ
- [ ] Kiểm tra định kỳ các nguồn RSS còn hoạt động đúng không
