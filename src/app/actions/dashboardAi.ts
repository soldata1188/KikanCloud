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
