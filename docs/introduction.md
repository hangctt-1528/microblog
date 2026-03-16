# 🌟 Giới Thiệu Sản Phẩm

**Microblog** là nền tảng blog cá nhân hiện đại — nơi bạn viết ý tưởng, chia sẻ kiến thức và kết nối với độc giả chỉ trong vài phút. Giao diện tối giản, tốc độ nhanh, dễ sử dụng cho cả người đọc lẫn người quản trị.

> A minimal, fast, full-stack microblog — write in Markdown, publish instantly, moderate comments, manage tags — all from a built-in CMS.

---

## 📱 Màn Hình Sản Phẩm

### Trang chủ — Danh sách bài viết

> Hiển thị toàn bộ bài viết đã xuất bản, sắp xếp theo thời gian mới nhất. Mỗi bài viết có tiêu đề, trích dẫn nội dung, danh sách thẻ tag và ngày đăng.

🔗 **Demo:** https://project-0e66m-79lo03ksi-chuhangpt96-8349s-projects.vercel.app/

![Trang chủ](screenshots/Home.png)

---

### Chi Tiết Bài Viết

> Đọc toàn bộ nội dung bài viết được render từ Markdown. Phía cuối trang hiển thị phần bình luận từ độc giả đã được phê duyệt.

🔗 **Demo:** https://project-0e66m-79lo03ksi-chuhangpt96-8349s-projects.vercel.app/posts/why-i-love-remote-work

![Chi tiết bài viết](screenshots/post_detail.png)

---

### Trang Tag — Lọc Bài Viết Theo Chủ Đề

> Click vào một thẻ tag để xem tất cả bài viết thuộc chủ đề đó.

🔗 **Demo:** https://project-0e66m-79lo03ksi-chuhangpt96-8349s-projects.vercel.app/tags/productivity

![Trang tag](screenshots/post_by_tag.png)

---

### Bình Luận — Gửi Phản Hồi Bài Viết

> Độc giả có thể gửi bình luận ngay dưới bài viết mà không cần tạo tài khoản. Bình luận sẽ được kiểm duyệt trước khi hiển thị công khai.

🔗 **Demo:** https://project-0e66m-79lo03ksi-chuhangpt96-8349s-projects.vercel.app/posts/why-i-love-remote-work#comments

![Form bình luận](screenshots/sumit_comment.png)

---

### Admin — Đăng Nhập CMS

> Người quản trị đăng nhập bằng email và mật khẩu. Phiên đăng nhập được bảo vệ bởi cookie bảo mật.

🔗 **Demo:** https://project-0e66m-79lo03ksi-chuhangpt96-8349s-projects.vercel.app/admin/login

![Trang đăng nhập](screenshots/Login.png)

---

### Admin — Quản Lý Bài Viết

> Danh sách tất cả bài viết với trạng thái (Đã xuất bản / Nháp). Admin có thể tạo mới, chỉnh sửa hoặc xóa bài viết trực tiếp từ đây.

🔗 **Demo:** https://project-0e66m-79lo03ksi-chuhangpt96-8349s-projects.vercel.app/admin/posts

![Quản lý bài viết](screenshots/admin_posts.png)

---

### Admin — Soạn Thảo Bài Viết

> Trình soạn thảo Markdown đầy đủ tính năng: tiêu đề, slug tự động, nội dung Markdown, gán tag, lưu nháp hoặc xuất bản ngay lập tức.

🔗 **Demo:** https://project-0e66m-79lo03ksi-chuhangpt96-8349s-projects.vercel.app/admin/posts/new

![Soạn thảo bài viết](screenshots/new_post.png)

---

### Admin — Kiểm Duyệt Bình Luận

> Danh sách tất cả bình luận đang chờ phê duyệt. Admin có thể duyệt hoặc từ chối từng bình luận chỉ với một click.

🔗 **Demo:** https://project-0e66m-79lo03ksi-chuhangpt96-8349s-projects.vercel.app/admin/comments

![Kiểm duyệt bình luận](screenshots/admin_comment.png)

---

### Admin — Quản Lý Tag

> Tạo mới, đổi tên hoặc xóa tag. Tag đang được sử dụng bởi bài viết sẽ không thể xóa, đảm bảo dữ liệu toàn vẹn.

🔗 **Demo:** https://project-0e66m-79lo03ksi-chuhangpt96-8349s-projects.vercel.app/admin/tags

![Quản lý tag](screenshots/admin_tags.png)

---

## 👤 Trải Nghiệm Người Dùng (Độc Giả)

Microblog mang đến trải nghiệm đọc blog mượt mà, không quảng cáo, không rắc rối:

| Tính năng | Mô tả |
|-----------|-------|
| 📰 **Đọc bài viết** | Toàn bộ nội dung được hiển thị đẹp mắt, hỗ trợ Markdown với heading, code block, hình ảnh |
| 🏷️ **Khám phá theo chủ đề** | Click vào tag để lọc ngay bài viết cùng chủ đề |
| 💬 **Gửi bình luận** | Để lại phản hồi không cần đăng ký tài khoản, chỉ cần nhập tên và email |
| ⚡ **Tốc độ cao** | Trang được render phía server, tải cực nhanh ngay cả trên mạng chậm |
| 📱 **Responsive** | Hiển thị tốt trên mọi thiết bị: điện thoại, máy tính bảng, laptop |

**Hành trình của một độc giả điển hình:**

```
Vào trang chủ
  → Lướt danh sách bài viết mới nhất
  → Click vào bài viết yêu thích
  → Đọc nội dung chi tiết
  → Click tag để khám phá bài viết liên quan
  → Gửi bình luận / phản hồi
```

---

## 🛠️ Trải Nghiệm Quản Trị Viên (Admin)

Microblog CMS cho phép quản trị viên kiểm soát toàn bộ nội dung từ một giao diện duy nhất, đơn giản và trực quan:

### ✍️ Tạo & Quản Lý Bài Viết

1. **Đăng nhập** tại `/admin/login` bằng email và mật khẩu
2. Vào **Danh sách bài viết** — xem toàn bộ bài viết với trạng thái hiện tại
3. Click **"New Post"** → mở trình soạn thảo:
   - Nhập tiêu đề → slug URL tự động được tạo
   - Viết nội dung bằng **Markdown** (hỗ trợ heading, in đậm, code, hình ảnh, link...)
   - Gán một hoặc nhiều **tag** cho bài viết
   - Chọn **"Save Draft"** để lưu nháp chưa công khai
   - Chọn **"Publish"** để xuất bản ngay lập tức
4. Muốn chỉnh sửa → click nút **Edit** bên cạnh bài viết bất kỳ
5. Muốn gỡ xuống → click **Unpublish** → bài viết trở về trạng thái nháp

### 🔖 Quản Lý Tag

1. Vào mục **Tags** trên thanh sidebar
2. Nhập tên tag mới → click **"Add Tag"**
3. Đổi tên hoặc xóa tag không còn sử dụng
4. Tag đang gán cho bài viết sẽ bị khóa xóa cho đến khi gỡ khỏi tất cả bài viết

### 💬 Kiểm Duyệt Bình Luận

1. Vào mục **Comments** trên thanh sidebar
2. Xem danh sách bình luận đang **chờ duyệt**
3. Click **"Approve"** → bình luận hiển thị công khai dưới bài viết
4. Click **"Reject"** → bình luận bị ẩn vĩnh viễn, không hiển thị cho độc giả

**Quy trình làm việc của Admin:**

```
Đăng nhập /admin/login
  → Soạn bài mới hoặc chỉnh sửa bài cũ
  → Lưu nháp hoặc xuất bản
  → Kiểm duyệt bình luận mới từ độc giả
  → Quản lý danh sách tag
  → Đăng xuất
```
