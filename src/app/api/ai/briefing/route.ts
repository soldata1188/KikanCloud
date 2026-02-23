import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_INSTRUCTION = `
役割: あなたは「KikanCloud」の業務システムAIアシスタントです。
ユーザー指示:
Google検索を使用して、極めて短く簡潔に（最大2文程度）ユーザーへ挨拶と大阪の天気を報告してください。
以下の内容のみを繋げて、最も短い文章にしてください：
1. 時間帯に応じた挨拶
2. 今日の大阪の簡単な天気と気温（短く）
3. 業務を応援する一言

出力例：「おはようございます。今日の大阪は晴れ（19℃）です。本日もKikanCloudでの業務を円滑に進めましょう！」
※冗長な言葉遣い、過度な気遣い、余計な説明文は全て排除し、最小の文字数のプレーンテキストで回答してください。
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
