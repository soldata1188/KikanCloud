import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@/lib/supabase/server';

export interface AnomalyItem {
    id: string;
    severity: 'high' | 'medium' | 'low';
    icon: 'building' | 'user' | 'file' | 'clock';
    title: string;
    description: string;
    href: string;
    count?: number;
}

export async function GET() {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: 'GEMINI_API_KEY missing' }, { status: 500 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('users').select('tenant_id').eq('id', user.id).single();
        if (!profile?.tenant_id) return NextResponse.json({ error: 'No tenant' }, { status: 400 });

        const tenantId = profile.tenant_id;
        const today = new Date();
        const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate()).toISOString().split('T')[0];
        const nineMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 9, today.getDate()).toISOString().split('T')[0];
        const sixtyDaysAgo = new Date(today.getTime() - 60 * 86400000).toISOString();
        const in60Days = new Date(today.getTime() + 60 * 86400000).toISOString().split('T')[0];
        const todayStr = today.toISOString().split('T')[0];

        // Parallel queries
        const [workersRes, companiesRes, auditsRes] = await Promise.all([
            supabase.from('workers')
                .select('id, full_name_romaji, status, updated_at, residence_card_exp_date, passport_exp_date, companies(id, name_jp)')
                .eq('tenant_id', tenantId)
                .eq('is_deleted', false),
            supabase.from('companies')
                .select('id, name_jp')
                .eq('tenant_id', tenantId)
                .eq('is_deleted', false),
            supabase.from('audits')
                .select('company_id, actual_date, status')
                .eq('is_deleted', false)
                .eq('status', 'completed')
                .gte('actual_date', nineMonthsAgo),
        ]);

        const workers = workersRes.data || [];
        const companies = companiesRes.data || [];
        const recentAudits = auditsRes.data || [];

        // Build last-audit-date map per company
        const lastAuditMap = new Map<string, string>();
        recentAudits.forEach(a => {
            const existing = lastAuditMap.get(a.company_id);
            if (!existing || a.actual_date > existing) lastAuditMap.set(a.company_id, a.actual_date);
        });

        // Worker → company map
        const workerCompanyMap = new Map<string, string>();
        workers.forEach(w => {
            const cid = (w.companies as any)?.id;
            if (cid) {
                workerCompanyMap.set(cid, (workerCompanyMap.get(cid) || '0'));
                const cnt = parseInt(workerCompanyMap.get(cid) || '0') + 1;
                workerCompanyMap.set(cid, String(cnt));
            }
        });

        // ── Anomaly 1: Companies with active workers but no audit in 6+ months
        const auditOverdueCompanies: { name: string; monthsAgo: number; workerCount: number }[] = [];
        companies.forEach(c => {
            const wCount = parseInt(workerCompanyMap.get(c.id) || '0');
            if (wCount === 0) return;
            const lastAudit = lastAuditMap.get(c.id);
            if (!lastAudit) {
                // Never audited
                auditOverdueCompanies.push({ name: c.name_jp, monthsAgo: 999, workerCount: wCount });
            } else if (lastAudit < sixMonthsAgo) {
                const months = Math.floor((today.getTime() - new Date(lastAudit).getTime()) / (30 * 86400000));
                auditOverdueCompanies.push({ name: c.name_jp, monthsAgo: months, workerCount: wCount });
            }
        });
        auditOverdueCompanies.sort((a, b) => b.monthsAgo - a.monthsAgo);

        // ── Anomaly 2: Workers with status='active' not updated in 60+ days
        const staleActiveWorkers = workers.filter(
            w => w.status === 'active' && w.updated_at && w.updated_at < sixtyDaysAgo
        );

        // ── Anomaly 3: Workers with BOTH visa AND passport expiring within 60 days
        const dualExpiryWorkers: { name: string; company: string; visaDays: number; passportDays: number }[] = [];
        workers.forEach(w => {
            if (!w.residence_card_exp_date || !w.passport_exp_date) return;
            const visaDays = Math.ceil((new Date(w.residence_card_exp_date).getTime() - today.getTime()) / 86400000);
            const passportDays = Math.ceil((new Date(w.passport_exp_date).getTime() - today.getTime()) / 86400000);
            if (visaDays >= 0 && visaDays <= 60 && passportDays >= 0 && passportDays <= 60) {
                dualExpiryWorkers.push({
                    name: w.full_name_romaji || '不明',
                    company: (w.companies as any)?.name_jp || '不明',
                    visaDays,
                    passportDays,
                });
            }
        });

        // Build raw anomaly summary for Gemini
        const rawAnomalies = [];

        if (auditOverdueCompanies.length > 0) {
            rawAnomalies.push({
                type: 'audit_overdue',
                count: auditOverdueCompanies.length,
                details: auditOverdueCompanies.slice(0, 3).map(c =>
                    `${c.name}（${c.monthsAgo === 999 ? '監査履歴なし' : `${c.monthsAgo}ヶ月以上未実施`}、${c.workerCount}名在籍）`
                ).join('、'),
            });
        }
        if (staleActiveWorkers.length > 0) {
            rawAnomalies.push({
                type: 'stale_workers',
                count: staleActiveWorkers.length,
                details: `在籍中の外国人労働者${staleActiveWorkers.length}名の情報が60日以上更新されていません。`,
            });
        }
        if (dualExpiryWorkers.length > 0) {
            rawAnomalies.push({
                type: 'dual_expiry',
                count: dualExpiryWorkers.length,
                details: dualExpiryWorkers.slice(0, 2).map(w =>
                    `${w.name}（${w.company}）: 在留カード残り${w.visaDays}日・パスポート残り${w.passportDays}日`
                ).join('、'),
            });
        }

        if (rawAnomalies.length === 0) {
            return NextResponse.json({
                anomalies: [],
                generatedAt: new Date().toISOString(),
            });
        }

        // Send to Gemini for analysis
        const contextBlock = `
以下は監理団体の業務システムが自動検出した異常パターンです。各異常について分析し、担当者が今すぐ理解できる簡潔な日本語の説明と対応アドバイスを提供してください。

${rawAnomalies.map((a, i) => `[異常${i + 1}] タイプ: ${a.type}\n件数: ${a.count}件\n詳細: ${a.details}`).join('\n\n')}
`;

        const systemInstruction = `
あなたは外国人技能実習・特定技能制度の専門AIアシスタントです。
検出された業務異常を分析し、以下のJSON形式で回答してください（マークダウン不可）:

{
  "anomalies": [
    {
      "id": "一意のID文字列",
      "severity": "high | medium | low",
      "icon": "building | user | file | clock",
      "title": "異常のタイトル（最大25文字）",
      "description": "具体的な状況説明と推奨アクション（2〜3文、最大100文字）",
      "href": "/audits または /workers または /companies",
      "count": 数値
    }
  ]
}

severity判定基準: high=即対応必要、medium=今週中に対応、low=今月中に確認。
異常タイプとiconの対応: audit_overdue→building、stale_workers→user、dual_expiry→file。
最大3件まで、重要度順に並べてください。
`;

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: contextBlock }] }],
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                temperature: 0.2,
            },
        });

        const text = result.text ?? '{}';
        const parsed = JSON.parse(text);
        const anomalies: AnomalyItem[] = Array.isArray(parsed.anomalies)
            ? parsed.anomalies.slice(0, 3)
            : [];

        return NextResponse.json({
            anomalies,
            generatedAt: new Date().toISOString(),
        });

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Something went wrong.';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
