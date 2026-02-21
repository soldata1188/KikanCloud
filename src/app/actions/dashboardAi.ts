'use server'
import { createClient } from '@/lib/supabase/server'

// 1. Hàm tạo Briefing tĩnh (Giữ nguyên)
export async function getDashboardAIBriefing(userName: string, role: string, systemData: any) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('API Key missing');

        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });

        const dataContext = JSON.stringify({ workers: systemData?.stats?.workers || 0, companies: systemData?.stats?.companies || 0, audits: systemData?.stats?.audits || 0 });
        const prompt = `You are KikanCloud AI Copilot for ${userName}. LIVE DATA: ${dataContext}. Generate JSON: { "question": "業務のフォーカスについて尋ねる", "tip": {"label": "ヒント", "title": "アドバイス", "content": "..." }, "alert": {"label": "通知", "title": "アラート", "content": "...", "hasDanger": boolean } }`;

        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { temperature: 0.2, responseMimeType: "application/json" } });
        const cleanJson = response.text?.replace(/```json/g, '').replace(/```/g, '').trim() || '{}';
        return { success: true, data: JSON.parse(cleanJson) };
    } catch (error) {
        return { success: false, data: { question: "本日の業務フォーカスを教えてください。", tip: { label: "ヒント", title: "タスク管理", content: "手動でタスクを確認してください。" }, alert: { label: "通知", title: "システム状態", content: "現在、緊急のアラートはありません。", hasDanger: false } } };
    }
}

// 2. TÁC TỬ AI TỰ TRỊ (AUTONOMOUS AGENT) VỚI FUNCTION CALLING
export async function chatWithOmniAI(history: any[], newMessage: string, userName: string, systemData: any) {
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

        // 1. KHAI BÁO CÔNG CỤ (TOOLS) CHO GEMINI
        // Đây là "chìa khóa" để AI nhận biết và ra lệnh cho Server chui vào Supabase lấy dữ liệu
        const dbTool = {
            functionDeclarations: [
                {
                    name: 'query_kikancloud_database',
                    description: 'Search KikanCloud database for foreign workers (実習生), host companies (受入企業), or pending audits (監査). Use this tool whenever the user asks for specific names, lists, statuses, or real data.',
                    parameters: {
                        type: Type.OBJECT,
                        properties: {
                            table: { type: Type.STRING, description: 'Must be exactly one of: "workers", "companies", or "audits"' },
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
      
      CRITICAL RULES:
      1. If the user asks about specific workers, companies, or audits, YOU MUST CALL THE TOOL 'query_kikancloud_database' to fetch real data before answering.
      2. Do not invent or hallucinate data! If the tool returns empty, politely say "データベースに見つかりませんでした。" (Not found in database).
      3. Translate the raw JSON results from the database into natural, professional Business Japanese (Keigo). 
      4. Format lists beautifully using bullet points for readability.
      5. You can also translate text or answer general questions if no database search is needed.
    `;

        // Dựng mảng hội thoại
        let contents = [...history, { role: 'user', parts: [{ text: newMessage }] }];

        // LẦN GỌI 1: AI suy nghĩ xem có cần gọi Tool không
        let response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: { systemInstruction, temperature: 0.1, tools: [dbTool] }
        });

        // XỬ LÝ NẾU GEMINI RA LỆNH: "HÃY TÌM TRONG DATABASE CHO TÔI!"
        if (response.functionCalls && response.functionCalls.length > 0) {
            const call = response.functionCalls[0];
            let functionResult: any = { error: "データが見つからないか、無効なテーブルです" };

            if (call.name === 'query_kikancloud_database') {
                const args = call.args as any;
                const table = args.table;
                const keyword = args.keyword || '';
                const searchTerm = keyword ? `%${keyword}%` : '%';

                // THỰC THI TRUY VẤN VÀO SUPABASE DỰA TRÊN YÊU CẦU CỦA AI (Có bảo vệ RLS Tenant)
                if (table === 'workers') {
                    const { data } = await supabase.from('workers')
                        .select('full_name_romaji, nationality, status, system_type, residence_card_number')
                        .eq('tenant_id', userProfile.tenant_id)
                        .ilike('full_name_romaji', searchTerm)
                        .limit(10); // Giới hạn 10 người để tránh tràn Token
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

            // Đưa lệnh gọi hàm của AI vào mảng hội thoại
            if (response.candidates && response.candidates[0].content) {
                contents.push(response.candidates[0].content as any);
            } else {
                contents.push({ role: 'model', parts: [{ functionCall: call }] });
            }

            // Đưa kết quả từ Database (JSON) trả lại cho AI
            contents.push({
                role: 'user',
                parts: [{ functionResponse: { name: call.name, response: { result: functionResult } } }]
            });

            // LẦN GỌI 2: AI đọc kết quả Database, tổng hợp và trả lời người dùng
            response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: contents,
                config: { systemInstruction, temperature: 0.3, tools: [dbTool] }
            });
        }

        return { success: true, text: response.text };
    } catch (error: any) {
        console.error('Omni AI Agent Error:', error);
        return { success: false, text: "申し訳ありません。AIシステムの接続に問題が発生しました。" };
    }
}
