'use server'

export async function getDashboardAIBriefing(userName: string, role: string, systemData: any) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('API Key missing');

        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });

        // Nén dữ liệu thật thành chuỗi để đưa vào Prompt
        const dataContext = JSON.stringify({
            total_workers: systemData.stats.workers,
            total_companies: systemData.stats.companies,
            pending_audits: systemData.stats.audits
        });

        const prompt = `
      You are KikanCloud AI Copilot, an analytical assistant for a Japanese cooperative staff named ${userName}.
      Analyze the following LIVE SYSTEM DATA:
      ${dataContext}
      
      Generate a daily briefing and two actionable cards in professional Japanese (Keigo).
      - If 'pending_audits' is greater than 0, the 'alert' block MUST warn about them and set hasDanger to true.
      - If 'pending_audits' is 0, write '現在、対応が必要な緊急アラートはありません。(No urgent alerts)' and set hasDanger to false.
      - The 'tip' should give strategic advice on managing the ${systemData.stats.workers} workers or ${systemData.stats.companies} companies.

      Format EXACTLY as JSON without markdown blocks:
      {
        "question": "Ask what they want to focus on today.",
        "tip": { "label": "TIP", "title": "Actionable Advice Title", "content": "Specific advice based on data." },
        "alert": { "label": "ACTION REQUIRED", "title": "Alert Title", "content": "Alert details based on pending_audits.", "hasDanger": boolean }
      }
    `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', contents: prompt,
            config: { temperature: 0.2, responseMimeType: "application/json" }
        });

        const cleanJson = response.text?.replace(/```json/g, '').replace(/```/g, '').trim() || '{}';
        return { success: true, data: JSON.parse(cleanJson) };
    } catch (error) {
        return {
            success: false,
            data: {
                question: "本日の業務フォーカスを教えてください。",
                tip: { label: "TIP", title: "Task Management", content: "AIへの接続に遅延が発生しています。手動でタスクを確認してください。" },
                alert: { label: "NOTICE", title: "System Status", content: "現在、緊急のアラートはありません。", hasDanger: false }
            }
        };
    }
}

// Giữ nguyên hàm chatWithDashboardAI cũ
export async function chatWithDashboardAI(userName: string, input: string) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return { success: false, text: "API Error" };
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are KikanCloud AI for ${userName}. User says: "${input}". Respond in short, professional Japanese Keigo (max 2 sentences). No markdown bolding.`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return { success: true, text: response.text };
    } catch (e) { return { success: false, text: "エラーが発生しました。" }; }
}
