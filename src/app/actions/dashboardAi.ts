'use server'

import { createClient } from '@/lib/supabase/server'
import { GoogleGenAI } from '@google/genai';

export async function chatWithDashboardAI(userName: string, input: string) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return {
                success: false,
                text: "API Key is not configured."
            };
        }

        const ai = new GoogleGenAI({ apiKey: apiKey });

        const prompt = `You are KikanCloud AI Copilot, a helpful analytical assistant for a Japanese cooperative staff named ${userName}.
The user asks: "${input}"

Respond briefly and professionally in Japanese. Focus on practical advice for cooperative (監理団体) operations.
Keep the response to 1-2 paragraphs max. No markdown bolding, just plain text.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.7,
            }
        });

        return {
            success: true,
            text: response.text
        };
    } catch (error: any) {
        console.error('AI Chat Error:', error);
        return {
            success: false,
            text: "申し訳ありません。エラーが発生しました。"
        };
    }
}

export async function getDashboardAIBriefing(userName: string, role: string, systemData: any) {
    // A simple mockup of the briefing function
    return {
        success: true,
        data: {
            question: `本日の調子はいかがですか？入管への申請や監査など、フォーカスしたい業務を教えてください。`,
            tip: {
                label: 'TIP',
                title: 'ルート最適化について',
                content: 'ナビゲーションメニューから新たに「ルート最適化」機能を利用できるようになりました！'
            },
            alert: {
                hasDanger: false,
                label: 'NOTICE',
                title: 'システム稼働中',
                content: 'すべてのシステムは正常に稼働しています。'
            }
        }
    };
}

export async function chatWithOmniAI(history: { role: 'user' | 'model', parts: { text: string }[] }[], newMessage: string, userName: string, systemData: any) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('API Key missing');

        const { GoogleGenAI, HarmCategory, HarmBlockThreshold } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });

        const systemInstruction = `
      You are KikanCloud AI, an elite Omni-Channel Copilot for a Japanese Cooperative (監理団体) staff named ${userName}.
      You are integrated directly into the central Dashboard.
      System Data Context: ${systemData?.stats?.workers || 0} workers, ${systemData?.stats?.companies || 0} companies, ${systemData?.stats?.audits || 0} pending audits.
      
      Your capabilities:
      1. Answer questions about Japanese immigration law (Nyukan), OTIT rules, and Technical Intern Training Program (技能実習制度).
      2. Translate Vietnamese to formal Japanese Keigo (Business Japanese) or vice versa.
      3. Draft emails or documents.
      4. Provide logical advice for daily tasks based on System Data.
      
      Tone: Professional, empathetic, and concise. You MUST respond in the exact same language that the user used in their most recent message, unless explicitly asked otherwise (e.g. if the user speaks Vietnamese, reply in Vietnamese; if Japanese, reply in Japanese). Do not use heavy markdown bolding.
    `;

        // Gọi Gemini API với lịch sử hội thoại
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                ...history,
                { role: 'user', parts: [{ text: newMessage }] }
            ],
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.5,
                safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
                ]
            }
        });

        return { success: true, text: response.text };
    } catch (error: any) {
        console.error('Omni AI Error:', error);
        return { success: false, text: `AI Error: ${error.message || 'Unknown error'}` };
    }
}
