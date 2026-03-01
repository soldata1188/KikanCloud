---
description: Chuẩn kích thước bảng dữ liệu - Nguyên lý "Fluid with Boundaries" (ECO-MODE V2)
---

# CHUẨN KÍCH THƯỚC BẢNG / GRID — ECO-MODE V2

Áp dụng bắt buộc cho MỌI component hiển thị dữ liệu dạng Danh sách (List/Row) hoặc Bảng (Table).

## 1. Container bọc ngoài (Wrapper)

```tsx
<div className="max-w-7xl mx-auto overflow-x-auto">
  {/* hoặc max-w-[1440px] mx-auto overflow-x-auto */}
```

- `max-w-7xl mx-auto` — giới hạn độ rộng tối đa, căn giữa, chống mỏi mắt màn hình lớn
- `overflow-x-auto` — hỗ trợ cuộn ngang trên màn hình nhỏ

## 2. Khối nội dung bên trong (Inner Grid / Table)

```tsx
<div className="w-full min-w-[1050px]">
  {/* min-w-[1050px] → min-w-[1200px] tùy số cột */}
```

- `w-full` — chiếm toàn bộ không gian cho phép
- `min-w-[1050px]` đến `min-w-[1200px]` — chống vỡ layout khi màn hình nhỏ

## 3. Nguyên tắc chia cột (Flex/Grid Columns)

| Loại cột | Class | Ví dụ |
|---|---|---|
| Cột cố định (Info, Memo, Actions) | `w-[Xpx] shrink-0` | `w-[280px] shrink-0` |
| Cột nội dung co giãn | `flex-1` | dùng cho nội dung chính |

## 4. Template chuẩn

```tsx
{/* Wrapper */}
<div className="max-w-7xl mx-auto px-4 pb-4 overflow-x-auto">
  {/* Inner list */}
  <div className="w-full min-w-[1100px] space-y-3">
    {rows.map(row => (
      <div key={row.id} className="bg-white border border-gray-200 rounded-md flex">
        {/* Fixed col */}
        <div className="w-[300px] shrink-0 border-r border-gray-100 p-3">...</div>
        {/* Flex col */}
        <div className="flex-1 p-3">...</div>
        {/* Fixed action col */}
        <div className="w-[200px] shrink-0 border-l border-gray-100 p-3">...</div>
      </div>
    ))}
  </div>
</div>
```

## 5. Lưu ý bổ sung

- MEMO / Actions column: luôn `shrink-0` với width cố định
- Tránh dùng `w-[1600px] mx-auto` cứng — thay bằng `max-w-7xl mx-auto`
- Sidebar 一括操作 fixed right: `fixed right-0`, không ảnh hưởng layout chính
