# Bizmasi — Cây tri thức
## Cập nhật theo phản hồi ngày 08/10/2026
Trang chủ dùng đại cổ thụ toàn chiều rộng và gần toàn viewport bên dưới header sáng. Tiêu đề gọn đặt trên cây. Thân cổ thụ dày, rễ bạnh, tán rộng nhiều tầng; bầu trời HDRI sáng có mây theo ảnh tham chiếu của chủ website. Các quyết định này thay thế bố cục hero chia cột và nền triển lãm ban đầu ở phần ghi chép bên dưới. Thời gian focus hiện là 1100ms.

## Hướng thiết kế
Cây tự nhiên cách điệu trong một không gian triển lãm tri thức. Thân gỗ, rễ gắn vào nền, sáu tán lá là sáu phòng ban. Không gian sáng, giấy ngà, xanh lá trầm và ánh sáng ấm. Tiêu đề biên tập lớn, chữ nội dung gọn, đường kẻ mảnh.

## Tokens
- Paper: #f5f4ec; ink: #263c2f; primary: #294d37.
- Muted: #6d776d; border: #dcded1; secondary surface: #e9eddf.
- Tiêu đề: Literata / Georgia; nội dung: Be Vietnam Pro / Arial.
- Fonts tải từ Google Fonts, có font hệ thống dự phòng.
- Desktop header 100px; hero chia 31/69; khoảng lề 4%.
- Mobile <=760px: header hai hàng, cây dưới lời giới thiệu, danh mục hai cột.
- Dialog desktop bên phải; mobile bottom sheet 76dvh.
- Labels HTML thật, focus bàn phím, dialog native hỗ trợ Escape, tìm kiếm Ctrl/Cmd+K.
- Nút 3D gọn, danh sách phòng ban là đường truy cập thay thế.

## Hành vi
Xoay bằng kéo; zoom có giới hạn; focus camera 900ms; reduced motion kết thúc ngay. Đóng chi tiết giữ góc nhìn; reset khôi phục toàn cây và xóa trạng thái chọn. Không auto-rotate để tránh mất tập trung. Render theo yêu cầu và dừng khi không nhìn thấy scene.

## Nguồn
Thiết kế triển khai theo hướng dẫn tạo hình, cấu trúc vật thể, ánh sáng, camera và kiểm tra hình ảnh của https://github.com/viettranx/3dviz-pro-max. Mã scene được viết riêng cho Bizmasi, không sao chép template hay rig của repository. Dữ liệu từ bản cào Bizmasi ngày 08/10/2026; bản gốc được giữ nguyên ở ../output/bizmasi-crawl.
