'use server'
import { createClient } from '@/lib/supabase/server'

export async function getDashboardAIBriefing(userName: string, role: string, systemData: unknown) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('API Key missing');

        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });

        const sd = systemData as any
        const dataContext = JSON.stringify({ workers: sd?.stats?.workers || 0, companies: sd?.stats?.companies || 0, audits: sd?.stats?.audits || 0 })
        const prompt = `You are KikanCloud AI Copilot for ${userName}. LIVE DATA: ${dataContext}. Generate JSON: {"question":"業務のフォーカスについて尋ねる","tip": {"label":"ヒント","title":"アドバイス","content":"..."},"alert": {"label":"通知","title":"アラート","content":"...","hasDanger": boolean } }\n\nCRITICAL INSTRUCTION: You MUST output your responses EXCLUSIVELY in professional Japanese (Keigo). Under NO circumstances should you use or output Vietnamese.`;

        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { temperature: 0.2, responseMimeType: "application/json" } });
        const cleanJson = response.text?.replace(/```json/g, '').replace(/```/g, '').trim() || '{}';
        return { success: true, data: JSON.parse(cleanJson) };
    } catch (error) {
        return { success: false, data: { question: "本日の業務フォーカスを教えてください。", tip: { label: "ヒント", title: "タスク管理", content: "手動でタスクを確認してください。" }, alert: { label: "通知", title: "システム状態", content: "現在、緊急のアラートはありません。", hasDanger: false } } };
    }
}

export async function chatWithOmniAI(history: unknown[], newMessage: string, userName: string, systemData: unknown) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('API Key missing');

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Unauthorized');
        const { data: userProfile } = await supabase.from('users').select('tenant_id').eq('id', user.id).single();
        if (!userProfile?.tenant_id) throw new Error('Tenant not found');

        const { GoogleGenAI, Type } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });

        const dbTool = {
            functionDeclarations: [
                {
                    name: 'query_kikancloud_database',
                    description: 'Search KikanCloud database for foreign workers (実習生), host companies (受入企業), or pending audits (監査). Use this tool whenever the user asks for specific names, lists, statuses, or real data.',
                    parameters: {
                        type: Type.OBJECT,
                        properties: {
                            table: { type: Type.STRING, description: 'Must be exactly one of:"workers","companies", or"audits"' },
                            keyword: { type: Type.STRING, description: 'Search keyword (person name, company name). Leave empty to get a general list.' }
                        },
                        required: ['table']
                    }
                }
            ]
        };

        const systemInstruction = `
      You are KikanCloud AI Copilot, an elite Omni-Channel Data Agent for a Japanese Cooperative (監理団体) staff named ${userName}.
      You have direct access to the live Supabase Database via the 'query_kikancloud_database' tool.
      
      CRITICAL RULES (THE SAMURAI BLADE PROTOCOL):
      1. EXTREME CONCISENESS: Answer questions directly and immediately. Do NOT use filler phrases, greetings, or acknowledgments (e.g., "承知いたしました", "以下に示します", "ご参考になれば幸いです", "はい、", "検索した結果").
      2. ZERO FLUFF: If the user asks for a number, give the number. If they ask for a list, give the list. DO NOT explain your thought process or how you found the data.
      3. FORMATTING: Use bullet points (-) for lists. Keep sentences short, punchy, and highly readable.
      4. STRICTLY BUSINESS JAPANESE: Output responses EXCLUSIVELY in highly professional, terse Japanese Keigo. NEVER use Vietnamese.
      5. TOOL USAGE: If asked about specific workers, companies, or audits, ALWAYS call the 'query_kikancloud_database' tool first. If no data, reply ONLY: "該当データが見つかりませんでした。"
    `;

        const contents = [...history as object[], { role: 'user', parts: [{ text: newMessage }] }]

        let response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: { systemInstruction, temperature: 0.1, tools: [dbTool] }
        });

        if (response.functionCalls && response.functionCalls.length > 0) {
            const call = response.functionCalls[0]
            let functionResult: unknown = { error: 'データが見つからないか、無効なテーブルです' }

            if (call.name === 'query_kikancloud_database') {
                const args = call.args as Record<string, string>
                const table = args.table
                const keyword = args.keyword || ''
                const searchTerm = keyword ? `%${keyword}%` : '%'
                if (table === 'workers') {
                    const { data } = await supabase.from('workers')
                        .select('full_name_romaji, nationality, status, system_type, residence_card_number')
                        .eq('tenant_id', userProfile.tenant_id)
                        .ilike('full_name_romaji', searchTerm)
                        .limit(10); // Limit 10 to prevent over-fetching
                    functionResult = data && data.length > 0 ? data : "条件に一致する実習生は見つかりませんでした。";
                }
                else if (table === 'companies') {
                    const { data } = await supabase.from('companies')
                        .select('name_jp, address')
                        .eq('tenant_id', userProfile.tenant_id)
                        .eq('is_deleted', false)
                        .ilike('name_jp', searchTerm)
                        .limit(10);
                    functionResult = data && data.length > 0 ? data : "条件に一致する受入企業は見つかりませんでした。";
                }
                else if (table === 'audits') {
                    const { data } = await supabase.from('audits')
                        .select('status, scheduled_date, companies(name_jp)')
                        .eq('tenant_id', userProfile.tenant_id)
                        .eq('status', 'Pending')
                        .limit(10);
                    functionResult = data && data.length > 0 ? data : "現在、保留中の監査予定はありません。";
                }
            }

            if (response.candidates?.[0]?.content) {
                contents.push(response.candidates[0].content as object)
            } else {
                contents.push({ role: 'model', parts: [{ functionCall: call }] })
            }

            contents.push({
                role: 'user',
                parts: [{ functionResponse: { name: call.name, response: { result: functionResult } } }]
            })

            response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: contents,
                config: { systemInstruction, temperature: 0.3, tools: [dbTool] }
            });
        }

        return { success: true, text: response.text }
    } catch {
        return { success: false, text: '申し訳ありません。AIシステムの接続に問題が発生しました。' }
    }
}
