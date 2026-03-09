---
description: Thiết kế tiêu chuẩn KikanCloud - Áp dụng cho trang Quản lý Nghiệp vụ (Operations)
---

# Hướng dẫn áp dụng Thiết Kế Tiêu Chuẩn "App Shell" - KikanCloud (Operations Module)

Khi được yêu cầu áp dụng hoặc duy trì "thiết kế tiêu chuẩn", "ngôn ngữ thiết kế" cho trang `OperationsClient` hoặc xây dựng các Module phức tạp tương tự có cấu trúc nhiều cột dọc (Multi-column Dashboard), hãy HIỂM ĐỊNH VÀ TUÂN THỦ NGHIÊM NGẶT các quy tắc sau đây để đảm bảo giao diện nguyên khối (Unified Shell).

## 1. Triết Lý Thiết Kế Cốt Lõi (Core Philosophy)
- **Phương pháp L-Shape Dark Shell & Light Canvas:**
  - **Sidebar (Menu trái):** Là trục mỏ neo không gian, sử dụng BẮT BUỘC viền Dark Navy (`linear-gradient(180deg, #1e3a5f 0%, #0f2645 100%)`).
  - **KHÔNG sử dụng Dark Navy ở bất kỳ header ngang nào khác:** Để tránh phân mảnh (Zebra effect/Checkerboard effect).
  - **Canvas Bên Phải:** Từ Thanh Top Header trên cùng kéo xuống toàn bộ dữ liệu bên dưới phải là một CẢNH QUAN SÁNG MÀU (Light Theme) đồng nhất, liền mạch.

## 2. Thanh Global Top Header
- **Background & Cấu trúc:**
  - CSS bắt buộc: `h-[42px] bg-white/90 backdrop-blur-sm border-b border-gray-200 flex items-center justify-between px-4 z-30 shrink-0`
  - Logo/Tiêu đề trang: Nổi bật chữ tố, Icon hoặc text nhấn sử dụng màu `text-blue-600` (Ví dụ: `業務<span className="text-blue-600">管理</span>`).
- **Thanh Tìm kiếm (Search) & Bộ lọc (Filters) & Nút (Buttons):**
  - Chìm nhẹ vào nền Trắng: Nền hộp `bg-slate-100` hoặc `#F4F5F7`.
  - Icon: xám mờ `text-gray-400`.
  - Khi `focus` hoặc `hover`: Border và Text chuyển qua màu tương tác chính `blue-600` hoặc `blue-400`. Background thành Trắng tinh `bg-white` hắt bóng nhẹ `shadow-sm`.

## 3. Hệ Thống 4 Cột Dữ Liệu (Entry Batch, Company, Worker, Operations)
- **Chiều cao cố định đồng nhất (Fixed Card Height):**
  - Mọi thẻ Item (Thẻ Kỳ sinh, Thẻ Công ty, Thẻ Lao động) BẮT BUỘC phải cao CHÍNH XÁC `h-[52px]`. Quy tắc này đảm bảo một hệ trục lưới ngang hoàn hảo khi người dùng lướt mắt qua các cột.
- **Tiêu Đề Cột (Column Headers):**
  - KHÔNG DÙNG DARK NAVY.
  - CSS bắt buộc: `px-4 py-3.5 border-b border-gray-200 bg-slate-50/80 flex items-center justify-between shrink-0`.
  - Chữ tiêu đề: Màu xám đậm sang trọng `text-slate-800`.
  - Icon phân loại: `text-blue-600`.
  - Thẻ số lượng (Badge đếm): Nền trắng có viền và đổ bóng mỏng `bg-white border border-gray-200 text-blue-600 shadow-sm`.

## 4. Ngôn Ngữ Trạng Thái "Được Chọn" (Selected State Blueprint)
- Khi User click/chọn một item ở BẤT CỨ CỘT NÀO, nguyên tắc Highlight KHÔNG ĐƯỢC LỆCH PHA.
- Dẹp bỏ màu Hổ Phách (Amber), Lục (Green) lộn xộn. Bắt buộc dùng **Hệ sinh thái Blue-50**:
  - Box nền: `bg-blue-50/50` (hoặc `bg-blue-50` đối với Thẻ Item).
  - Viền Trái (Left Border Highlight): `border-l-[3px] border-blue-500`.
  - Viền dưới hộp (Nội bộ cột Operations): `border-blue-200 bg-blue-100`.
  - Icon/Avatar bên trong thẻ: `bg-blue-500 text-white`.
  - Chữ Text quan trọng: `text-blue-900` (để đọc rõ) và `text-blue-600` (để highlight phụ).

## 5. Tổ Chức Bố Cục Thẻ Lao Động (Worker Card Redesign Layout)
- Bắt buộc áp dụng cấu trúc **2 ROWS COMPACT** (2 Hàng Nén) nhét vừa trong chiều cao `52px`:
  - **Hàng 1 (Top Row):** Trái (Avatar Vuông nhỏ `w-6 h-6` + Tên người in hoa font Black cắt chữ `truncate`); Phải (Số ngày gia hạn, VD: あと..日 với CSS `text-rose-600` nếu gấp).
  - **Hàng 2 (Bottom Row):** Trái (Tên công ty màu Xám mờ `text-gray-400`); Phải (Cụm Badge loại thẻ Visa + Status tag).

## 6. Các Nút Kéo Thả (Resize Handle)
- **Tối giản hóa:** Xóa bớt các thanh resize không cần thiết (Ví dụ giữa Company và Worker) nếu chúng có thể gộp chung chiều rộng `width`.
- **CSS Thanh Resize (Cơ bản):** Một đường kẻ dọc xám mỏng `w-[1px] bg-gray-200`, khi đưa chuột vào `hover:bg-blue-500` sẽ hiện 3 dấu chấm (Dot handler) ở giữa trục.
  
> Áp dụng file Workflow này TỰ ĐỘNG khi tiến hành sửa đổi, bảo trì hoặc thêm mới các cột vào cấu trúc màn hình "Quản lý dữ liệu đa cấp" (Multi-columns view) để duy trì chất lượng thẩm mỹ UI/UX cao cấp nhất!
