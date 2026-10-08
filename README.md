# Bizmasi — Website cây tri thức 3D

Bản frontend mới, dùng Three.js + Vite, dữ liệu từ website Bizmasi đã thu thập ngày 08/10/2026.

## So sánh hai phương án cây

- Bản 02 đang làm: cây nở hoa, nhãn gắn cố định trên nhánh và chỉ hiện khi xoay đúng mặt. Tiểu cảnh đá, sỏi, dương xỉ, hoa nhỏ quanh gốc.
- Bản 02 chạy local tại http://127.0.0.1:4173/; mã nguồn được quản lý trên GitHub.
- Bản 01 giữ nguyên tại E:/Bizmasi/archives/tree-v1-2026-10-08; xem riêng tại http://127.0.0.1:4174/.
- Hướng dẫn mở bản lưu: E:/Bizmasi/archives/README.md.

## Chạy
Yêu cầu Node.js 20.19+ hoặc 22.12+.
```powershell
cd E:\Bizmasi\bizmasi-3d
npm ci
npm run prepare-data
npm run dev
```
Xem tại http://127.0.0.1:4173.
```powershell
npm run check:data
npm run build
npm run preview
```
Dev và preview dùng cùng cổng 4173; chỉ chạy một máy chủ mỗi lần.

## Đã có
- Cây 3D thật: xoay, zoom, chọn nhánh, reset, toàn màn hình.
- Cây đại cổ thụ toàn màn hình: thân vỏ sồi có texture CC0, rễ bạnh, cành phân tầng, tán instanced, bầu trời HDRI và địa hình đồi.
- 6 phòng ban, 17 chuyên môn, 5 nhóm con và 25 bản ghi tài liệu.
- Tìm kiếm có/không dấu; danh sách thay thế; responsive; reduced motion; fallback WebGL.
- 4 khóa học với 27 bài trong đề cương nguồn; 6 bài viết đầy đủ.
- Giới thiệu, tư vấn, bảo mật, điều khoản.
- 6 câu hỏi hiện trạng và xuất file TXT cục bộ, không chấm điểm giả định.

## Dữ liệu
Nguồn không bị chỉnh sửa: E:\Bizmasi\output\bizmasi-crawl.
scripts/prepare-data.mjs tạo public/data/bizmasi.json và sao chép assets. Các bài viết được lấy từ main_text, bỏ khối tư vấn/điều hướng sau nội dung bài.
Không suy diễn số bài học từ metadata marketing; lấy trực tiếp modules[].lessons.
Hotline lấy theo footer công ty: 0813 418 660. Các số khác không nhất quán ở menu/sidebar cũ không được dùng.
Hai trang chính sách trong nguồn chỉ chứa đoạn ngắn; giữ nguyên nội dung đã thu thập, có liên kết phiên bản gốc.

## Kết nối hệ thống
Đăng nhập, học video, quyền tải tài liệu và gửi đăng ký tư vấn dẫn đến bizmasi.vn. Dữ liệu nguồn không có file tài liệu công khai hay URL video bài học.
Website không thu thập hoặc gửi câu trả lời khảo sát; người dùng tải và tự chia sẻ bản ghi.

## Cấu trúc
- src/tree.js: hình học, vật liệu, ánh sáng, camera, tương tác.
- src/wildlife.js, src/animal-models.js, src/nature-state.js: tạo hình, chuyển động và chu kỳ động vật.
- src/root-garden.js: đá phủ rêu, sỏi, dương xỉ và hoa quanh rễ cây.
- src/forest.css: giao diện trang chủ phương án 02.
- src/app.js: router hash, dữ liệu, tìm kiếm, trang và dialog.
- src/style.css: hệ thống giao diện.
- public/data: dữ liệu xuất từ archive.
- scripts/browser-check.js và browser-edge-check.js: kịch bản cho Playwright CLI run-code --filename.
- docs/design-system.md; scene-spec.json; validation-report.md.
- dist: bản build có thể phục vụ trên static hosting.
- Tài nguyên CC0 nằm trong public/textures: daylight-sky.hdr, oak-color.jpg, oak-normal.jpg.

## Trước khi thay thế website đang hoạt động
Bản này chạy cục bộ, chưa thay domain hiện tại. Khi triển khai chính thức cần chọn hosting, tích hợp backend nếu muốn đăng nhập/nộp biểu mẫu ngay trên giao diện mới, và cấu hình route/redirect để bảo toàn URL và SEO của website cũ. Hiện dùng hash router cho bản xem thử. Google Fonts có fallback hệ thống nếu không có mạng.

## Bản động vật hiện tại — 08/10/2026

- Lá, cỏ và dương xỉ đứng yên; không gắn shader gió.
- 9 chim có lông cánh, đuôi, mắt, mỏ và chân: 2.156 tam giác/con.
- Điểm đậu ở nhiều cao độ và cả mặt trước/sau cây. Mỗi chim có đường bay riêng và thi thoảng chuyển cành.
- Hạ cánh có giảm tốc, ngẩng thân, đưa chân ra bám, gấp cánh dần và nhún nhẹ khi chạm cành.
- 4 sóc chia thành 2 đôi gần nhau, quay mặt vào nhau ăn; không còn sóc leo/cất hạt.
- Khi quay lại, hai đôi chọn vị trí ở phía gốc cây gần camera, giữ nguyên góc người dùng đã xoay.
- Xoay/zoom/chọn nhánh làm động vật rời đi. Quay lại sau 20 giây yên tĩnh trên đồng hồ cảnh đang hoạt động.
- Có nút tạm dừng và hỗ trợ prefers-reduced-motion.
- Bóng cây được lưu lại; sóc dùng bóng tiếp xúc nhẹ. Mật độ lá và độ phân giải tự điều chỉnh theo tốc độ máy.
- Mã nguồn website: https://github.com/huy17012001huy-cyber/bizmasi. Dữ liệu cào và các bản lưu ở ngoài repository website.

## Kiểm tra chuyển động

Chạy node --test scripts/nature-state.test.mjs scripts/wildlife.test.mjs. Kịch bản trình duyệt: scripts/wildlife-browser-check.js (Playwright CLI run-code --filename).
