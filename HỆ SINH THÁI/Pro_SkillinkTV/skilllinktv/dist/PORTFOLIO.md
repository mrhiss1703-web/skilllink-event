# SkillLinkTV — Portfolio
Website tĩnh: HTML/CSS/JavaScript, không cần build. Giữ thư mục dist nguyên vẹn khi triển khai GitHub Pages.
- index.html: giới thiệu, dịch vụ, giám đốc, tư liệu nổi bật và liên hệ.
- portfolio.html: danh sách, bộ lọc và nút xem thêm (6 mục/lượt).
- project.html?id=...: chi tiết, Masonry, lightbox và video bấm mới tải.
- projects.js: nguồn dữ liệu chung.
- app.js: điều hướng, bộ lọc, chi tiết, lightbox, vuốt.
- assets/thumbs/: thumbnail WebP từ ảnh thực tế; ảnh gốc không thay đổi.

## Thêm dự án
Thêm vào SKILLLINK_PORTFOLIO.projects trong projects.js:
```js
{
 id: 'ten-du-an',
 name: 'Tên dự án đã xác nhận',
 category: 'photo', // photo, video hoặc event
 cover: 'assets/projects/ten-du-an/cover.jpg',
 thumbnail: 'assets/projects/ten-du-an/cover.webp',
 description: 'Mô tả dự án thực tế.',
 featured: true, // tối đa 6 dự án trên trang chủ
 images: [
  {src:'assets/projects/ten-du-an/01.jpg', thumbnail:'assets/projects/ten-du-an/01.webp',
   alt:'Mô tả ảnh', width:1707, height:2560}
 ],
 // video: 'assets/projects/ten-du-an/video.mp4'
}
```
Tạo tài nguyên trước và dùng đường dẫn tương đối với dist. Không cần viết HTML hoặc thêm route.
Có thể tổ chức assets/projects/<id>/ cho bộ mới; không cần di chuyển ảnh cũ.

## Album hiện tại
- Chân dung phố đêm: project-1.jpg…project-4.jpg; bìa ảnh 1.
- Concept Kimono: project-5.jpg…project-8.jpg; bìa ảnh 8.
Tên album mô tả nội dung ảnh; có thể sửa name và description trong projects.js.
Video project.mp4 vẫn nằm riêng trong unclassified vì chưa xác nhận thuộc dự án nào.
Danh mục sự kiện hiện trống vì chưa có thông tin xác nhận.

## Xem tại máy
Mở index.html trực tiếp hoặc chạy python -m http.server 8080 từ thư mục dự án.
Kiểm tra mobile ở 360/390/760px, desktop 1440px; thử tất cả bộ lọc, xem thêm,
chi tiết, ảnh trước/sau, ESC, vuốt, phát video và liên kết qua các nhánh.
