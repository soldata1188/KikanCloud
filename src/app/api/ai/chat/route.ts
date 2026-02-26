import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_INSTRUCTION = `
役割: あなたは「KikanCloud」の業務システムAIアシスタント（専門家）です。
対象ユーザー: 監理団体（協同組合）や受入企業の職員。
回答スタイル: 
- 常に正確で簡潔なビジネスマナー（敬語・丁寧語）を使用すること。
- 外国人技能実習制度、特定技能に関する専門的な知識を踏まえた回答を心がけること。
- 余計な挨拶や長すぎる説明は省き、質問の核心に直接答えること。
- リアルタイムでGoogle検索を行う能力を持っています。ユーザーが最新情報（為替レート、天気、ニュース、新しい法律など）について尋ねた場合は、自主的にGoogle検索を使って最新情報を取得し、正確に回答してください。必要に応じて情報源を引用してください。
`;

export async function POST(req: Request) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: 'GEMINI_API_KEY missing' }, { status: 500 });
        }

        const body = await req.json();
        const { prompt, context } = body;

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            tools: [{ googleSearch: {} }] as any,
            systemInstruction: SYSTEM_INSTRUCTION
        });

        const fullPrompt = context
            ? `以下のコンテキスト情報（状況や対象データ）を踏まえて回答してください。\n\n[コンテキスト]\n${context}\n\n[ユーザーの質問]\n${prompt}`
            : prompt;

        const result = await model.generateContent(fullPrompt);
        const responseText = result.response.text();

        return NextResponse.json({ reply: responseText });

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Something went wrong processing the AI request.'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
