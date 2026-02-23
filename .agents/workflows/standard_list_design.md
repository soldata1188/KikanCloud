---
description: Áp dụng ngôn ngữ thiết kế quản lý dữ liệu tiêu chuẩn (từ trang Danh sách Ngoại kiều)
---
# Hướng dẫn áp dụng Thiết Kế Tiêu Chuẩn

Khi được yêu cầu áp dụng "thiết kế tiêu chuẩn" hoặc "ngôn ngữ thiết kế tiêu chuẩn" cho một trang hiển thị danh sách/quản lý dữ liệu mới, hãy thực hiện các bước sau để đảm bảo sự đồng bộ toàn diện với trang `WorkersListClient`:

## 1. Cấu trúc Layout Tổng thể
- Layout chính sử dụng Flexbox cột: `<div className="flex flex-col gap-6">`
- Luôn có hai thành phần chính: **Vùng Filter (Bộ lọc)** và **Vùng Data hiển thị**.

## 2. Vùng Lọc Trạng Thái (Status Cards)
- Sử dụng các Thẻ Trạng thái dạng nút bấm phía trên (thay vì Dropdown select).
- **Cấu trúc HTML/Tailwind:**
```tsx
<div className="flex flex-wrap gap-6 mt-2 ml-2">
  {STATUS_KEYS.map(statusKey => {
      // Logic đếm số lượng, active
      return (
          <div key={statusKey} onClick={() => toggleStatus(statusKey)} className="group relative flex flex-col min-w-[120px] pr-4 py-2 cursor-pointer transition-all duration-200 ease-out">
              <div className="flex justify-between items-center mb-1.5">
                  <span className={`text-sm font-bold tracking-wide transition-colors ${isActive ? 'text-[#198f63]' : 'text-gray-500 group-hover:text-gray-800'}`}>
                      {STATUS_MAP[statusKey] || statusKey}
                  </span>
                  <div className={`relative inline-flex h-[18px] w-8 shrink-0 items-center rounded-full transition-colors duration-300 ${isActive ? 'bg-[#24b47e] shadow-inner' : 'bg-gray-200 group-hover:bg-gray-300'}`}>
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${isActive ? 'translate-x-[16px]' : 'translate-x-[3px]'}`} />
                  </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                  <span className={`text-3xl font-black font-sans tracking-tight transition-colors ${isActive ? 'text-[#13734e]' : 'text-gray-700 group-hover:text-gray-900'}`}>
                      {count}
                  </span>
                  <span className={`text-sm font-medium transition-colors ${isActive ? 'text-[#24b47e]' : 'text-gray-400 group-hover:text-gray-500'}`}>名</span> {/* Có thể đổi hậu tố danh từ đếm */}
              </div>
          </div>
      )
  })}
</div>
```

## 3. Advanced Filters (Các bộ lọc khác)
- Các `select` box lọc khác (Công ty, Quốc tịch, v.v) cần được nhúng gọn gàng vào Props của `DataTableToolbar`.
- **CSS thẻ <select>:** `h-[32px] w-[140px] bg-white border border-gray-350 hover:bg-gray-50 rounded-md px-2 text-[12px] outline-none focus:border-[#878787] transition-colors text-[#1f1f1f] cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap`
- **Nút Clear filter:** `text-[12px] text-[#24b47e] hover:text-[#1e9a6a] transition-colors ml-1 font-medium select-none`
- **Thanh dọc (Divider):** `<div className="w-px h-[24px] bg-gray-300 mx-1"></div>`

## 4. Bảng Dữ Liệu (Table View)
- Bảng phải nằm trong lớp bao bọc `<div className="overflow-x-auto pb-16">`
- Thẻ `<table>`: `w-full border-collapse text-sm text-left whitespace-nowrap`
- Thẻ `<thead>`: `bg-gray-50 text-gray-800`
- Các thẻ `<th>`: `border border-gray-350 px-4 py-3 font-semibold`
- Dòng Hover trong `<tbody>`: `<tr className={"transition-colors hover:bg-gray-50 " + (isChecked ? "bg-green-50/50" : "")}>`
- Mọi thẻ `<td>`: `border border-gray-350 px-4 py-3 align-top`

## 5. View dạng lưới (Grid View)
- Nếu có, Grid view sử dụng: `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-16">`
- Mỗi item trong grid: `group relative bg-white border rounded-md p-5 transition-colors duration-200 border-gray-350 hover:border-[#24b47e]`

## 6. Contextual Action Bar (Thanh Sửa Đổi Hàng Loạt Inline)
- Bất cứ khi nào mảng `selectedIds.length > 0`, hiển thị Contextual Action Bar **ngay phía trên bảng**, không dùng bảng nổi ở footer.
- **Cấu trúc HTML/Tailwind Inline Bar:**
```tsx
<div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-top-2">
  <span className="text-sm font-semibold text-green-800 shrink-0">
      {selectedIds.length} 件選択中
  </span>
  <div className="flex items-center gap-3 border-l border-green-200 pl-4 flex-wrap flex-1">
      {/* Nút thao tác nhanh (dropdown trạng thái, sửa đổi, xóa, v.v) */}
      {/* Nút dạng text thường: flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded transition-colors shadow-sm bg-white border */}
  </div>
</div>
```

## 7. Các tiện ích UI (Typography, Colors)
- Trạng thái chữ xanh chính: `text-[#24b47e]`
- Border xám tiêu chuẩn: `border-gray-350`
- Chữ phụ trợ / nhãn: `text-[#878787] text-xs`
- Nhãn huy hiệu nhỏ (VD trạng thái trong grid): `px-2 py-0.5 border rounded-md text-[10px] font-bold uppercase tracking-widest bg-transparent`

> Áp dụng file Workflow này cho mọi trang Quản trị danh sách dữ liệu để có trải nghiệm thị giác và thao tác UX thống nhất tuyệt đối trong toàn hệ thống SaaS.
