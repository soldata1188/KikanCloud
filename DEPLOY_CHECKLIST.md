# KikanCloud — Deploy Checklist

## ✅ 最終確認 (2026-03-15)
- TypeScript: 0 errors
- Build: Pass
- Mobile: All 11 pages optimized
- Loading skeletons: 8 pages
- Security headers: ✅
- CSS variables: unified
- Deploy: READY

## 必要な環境変数 (Vercel設定)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
GEMINI_API_KEY=

## Vercel デプロイ設定
- Framework Preset: Next.js
- Build Command: npm run build
- Output Directory: .next
- Node.js Version: 20.x
- Root Directory: ./

## デプロイ前チェックリスト
- [ ] 全環境変数をVercelに設定済み
- [ ] Supabase本番URLに切り替え済み
- [ ] Google Maps API keyのドメイン制限設定
- [ ] Gemini API keyの確認
- [ ] npm run build ローカルでPass確認

## デプロイ後チェックリスト
- [ ] ログイン動作確認
- [ ] 労働者一覧表示確認
- [ ] AI Briefing動作確認 (GEMINI_API_KEY)
- [ ] Google Maps表示確認
- [ ] モバイルレイアウト確認

---

## Environment Variables (Required)

### Client-side (NEXT_PUBLIC_*)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (public) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps JS API key (位置情報マップ) |

### Server-side (secret — never expose to client)
| Variable | Description |
|----------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (admin access) |
| `GEMINI_API_KEY` | Google Gemini API key (AIチャット・自動要約) |

### Optional
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SITE_URL` | Site URL for auth redirects (e.g. https://kikancloud.vercel.app) |

---

## Pre-deploy Steps

### Code Quality
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run build` → passes cleanly
- [ ] No `console.log` left in production code

### Security
- [ ] `typescript.ignoreBuildErrors` is `false` (or removed) in next.config.ts
- [ ] No secrets in NEXT_PUBLIC_ variables
- [ ] `.env.local` not committed to git
- [ ] Supabase RLS enabled on all tables
- [ ] Security headers configured in next.config.ts ✅

### Functionality (manual test on localhost:3000)
- [ ] Login flow (メールアドレス + パスワード)
- [ ] Dashboard loads → AI briefing card
- [ ] Workers list → add/edit/delete worker
- [ ] Companies list → add/edit company
- [ ] Operations board → edit kentei_status
- [ ] Audits → create/edit audit
- [ ] Chat → send message to AI
- [ ] Routing → map loads, markers display
- [ ] Kentei → create/edit/delete record
- [ ] Transfer → create/edit schedule
- [ ] Settings → profile update

### Mobile (Chrome DevTools → 390px width)
- [ ] Sidebar slides in/out on hamburger tap
- [ ] Bottom nav bar visible on all pages
- [ ] Drawers open fullscreen on mobile
- [ ] Tables readable (horizontal scroll or card view)
- [ ] Forms usable with keyboard open

---

## Vercel Deploy Settings

| Setting | Value |
|---------|-------|
| **Framework** | Next.js |
| **Build Command** | `npm run build` |
| **Output Directory** | `.next` |
| **Install Command** | `npm install` |
| **Node.js Version** | 20.x |
| **Root Directory** | `/` (project root) |

### Environment Variables on Vercel
Set all variables from the table above in:
**Vercel Dashboard → Project → Settings → Environment Variables**

Set for: ✅ Production ✅ Preview ✅ Development

---

## Post-deploy Verification

1. **Login** → `https://your-domain.com/login`
2. **Check security headers** → `curl -I https://your-domain.com` (should see X-Frame-Options: DENY)
3. **Check /api/debug returns 404** in production
4. **Google Maps** renders on /routing page
5. **AI Chat** responds on /chat page

---

## Supabase RLS Check

Run in Supabase SQL editor:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```
All tables should have `rowsecurity = true`.

---

## Rollback Plan

1. Vercel → Deployments → Select previous deployment → Redeploy
2. Or: `git revert HEAD` → push → auto-redeploy

---

*Last updated: 2026-03-15*
*Maintainer: KikanCloud Dev Team*
