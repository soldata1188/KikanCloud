import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: 'GEMINI_API_KEY missing' }, { status: 500 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('users')
            .select('tenant_id, full_name')
            .eq('id', user.id)
            .single();
        if (!profile?.tenant_id) return NextResponse.json({ error: 'No tenant' }, { status: 400 });

        const tenantId = profile.tenant_id;
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const in14Days = new Date(today.getTime() + 14 * 86400000).toISOString().split('T')[0];
        const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
        const staleThreshold = new Date(today.getTime() - 30 * 86400000).toISOString();

        // Parallel queries
        const [workersRes, auditsRes, companiesRes] = await Promise.all([
            supabase
                .from('workers')
                .select('id, full_name_romaji, residence_card_exp_date, passport_exp_date, status, updated_at, companies(name_jp)')
                .eq('tenant_id', tenantId)
                .eq('is_deleted', false),
            supabase
                .from('audits')
                .select('id, audit_type, company_id, scheduled_date, status')
                .eq('is_deleted', false)
                .neq('status', 'completed')
                .gte('scheduled_date', monthStart)
                .lte('scheduled_date', monthEnd),
            supabase
                .from('companies')
                .select('id, name_jp')
                .eq('tenant_id', tenantId)
                .eq('is_deleted', false),
        ]);

        const workers = workersRes.data || [];
        const pendingAudits = auditsRes.data || [];
        const companies = companiesRes.data || [];

        // Build company name lookup
        const companyMap = new Map<string, string>();
        companies.forEach(c => companyMap.set(c.id, c.name_jp));

        // Urgent alerts: visa/passport expiring within 14 days
        const urgentAlerts: { name: string; type: string; daysLeft: number; company: string }[] = [];
        workers.forEach(w => {
            [
                { date: w.residence_card_exp_date, type: '在留カード' },
                { date: w.passport_exp_date, type: 'パスポート' },
            ].forEach(({ date, type }) => {
                if (!date) return;
                const days = Math.ceil((new Date(date).getTime() - today.getTime()) / 86400000);
                if (days >= 0 && days <= 14) {
                    urgentAlerts.push({
                        name: w.full_name_romaji || '不明',
                        type,
                        daysLeft: days,
                        company: (w.companies as any)?.name_jp || '不明',
                    });
                }
            });
        });
        urgentAlerts.sort((a, b) => a.daysLeft - b.daysLeft);

        // Stale workers: active but not updated for 30+ days
        const staleWorkers = workers.filter(
            w => w.status === 'active' && w.updated_at && w.updated_at < staleThreshold
        );

        // Build pending audits with company names
        const pendingAuditDescriptions = pendingAudits.slice(0, 5).map(a => {
            const companyName = companyMap.get(a.company_id) || '不明';
            const typeLabel = a.audit_type === 'kansa' ? '監査訪問' : a.audit_type === 'visit' ? '定期訪問' : a.audit_type;
            return `  - ${companyName}（${typeLabel}、予定日: ${a.scheduled_date}）`;
        });

        const contextBlock = `
[本日の業務状況 - ${todayStr}]
担当者: ${profile.full_name || 'スタッフ'}

■ 緊急アラート（14日以内に期限切れ）: ${urgentAlerts.length}件
${urgentAlerts.slice(0, 5).map(a => `  - ${a.name}（${a.company}）: ${a.type} 残り${a.daysLeft}日`).join('\n') || '  なし'}

■ 今月の未完了監査・訪問: ${pendingAudits.length}件
${pendingAuditDescriptions.join('\n') || '  なし'}

■ 長期未更新の在籍労働者（30日以上更新なし）: ${staleWorkers.length}名

■ 在籍労働者数: ${workers.length}名 / 受入企業数: ${companies.length}社
`;

        const systemInstruction = `
あなたは「KikanCloud」の業務AIアシスタントです。
外国人技能実習・特定技能制度を管理する監理団体の職員をサポートします。
提供された業務データを分析し、以下のJSON形式のみで回答してください（マークダウン記法は使わないこと）:

{
  "greeting": "時間帯に応じた自然な挨拶（1文、最大50文字）",
  "summary": "現在の業務状況の要約（2〜3文。緊急件数・未完了件数などの具体的な数字を含め、担当者が今日何に集中すべきかを端的に述べる）",
  "actions": ["今日すぐ対応すべき具体的なアクション（最大20文字）", "..."]
}

actionsは最重要タスクから3〜5件、動詞で始める具体的な日本語で記述すること。例：「VAN ANHの在留カード更新手続きを開始する」
`;

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: contextBlock }] }],
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                temperature: 0.3,
            },
        });

        const text = result.text ?? '{}';
        const parsed = JSON.parse(text);

        // Validate structure
        const response = {
            greeting: parsed.greeting || 'おはようございます。',
            summary: parsed.summary || '本日の業務状況を確認しました。',
            actions: Array.isArray(parsed.actions) ? parsed.actions.slice(0, 5) : [],
            meta: {
                urgentCount: urgentAlerts.length,
                pendingAudits: pendingAudits.length,
                staleWorkers: staleWorkers.length,
                generatedAt: new Date().toISOString(),
            },
        };

        return NextResponse.json(response);

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Something went wrong.';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
