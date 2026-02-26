---
description: Premium Flat Design Language (KikanCloud)
---

### 🎨 Color Palette
- **System Background (Sidebar/Header)**: `#f1f5f9` (Light Slate/Gray)
- **Main Content Background**: `white`
- **Primary Accent**: `#24b47e` (Kikan Green)
- **Border Color**: `slate-200` (Ultra-thin gray)
- **Hover States**: `bg-black/5` (Soft dark tint) or `bg-white/5` (for dark elements)

### 📐 Layout & Borders
- **Global Flatness**: No heavy shadows (`shadow-2xl`, etc.). Use subtle `shadow-sm` or no shadow at all.
- **Ultra-thin Borders**: Use `border border-slate-200` for all cards, table containers, and navigational items.
- **Header/Sidebar**: 
    - TopNav: `h-10 bg-[#f1f5f9] border-b border-slate-200`
    - Sidebar: `bg-[#f1f5f9] border-r border-slate-200`

### ✨ Components
- **Cards**: `bg-white rounded-[32px] border border-slate-200`
- **Tables**: 
    - Header: `bg-slate-50/30 text-slate-400 font-extrabold uppercase border-b border-slate-100`
    - Rows: `hover:bg-slate-50 border-b border-slate-100/50`
- **Search Bar**: `h-[30px] bg-[#fbfcfd] border border-slate-200 rounded-md`
- **Buttons (Flat)**: `p-1.5 rounded-md border border-slate-200 bg-white hover:bg-gray-50`

### 🚀 Implementation Workflow
1. Use `bg-[#f1f5f9]` for navigation containers.
2. Use `bg-white` for the main content area.
3. Replace all standard gray borders (`border-gray-200`, `gray-350`) with `border-slate-200`.
4. Ensure `rounded` values are consistent (usually `rounded-[32px]` for large cards, `rounded-md` for small items).
