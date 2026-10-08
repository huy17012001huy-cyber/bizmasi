# Bizmasi — Cây tri thức nở hoa, phương án 02

## Bố cục và tạo hình

- Cây là chủ thể của trang chủ, chiếm toàn vùng hero dưới header 80px.
- Thân đứng giữa, 11 rễ bạnh, sáu nhánh chính đan vào một vòm tán rộng.
- Lá bầu dục có độ cong, gân và nếp giữa; lá mọc thành các chồi nhỏ trên cành.
- Hoa năm cánh trắng ngà, nhụy vàng. Tiểu cảnh quanh gốc gồm đá vôi phủ rêu, sỏi, dương xỉ và hoa trắng/vàng.
- Ánh sáng ban ngày ấm, nền trời HDRI; đất, cỏ và các lớp đồi bao quanh cây.
- Tự thiết kế hình học cho phương án này theo phản hồi của chủ website; không áp dụng skill 3dviz-pro-max cho bản mới.

## Giao diện

- Tiêu đề Literata, nội dung Be Vietnam Pro; có font hệ thống dự phòng.
- Header sáng; nhãn phòng ban màu ngà, chữ xanh, trạng thái chọn xanh đậm.
- Nhãn là nút HTML để dùng được bàn phím và công nghệ hỗ trợ.
- Mobile: header hai hàng 106px, cây hiển thị gần hơn, các mục đầy đủ vẫn có trong danh sách phía dưới.
- Dialog bên phải trên desktop, bottom sheet trên mobile.

## Tương tác nhãn

Mỗi nhãn nằm tại một điểm 3D cố định trên nhánh tương ứng, phân bố quanh thân cây. Chỉ hiện nhãn khi mặt nhánh hướng về camera và nhãn nằm trong khung nhìn. Không kẹp nhãn vào mép màn hình, không đẩy nhãn sang hàng khác.

Góc mặc định desktop hiện ba nhánh phía trước; quay sang mặt đối diện sẽ thấy ba nhánh còn lại. Trên điện thoại thường chỉ thấy một hoặc hai nhánh vừa khung hình. Nhãn bị ẩn không nhận focus bàn phím; danh sách sáu phòng ban vẫn luôn truy cập được.

Kéo để xoay, zoom có giới hạn, chọn phòng ban xoay camera đến đúng mặt nhánh. Reset về toàn cây; focus 1000ms, reduced motion 1ms. Không tự xoay. Cảnh có động vật chuyển động liên tục; render dừng khi tạm dừng/giảm chuyển động, khi tab ẩn hoặc khi cây ngoài màn hình.

## So sánh phương án

- Bản mới: E:/Bizmasi/bizmasi-3d, local 4173.
- Bản cũ: E:/Bizmasi/archives/tree-v1-2026-10-08, local 4174.
- Nguồn dữ liệu giữ tại E:/Bizmasi/output/bizmasi-crawl.
- Mã nguồn phiên bản 02 nằm trong repository GitHub bizmasi; các bản lưu và dữ liệu cào giữ cục bộ.

## Động vật

9 chim đậu rải quanh cây, hạ cánh theo từng bước và bay chuyển cành lệch nhịp. 4 sóc chia thành 2 đôi ngồi gần, quay mặt vào nhau ăn. Sau tương tác, động vật trở lại khi đủ 20 giây yên tĩnh; hai đôi sóc về phía gốc gần camera. Lá và cỏ đứng yên.
