# Validation report — Cây tri thức Bizmasi

Ngày kiểm tra: 08/10/2026.

## Đã quan sát trong trình duyệt

- Cây đại cổ thụ chiếm vùng hero toàn màn hình desktop và mobile.
- Sáu nhãn phòng ban vẫn hiển thị, chọn nhánh mở đúng bảng tài liệu.
- Kéo xoay, zoom, reset và fullscreen hoạt động.
- Chọn nhánh đổi camera; reduced motion hoàn tất chuyển cảnh tức thời.
- Dialog desktop và bottom sheet mobile đọc được nội dung.
- Khi WebGL không tạo được, danh sách phòng ban và tài liệu vẫn hoạt động.
- Không có JavaScript runtime error trong kịch bản kiểm tra.

## Số liệu kiểm tra

- 6 phòng ban, 17 chuyên môn, 5 nhóm con.
- 25 tài liệu, 6 bài viết, 4 khóa học và 27 bài học trong đề cương.
- Kịch bản scripts/tree-review.js đã kiểm tra toàn bộ sáu nhánh, camera, mobile labels và document sheet.
- npm run check:data đạt.
- npm run build đạt.

## Tài nguyên hình ảnh

- HDRI kloppenheim_05_puresky_2k.hdr từ Poly Haven, CC0, dùng làm nền trời. Ánh sáng trên cây đến từ hệ thống đèn Three.js.
- Texture jolcham_oak_bark_01 từ Poly Haven, CC0, dùng cho vỏ cây; tác giả texture: Charlotte Baglioni.
- Mã hình học thân, rễ, cành, tán và địa hình là custom Three.js của dự án.

## Giới hạn còn lại

- Không giả lập tải file tài liệu; tài liệu dành cho thành viên dẫn tới đăng nhập Bizmasi.
- Biểu mẫu khảo sát tạo file TXT cục bộ; chưa gửi dữ liệu về backend vì chưa có endpoint tích hợp.
- Đây là bản frontend chạy local, chưa thay thế domain đang hoạt động.
- Kiểm tra mobile bằng viewport mô phỏng, chưa đo FPS trên điện thoại thật. Lượt render desktop ghi nhận 18 draw calls và 983.494 triangles; loop dừng khi cảnh đứng yên.
- Build cảnh báo chunk Three.js lớn hơn 500 kB; cây được tải bằng dynamic import.
