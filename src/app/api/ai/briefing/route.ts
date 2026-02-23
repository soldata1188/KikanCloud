import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_INSTRUCTION = `
役割: あなたは「KikanCloud」の業務システムAIアシスタントです。
ユーザー指示:
Google検索を使用して、今日の最新情報に基づく短いサマリー（3〜4文）を丁寧な日本語で作成してください。
以下の内容を必ず含めてください：
1. 挨拶（朝/午後/夜に応じた挨拶）
2. 今日の大阪の天気情報
3. ユーザーの体調を気遣う優しい言葉や、今日の気分を尋ねる一言（為替レートは出力しないでください）
4. 最後に、業務を励ます前向きな一言

出力はマークダウンや不要な装飾を含まない、プレーンテキストにしてください。
`;

export async function GET(req: Request) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: 'GEMINI_API_KEY missing' }, { status: 500 });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            tools: [{ googleSearch: {} }] as any,
            systemInstruction: SYSTEM_INSTRUCTION
        });

        // Generate content
        const result = await model.generateContent("Create the daily briefing.");
        const responseText = result.response.text();

        return NextResponse.json({ reply: responseText });

    } catch (error: any) {
        console.error("AI Briefing API Error:", error);
        return NextResponse.json({ error: error.message || "Something went wrong." }, { status: 500 });
    }
}
