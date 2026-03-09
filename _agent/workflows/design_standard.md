---
description: Thiết kế tiêu chuẩn KikanCloud - dựa trên trang 業務管理
---

# KikanCloud Design Standard
> **Nguồn gốc:** Được đóng cứng từ trang 業務管理 (Operations) ngày 2026-03-06.
> Mọi trang mới hoặc chỉnh sửa đều PHẢI tuân theo các quy tắc này.

---

## 1. TRIẾT LÝ THIẾT KẾ

- **Flat Design tuyệt đối** — KHÔNG dùng `shadow-*` bất kỳ chỗ nào
- **Pure White** — Nền tất cả các cột/panel: `bg-white`
- **Minimalist** — Không dùng gradient background cho layout chính
- **Border-based separation** — Dùng `border` mỏng để phân tách, không dùng shadow

---

## 2. LAYOUT TỔNG THỂ

```
┌─────────────────────────────────────────────────────┐
│  TopNav   h-[42px]  bg-white/70  border-b           │
├────┬────────────────────────────────────────────────┤
│    │  Page Header   h-[42px]  bg-white  border-b    │
│    ├──────────────┬───────────────┬─────────────────┤
│    │  Column A    │  Column B     │  Column C       │
│Sidebar│  (resizable)│  (resizable)  │  (flex-1)      │
│w-14│              │               │                 │
│    │              │               │                 │
└────┴──────────────┴───────────────┴─────────────────┘
```

---

## 3. TOPNAV

**File:** `src/components/TopNav.tsx`

| Property | Value |
|----------|-------|
| Height | `h-[42px]` |
| Background | `bg-white/70 backdrop-blur-md` |
| Border | `border-b border-slate-200` |
| Padding | `px-4` |
| Shadow | ❌ Không dùng |
| App name font | `text-[13px] font-black text-blue-600` |
| Page title font | `text-[12px] font-bold text-gray-900` |
| Avatar size | `w-7 h-7 rounded-full` |

---

## 4. PAGE HEADER (Sub-header trong mỗi trang)

| Property | Value |
|----------|-------|
| Height | `h-[42px]` |
| Background | `bg-white/90 backdrop-blur-sm` |
| Border | `border-b border-gray-350` |
| Padding | `px-4` |
| Title font | `text-[13px] font-black tracking-tighter` |
| Search input height | `h-7` |
| Search font | `text-[12px] font-bold` |
| Refresh button | `p-1.5 rounded` icon size `14` |
| Avatar | `w-7 h-7 rounded-full` |

---

## 5. COLUMN HEADERS (Tiêu đề cột danh sách)

| Property | Value |
|----------|-------|
| Padding | `px-4 py-3.5` |
| Background | `bg-white` |
| Border bottom | `border-b border-[color]` (theo màu của cột) |
| Font | `text-[13px] font-black uppercase tracking-widest` |
| Icon size | `17` |
| Count badge | `text-[9px] font-bold bg-gray-50 px-1.5 py-0.5 rounded border` |

**Màu cột:**
- 企業リスト: `text-[#5B7EC2]` / `border-[#E8EAF0]`
- 労働者リスト: `text-[#4A9B82]` / `border-[#E0EBE8]`
- 業務オペレーション: `text-yellow-700` / `border-yellow-100`

---

## 6. COLUMN WIDTHS (Resizable)

| Cột | Default | Min | Max |
|-----|---------|-----|-----|
| 企業リスト | `400px` | `200px` | `500px` |
| 労働者リスト | `400px` | `280px` | `600px` |
| 業務オペレーション | `flex-1` | `400px` | — |

**Resize handle:** `w-[1px]` với grip dots 5 chấm, hiện khi hover, màu theo cột.
**Cột 業務オペレーション content:** `max-w-[780px] mx-auto` để căn giữa trên màn rộng.

---

## 7. MODULE CARDS (業務オペレーション)

| Property | Value |
|----------|-------|
| Border radius | `rounded-md` (6px) |
| Border | `border border-gray-200` |
| Background | `bg-white` |
| Header padding | `px-4 py-2.5` |
| Gap between modules | `space-y-4` |

**Màu header theo nhóm:**
| Module | Header BG | Header Border | Text |
|--------|-----------|---------------|------|
| 機構業務, 入管業務, 就労システム | `bg-blue-50` | `border-blue-100` | `text-blue-800` |
| 検定業務, 送迎・帰国支援 | `bg-emerald-50` | `border-emerald-100` | `text-emerald-800` |
| MEMO / 備考 | `bg-amber-50` | `border-amber-100` | `text-amber-800` |

---

## 8. INLINE FIELDS (Trong module cards)

```tsx
// Layout: label trái cố định + value phải flex-1
<div className="flex items-center gap-3 px-4 py-1 border-b border-gray-100">
  <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] w-[72px] shrink-0">
  <div className="flex-1 min-w-0"> /* input hoặc select */
```

| Property | Value |
|----------|-------|
| Label width | `w-[72px] shrink-0` |
| Label font | `text-[9px] font-black text-gray-400 uppercase tracking-[0.15em]` |
| Value font | `text-[12px] font-black text-gray-900` |
| Row padding | `py-1` |
| Separator | `border-b border-gray-100` |

---

## 9. WORKER LIST GROUPS (労働者リスト)

Mỗi nhóm batch (2025-03生, v.v.) có màu accent riêng từ palette 8 màu, chọn bằng hash của tên batch:

```
Palette: indigo, sky, emerald, amber, rose, violet, teal, orange
```

- **Left border**: `3px solid {color.border}`
- **Text & icon**: `color.text`  
- **Count badge**: `color.badge` background

---

## 10. SIDEBAR

**File:** `src/components/SidebarClient.tsx`

| Property | Value |
|----------|-------|
| Rail width | `w-14` (56px) |
| Rail background | `linear-gradient(180deg, #1e3a5f 0%, #0f2645 100%)` |
| Flyout panel width | `w-[160px]` |
| Flyout background | `rgba(255,255,255,0.92) backdrop-blur(20px)` |

---

## 11. TYPOGRAPHY

- **Font chính**: System font stack (không import Google Fonts thêm)
- **Section labels**: `text-[11px] font-black uppercase tracking-[0.3em] text-gray-400`
- **Column headers**: `text-[13px] font-black uppercase tracking-widest`
- **Module titles**: `text-[12px] font-black uppercase tracking-[0.2em]`
- **Data values**: `text-[12px] font-black text-gray-900`
- **Supporting text**: `text-[11px] font-semibold text-gray-500`

---

## 12. BORDER RADIUS CHUẨN

| Element | Radius |
|---------|--------|
| Module cards | `rounded-md` (6px) |
| Header Profile card | `rounded-md` (6px) |
| Wrapper container | `rounded-[4px]` |
| Buttons nhỏ | `rounded` (4px) |
| Tags/badges | `rounded` (4px) |
| Avatar | `rounded-full` |

---

## 13. QUY TẮC BẮT BUỘC

1. ❌ KHÔNG dùng `shadow-*` bất kỳ chỗ nào
2. ❌ KHÔNG dùng `rounded-xl` hay `rounded-2xl` cho cards/panels
3. ✅ BG luôn là `bg-white` (không xám, không gradient)
4. ✅ Phân tách bằng `border` mỏng
5. ✅ Header cột/page/topnav đều `h-[42px]`
6. ✅ Flat design hoàn toàn
