# ✨ Features

## 📖 Public — Reader

| Feature | Route | Mô tả |
|---------|-------|-------|
| Home timeline | `/` | Toàn bộ bài viết đã xuất bản, mới nhất lên trước, kèm tags và excerpt |
| Post detail | `/posts/[slug]` | Nội dung Markdown render sang HTML đã sanitize |
| Tag pages | `/tags/[slug]` | Lọc bài viết theo tag |
| Comment form | (dưới post detail) | Gửi bình luận không cần tài khoản, chờ kiểm duyệt |

### Chi tiết

- **Home timeline** — hiển thị tất cả bài viết có `status = published`, sắp xếp theo `published_at` mới nhất. Mỗi card có: tiêu đề, excerpt, danh sách tag, ngày đăng.
- **Post detail** — render `body_markdown` thành HTML an toàn bằng thư viện markdown parser. Cuối trang hiển thị danh sách bình luận đã được `approved`.
- **Tag pages** — query `post_tags` JOIN `posts` để lọc theo tag slug. Hiển thị giống home timeline.
- **Comment form** — form đơn giản (tên, email, nội dung), submit qua `POST /api/comments`. Bình luận tạo với `status = pending`.

---

## ✍️ Admin CMS (`/admin`)

> Toàn bộ routes `/admin/*` được bảo vệ bởi middleware — tự động redirect về `/admin/login` nếu chưa xác thực.

| Feature | Route | Mô tả |
|---------|-------|-------|
| Login | `/admin/login` | Đăng nhập email/password, session lưu bằng cookie bảo mật |
| Post list | `/admin/posts` | Danh sách tất cả bài viết kèm trạng thái |
| Create post | `/admin/posts/new` | Trình soạn thảo Markdown, auto-slug, chọn tags |
| Edit post | `/admin/posts/[id]/edit` | Cập nhật tiêu đề, nội dung, slug, tags |
| Comment moderation | `/admin/comments` | Duyệt hoặc từ chối bình luận đang chờ |
| Tag management | `/admin/tags` | Tạo mới, đổi tên, xóa tag |

### Chi tiết

#### 🔐 Xác thực (Auth)
- Sử dụng Supabase Auth với email/password
- Session được lưu dưới dạng cookie HttpOnly, bảo mật
- `middleware.ts` intercept mọi request đến `/admin/*`, kiểm tra session trước khi cho phép tiếp tục

#### 📝 Quản lý bài viết
- **Auto-slug**: Tiêu đề tự động chuyển thành slug URL-friendly (e.g. `"Hello World"` → `hello-world`)
- **Markdown editor**: Textarea hỗ trợ viết Markdown đầy đủ (heading, bold, code block, image, link...)
- **Tags**: Chọn nhiều tag từ danh sách có sẵn, hoặc tạo tag mới từ trang Tags
- **Save Draft**: Lưu `status = draft`, không hiển thị công khai
- **Publish**: Lưu `status = published`, set `published_at = now()`
- **Unpublish**: Chuyển `status = draft`, bài viết biến mất khỏi public ngay lập tức
- **Soft-delete**: Set `deleted_at = now()`, dữ liệu vẫn còn trong DB

#### 💬 Kiểm duyệt bình luận
- Hiển thị tất cả bình luận có `status = pending`
- **Approve** → set `status = approved` → bình luận hiện công khai dưới bài viết
- **Reject** → set `status = rejected` → ẩn vĩnh viễn

#### 🏷️ Quản lý tag
- Tạo tag mới: nhập tên → auto-generate slug → lưu
- Đổi tên tag: cập nhật cả `name` và `slug`
- Xóa tag: chỉ cho phép nếu tag **không** đang được gán cho bài viết nào (safe-delete)
