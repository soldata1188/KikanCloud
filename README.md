# KikanCloud — 基幹管理システム

> Enterprise SaaS platform for managing technical intern trainees and specified skilled workers in Japan.

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Backend / DB | Supabase (PostgreSQL + Auth + Storage) |
| Maps | Google Maps via `@vis.gl/react-google-maps` |
| AI | Google Gemini (Generative AI) |
| Workflow UI | React Flow (`@xyflow/react`) |
| Icons | Lucide React |

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone <repository-url>
cd kikan-saas
npm install
```

### 2. Set Environment Variables

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 📁 Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── companies/        # 受入企業 (Host companies)
│   ├── workers/          # 外国人材 (Foreign workers)
│   ├── operations/       # 業務管理 (Operations management)
│   ├── audits/           # 監査・訪問 (Audit & visits)
│   ├── routing/          # 位置情報マップ (Location map)
│   ├── workflows/        # ワークフロー (Workflow editor)
│   ├── b2b-chat/         # 企業連絡 (B2B chat)
│   ├── portal/           # Worker self-service portal
│   └── login/            # Authentication
├── components/           # Shared UI components
└── lib/                  # Supabase client & utilities
```

---

## 🌐 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com)
3. Add all environment variables from `.env.local`
4. Deploy

### Supabase

- Migrations are in `supabase/migrations/`
- Run `supabase db push` to apply schema changes

---

## 🔒 Security Notes

- `.env.local` is **never committed** (protected by `.gitignore`)
- Row-Level Security (RLS) is enabled on all Supabase tables
- Authentication is handled by Supabase Auth

---

## 📜 License

Private & Confidential — ARATABIZ © 2025
