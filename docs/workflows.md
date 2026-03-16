# 🔄 Workflows

## Post Lifecycle

```
draft ──[Publish]──► published ──[Unpublish]──► draft
                          │
                     [Soft-delete]
                          │
                    deleted_at = now()
              (hidden from public, kept in DB)
```

### Trạng thái bài viết

| Status | Hiển thị công khai | Mô tả |
|--------|-------------------|-------|
| `draft` | ❌ | Đang soạn thảo, chưa xuất bản |
| `published` | ✅ | Đã xuất bản, hiển thị trên trang chủ và tag pages |
| `deleted` (soft) | ❌ | `deleted_at IS NOT NULL`, ẩn khỏi public, data còn trong DB |

### Quy trình Admin

```
Admin tạo bài viết
  → Nhập tiêu đề → slug tự động sinh
  → Viết nội dung Markdown
  → Gán tag
  → Chọn hành động:
       ├── [Save Draft] → status = "draft"   (chưa public)
       └── [Publish]    → status = "published", published_at = now()

Admin chỉnh sửa bài viết đã xuất bản
  → Cập nhật title / body / tags
  → [Save] → giữ status = "published" (thay đổi hiển thị ngay)
  → [Unpublish] → status = "draft" (biến mất khỏi public ngay)

Admin xóa bài viết
  → [Delete] → deleted_at = now() (soft-delete, data còn trong DB)
```

---

## Comment Moderation Flow

```
Reader submits comment
  → status: "pending"   (not visible publicly)
  → Admin reviews in /admin/comments
  → Approve → status: "approved" → visible on post
  → Reject  → status: "rejected" → permanently hidden
```

### Trạng thái bình luận

| Status | Hiển thị dưới bài viết | Mô tả |
|--------|----------------------|-------|
| `pending` | ❌ | Vừa được gửi, chờ admin duyệt |
| `approved` | ✅ | Đã được duyệt, hiển thị công khai |
| `rejected` | ❌ | Bị từ chối, ẩn vĩnh viễn |

### Quy trình Admin kiểm duyệt

```
Admin vào /admin/comments
  → Xem danh sách bình luận status = "pending"
  → Đọc nội dung từng bình luận
  → Chọn hành động:
       ├── [Approve] → status = "approved"
       │               → bình luận hiện ngay dưới bài viết
       └── [Reject]  → status = "rejected"
                       → bình luận ẩn vĩnh viễn
```

---

## Authentication Flow

```
Người dùng truy cập /admin/*
  → middleware.ts kiểm tra session cookie
  → Nếu CHƯA đăng nhập → redirect /admin/login
  → Nếu ĐÃ đăng nhập   → cho phép tiếp tục

Admin đăng nhập
  → POST /admin/login với email + password
  → Supabase Auth xác thực
  → Session lưu vào HttpOnly cookie
  → Redirect về /admin/posts

Admin đăng xuất
  → Xóa session cookie
  → Redirect về /admin/login
```

---

## Tag Safe-Delete Flow

```
Admin muốn xóa tag
  → Hệ thống kiểm tra: tag có đang được gán cho bài viết nào không?
  → Có bài viết dùng tag này?
       ├── Có → ❌ Từ chối xóa, hiển thị thông báo lỗi
       └── Không → ✅ Xóa tag thành công
```
