# Hiệu ứng động vật cho cây Bizmasi

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

## Ghi chép nghiên cứu ban đầu (lịch sử)

Phần dưới mô tả đề xuất cũ có gió và sóc leo; đã được thay bằng cấu hình ở trên theo yêu cầu mới.

# Nghiên cứu hiệu ứng gió và động vật cho cây Bizmasi

Ngày: 08/10/2026. Phạm vi: đánh giá khả thi và đề xuất triển khai local; chưa thêm hiệu ứng vào website.

## Kết luận

Có thể thực hiện trên Three.js 0.180.0 đang dùng. Không cần đổi framework. Thách thức chính là chất lượng hình dáng/động tác của động vật, chân bám đúng thân cây, và duy trì độ mượt khi cảnh chuyển từ render theo nhu cầu sang chuyển động liên tục.

Đề xuất: gió nhẹ + một chim nhỏ + ba con sóc theo đúng kịch bản của chủ website. Dùng nhân vật 3D có bộ xương và các đoạn chuyển động; điều khiển đường đi trong không gian bằng mã.

## Hiện trạng đã kiểm tra

- src/tree.js dùng WebGLRenderer, OrbitControls và các lô InstancedMesh cho lá.
- Bản cây hiện tại: 86.100 lá; lần kiểm tra gần nhất với tiểu cảnh ghi nhận 27 draw calls, 3.036.366 triangles.
- Vòng render dừng khi cảnh đứng yên, tab bị ẩn hoặc cảnh ra khỏi viewport.
- Đã có prefers-reduced-motion; cần giữ hành vi này khi thêm chuyển động.
- Thư viện cục bộ có Material.onBeforeCompile, AnimationAction.crossFadeTo và các sự kiện start/end/change của OrbitControls.
- public chưa có model chim, sóc hoặc animation GLB. Danh sách model phía dưới mới được đọc mô tả của tác giả; chưa tải, mua hay thử import.

## Kịch bản đề xuất

| Thời điểm | Chim | Sóc | Cây và giao diện |
| --- | --- | --- | --- |
| Cảnh và model đã tải xong | Một chim bay từ ngoài khung hình, giảm tốc rồi đậu lên cành | Hai con ăn ở cạnh cụm đá, con thứ ba ôm hạt leo thân cây về hốc nhỏ | Gió nhẹ chạy ngay; người dùng có thể xoay cây trong lúc đoạn mở đầu diễn ra |
| Không tương tác | Thi thoảng nghiêng đầu, rỉa lông hoặc đổi tư thế | Hai con ăn lệch nhịp, con còn lại cất hạt và nghỉ | Lá, cỏ, hoa lay động rất nhẹ |
| Bắt đầu kéo xoay/zoom/chọn nhánh | Giật mình, cất cánh bay khỏi cây | Hai con chạy về chỗ khuất, con đang leo chạy vòng ra sau thân | Camera phản hồi ngay; không khóa giao diện chờ động vật |
| Đang tiếp tục tương tác | Ở ngoài cảnh | Ở chỗ khuất | Cập nhật mốc tương tác cuối, không phát lại động tác bỏ chạy mỗi frame |
| Đủ 30 giây không tương tác | Bay trở về cành bằng đường cong mới, hạ cánh | Lần lượt ló ra, trở về vị trí ăn; con leo cây tiếp tục hành vi cất hạt | Tiếp tục góc camera người dùng đã chọn |
| Tương tác khi động vật đang quay về | Đổi sang bay đi từ vị trí hiện tại | Quay đầu/chạy trốn từ vị trí hiện tại | Không dịch chuyển tức thời hoặc tạo thêm bản sao |

Đoạn mở đầu chỉ phát một lần trong phiên tải trang. Không tự phát lại mỗi lần đóng bảng tài liệu.

Quay về nghĩa là phục hồi vị trí và hành vi quen thuộc. Mỗi con vẫn quay đầu/chạy/bay về phía trước; không chạy ngược toàn bộ animation bỏ chạy.

## Điều khiển tương tác và bộ đếm 30 giây

Chuỗi trạng thái: ARRIVING → CALM → FLEEING → HIDDEN → RETURNING → CALM.
Tương tác trong ARRIVING hoặc RETURNING chuyển về FLEEING ngay từ tư thế hiện tại.

- Một mốc lastInteraction chung, thay vì tạo nhiều setTimeout.
- Bắt đầu chạy trốn khi kéo đủ ngưỡng, cuộn zoom/pinch hoặc kích hoạt nút làm đổi góc cây.
- Mọi thao tác chủ động liên quan đến trang chủ/bảng phòng ban cập nhật mốc 30 giây. Việc mở bảng tài liệu có thể giữ trạng thái ẩn đến khi đóng bảng để tập trung đọc.
- Chỉ rê chuột qua trang không làm động vật bỏ chạy.
- Không dùng mọi sự kiện OrbitControls.change để reset đồng hồ: damping và camera tween cũng phát change dù người dùng đã thả tay.
- Không cho quay về khi còn giữ chuột/ngón tay. Thời gian yên tĩnh tính sau thao tác cuối.
- Khi tab/cảnh bị ẩn: tạm dừng mô phỏng và đồng hồ hoạt động. Khi quay lại: tiếp tục thời gian còn lại, tránh nhảy animation do delta quá lớn.
- Có nhánh xử lý giảm chuyển động: cảnh tĩnh hoặc chuyển đổi rất nhẹ, không có chuyến bay dài hay gió liên tục.

## Kỹ thuật đề xuất

### Gió

- Thêm một trường gió chung chạy trên GPU qua vertex shader của vật liệu lá/cỏ/hoa.
- Gốc lá được cố định; đầu lá cong/lắc nhẹ theo UV và pha riêng. Có hai nhịp: gió nền chậm và rung đầu lá nhanh hơn.
- Pha có tương quan theo vị trí để một luồng gió đi qua tán; không để toàn bộ lá lắc đồng nhịp.
- Không cập nhật 86.100 ma trận lá từ JavaScript mỗi frame.
- Nếu biến dạng ảnh hưởng đáng kể đến bóng, áp dụng cùng phép biến dạng cho vật liệu shadow depth; bản chất lượng thấp có thể giảm cập nhật bóng.
- Gió cỏ/hoa cùng hướng với lá nhưng khác biên độ.

### Chim

- GLB có bộ xương, các clip bay/cất cánh/hạ cánh/đứng.
- AnimationMixer cập nhật cánh và thân; đường spline điều khiển vị trí/hướng bay.
- Điểm đậu là một tọa độ gắn vào cành thật, tính khoảng hở để không xuyên lá/cành.
- Chuyển clip bằng crossfade; đồng bộ lúc chân chạm cành với kết thúc hạ cánh.

### Sóc

- Dùng một model gốc, clone bộ xương đúng cách cho ba cá thể; chia sẻ mesh/texture khi có thể.
- Mỗi con có mixer, thời gian và biến thể hành vi riêng.
- Động tác tối thiểu: ăn, nhìn quanh, chạy, leo, giữ hạt.
- Hạt gắn vào xương bàn tay; ở thời điểm cất hạt, chuyển hạt sang tọa độ hốc cây.
- Đường leo bám mặt thân, có điểm chuyển từ mặt đất sang thân cây. Clip leo có sẵn vẫn phải chỉnh cho khớp cây Bizmasi.
- Dùng đường đi được dựng trước quanh rễ/đá và mặt sau thân; chưa cần hệ thống tìm đường hoặc mô phỏng vật lý đầy đủ.
- Khi bỏ chạy/quay về, trộn animation ở vị trí hiện tại để tránh giật hình hoặc trượt chân.

### Bố cục

Hai sóc ăn cần đặt cạnh đá ở phần gốc nhìn thấy rõ, đủ tương phản với đất và thân cây. Chim đậu trên một cành có khoảng trống cạnh tán. Điều chỉnh tỷ lệ để người xem nhận ra hành động ở góc toàn cây; không che nhãn phòng ban.

## Tài nguyên đã tìm thấy

Các mục này là ứng viên tham khảo, chưa được kiểm tra file hay chốt dùng.

1. [Cartoon Squirrel Animated — 3DDisco](https://www.fab.com/listings/5315da39-c70a-4d82-b3bd-5bc47df6e993?lang=en): tác giả liệt kê GLB và các động tác ăn, giữ đồ, nhìn quanh, chạy, đi, leo. Clip leo không phải chu kỳ lặp hoàn chỉnh. Là tài nguyên thương mại; cần đối chiếu điều khoản dùng trên web trước khi chọn.

2. [Sparrow — Quirky Series, Omabuarts Studio](https://sketchfab.com/3d-models/sparrow-quirky-series-289e7db66cfa45fbbe7624b8f48f6c8c): tác giả công bố model có rig, 18 animation gồm Fly/Fear/Eat/Idle, có nhiều mức chi tiết và giấy phép CC Attribution. Danh sách chưa thể hiện clip cất/hạ cánh riêng; cần bổ sung hoặc điều chỉnh nếu chọn.

3. [Cartoon Sparrow — Mixall](https://www.fab.com/listings/76a337c7-d33d-438b-bb4d-0b5d8e678235): mô tả có Idle/Flying/Landing/Take off, cùng FBX và GLB chuyển đổi. Cần xác nhận các clip còn nguyên trong GLB thực tế và điều khoản sử dụng.

Không kết luận một gói asset phù hợp hoàn toàn chỉ dựa trên chữ “animated”. Cần xem đủ động tác, chất lượng bộ xương, tỷ lệ, phong cách, clip và texture của file thật.

## Hiệu năng

Gió liên tục đòi hỏi dựng lại khung hình khi cảnh hiện trên màn hình. Instancing/shader giúp giảm tải điều khiển, nhưng không loại bỏ chi phí vẽ khoảng ba triệu tam giác và bóng.

- Đo phiên bản hiện tại trên desktop và điện thoại trước khi bổ sung.
- Tạo mức chất lượng thấp/cao: giảm mật độ lá, độ phân giải, tần suất cập nhật bóng và animation phụ trên máy yếu.
- Mục tiêu thử nghiệm: 60 FPS desktop, tối thiểu 30 FPS trên điện thoại được chọn kiểm tra. Đây là mục tiêu, chưa phải số đo đạt được.
- Tải model sau nội dung chính, không chặn việc truy cập phòng ban khi asset động vật lỗi/chưa xong.
- Ngừng animation khi tab ẩn hoặc cây ra khỏi viewport.
- Thêm nút tắt chuyển động nếu phát hành tính năng này.

## Thứ tự triển khai đề xuất

1. Bản gió nhẹ trên cây hiện tại, đo tải render và thiết lập các mức chất lượng.
2. Dựng luồng bỏ chạy/chờ 30 giây/quay về bằng nhân vật tạm để kiểm tra logic.
3. Chốt và tích hợp model chim/sóc phù hợp; căn chân, cánh, đuôi, đường leo và hốc cất hạt.
4. Điều chỉnh nhịp diễn, tỷ lệ và kiểm tra 360 độ/mobile/reduced-motion.
5. Duy trì một bản local tĩnh để đối chiếu. Không deploy hoặc push khi chưa có yêu cầu.

## Tiêu chí nghiệm thu

- Gió mềm, gốc lá không rời cành; động vật không xuyên thân/đá ở các đường đi đã chọn.
- Vào trang thấy đúng một chim, hai sóc ăn, một sóc leo.
- Kéo/zoom làm động vật rời đi, không cản thao tác camera.
- Không quay về trước đủ 30 giây kể từ thao tác cuối; thao tác mới đặt lại thời gian.
- Tương tác liên tiếp không sinh thêm động vật, timer hoặc vòng render.
- Có thể ngắt cảnh mở đầu hoặc cảnh quay về tại bất kỳ lúc nào.
- Camera giữ nguyên hướng đã chọn khi động vật quay lại.
- Danh mục 6 phòng ban và 25 tài liệu vẫn truy cập được.
- Tab ẩn, rời trang, reduced-motion và model tải lỗi đều có hành vi xác định.
- Chỉ ghi FPS thực đo; không suy ra hiệu năng từ số polygon của model.

## Cơ sở kỹ thuật

- [Three.js AnimationMixer](https://threejs.org/docs/pages/AnimationMixer.html): quản lý các đoạn chuyển động cho đối tượng.
- [Three.js AnimationAction](https://threejs.org/docs/pages/AnimationAction.html): trộn chuyển tiếp giữa các động tác.
- [Ví dụ chuyển trạng thái animation của Three.js](https://threejs.org/examples/webgl_animation_skinning_morph.html).
- [Material.onBeforeCompile](https://threejs.org/docs/pages/Material.html): sửa shader của WebGLRenderer.
- [OrbitControls events](https://threejs.org/docs/pages/OrbitControls.html): phân biệt bắt đầu/kết thúc thao tác với thay đổi camera.
- [MDN Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API): phát hiện tab ẩn/hiện.
