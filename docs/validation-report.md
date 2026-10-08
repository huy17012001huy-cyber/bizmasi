# Validation report — Cây tri thức nở hoa, phương án 02

Ngày kiểm tra: 08/10/2026.

## Kiểm tra bản cây tĩnh trước khi thêm động vật

Kịch bản scripts/tree-review.js kiểm tra 34 điều kiện:

- Cảnh cây phủ vùng trang chủ; vòng render dừng khi đứng yên.
- Góc mặc định chỉ hiện nhãn ba nhánh phía trước.
- Nhãn phía sau ẩn khỏi màn hình, bàn phím và cây accessibility.
- Xoay qua đủ sáu hướng: nhánh tương ứng xuất hiện và mở đúng tài liệu.
- Mặt đối diện hiện ba nhánh còn lại; kéo chuột không hiện đồng thời cả sáu nhãn.
- Xoay, zoom, reset, fullscreen và reduced motion.
- Mobile 390 × 844: không tràn ngang, từng nhánh có thể xuất hiện khi xoay tới đúng hướng, bottom sheet mở đúng tài liệu.
- Không có JavaScript runtime error.

Ảnh kiểm tra nằm trong E:/Bizmasi/output/playwright/ với tiền tố flowering-tree.
Tiểu cảnh được kiểm tra trực quan sau khi thêm đá, sỏi, dương xỉ và hoa.

## Dữ liệu và build

- 6 phòng ban, 17 chuyên môn, 5 nhóm con, 25 tài liệu.
- 6 bài viết, 4 khóa học và 27 bài trong đề cương nguồn.
- npm run check:data và npm run build: đạt.
- Bản cũ được lưu trước chỉnh sửa: 27 tệp tracked được đối chiếu hash với bản sao, kèm dist hiện có.
- Không sửa bản cào dữ liệu, không deploy hoặc push các thay đổi phương án 02.

## Tài nguyên

- HDRI kloppenheim_05_puresky_2k.hdr, Poly Haven, CC0.
- Texture jolcham_oak_bark_01, Poly Haven, CC0; Charlotte Baglioni.
- Hình học cây, lá, hoa, đá và dương xỉ được tạo bằng Three.js.

## Giới hạn

- Mobile kiểm tra bằng viewport mô phỏng; chưa đo FPS trên điện thoại thật.
- Bản có tiểu cảnh ghi nhận 27 draw calls, 3.036.366 triangles; render dừng khi cảnh đứng yên.
- Build vẫn có cảnh báo chunk Three.js lớn hơn 500kB, cây tải bằng dynamic import.
- Đăng nhập/tài liệu thành viên/video và gửi tư vấn vẫn dùng website gốc; khảo sát xuất TXT cục bộ.

## Kiểm tra bản đàn chim và hai sóc — 08/10/2026

- node --test scripts/nature-state.test.mjs scripts/wildlife.test.mjs: 8 kiểm tra trạng thái, số lượng, đường bay và khả năng ngắt chuyển động.
- Playwright: đàn 9 chim + 2 sóc rời đi khi kéo cây, ẩn rồi trở lại sau 30 giây; camera không đổi; tạm dừng dừng cả đồng hồ và render, tiếp tục hoạt động khi bật lại.
- Bản phân tán: xác nhận chim ở cả trước/sau cây, chênh lệch cao độ 8,1 đơn vị; quan sát 3 chim bay chuyển cành trong khi các con khác đậu.
- Reduced motion: chuyển sang cảnh tĩnh. Viewport 390 × 844 không tràn ngang. Không có lỗi JavaScript/console trong các lượt kiểm tra này.
- Bộ đo vòng render đạt khoảng 30 FPS sau điều chỉnh tự động trên Intel UHD P630, viewport 1440 × 1000, chất lượng cấp 2 (DPR 0,65, 41.328 lá được render). Không phải so sánh ở cùng mức chi tiết với bản cũ.
- Ảnh: E:/Bizmasi/output/playwright/flock-spread-perched.png, flock-spread-flying.png, flock-spread-mobile.png.
- Build còn cảnh báo kích thước chunk Three.js >500 kB; chưa đo trên điện thoại thật.

## Bản phát hành đàn chim và hai đôi sóc — 08/10/2026

- Build đạt; 10 kiểm tra Node đạt, bao gồm ngắt hạ cánh, chu kỳ chính xác 20 giây và bốn góc camera cho hai đôi sóc.
- Playwright scripts/wildlife-browser-check.js: đo thời gian trở lại 20,017 giây trên đồng hồ cảnh; cả 4 sóc ở phía gần camera, mỗi đôi cách nhau khoảng 1,12 đơn vị và quay mặt vào nhau. Không có lỗi trình duyệt.
- Bản có chim chi tiết và 4 sóc: khoảng 29,8 FPS tại viewport 1440 × 1000, mức tự động 2, DPR 0,65 và 41.328 lá render.
- Chim: 2.156 tam giác/con (19.404 cho cả đàn), thêm chân, lông cánh/đuôi và các pha hạ cánh.
- Ảnh cục bộ: birds-detailed-landing.png, four-squirrels-front.png, four-squirrels-after-orbit.png trong E:/Bizmasi/output/playwright/.
- Đã sửa phép chiếu nhãn dùng camera cũ khi chuyển góc tức thời; scripts/tree-review.js đạt đủ 34 kiểm tra desktop/mobile, nhãn, tài liệu, zoom và fullscreen.
