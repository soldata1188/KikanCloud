import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@/lib/supabase/server';

const buildSystemInstruction = (tone: string) => `
役割: あなたは「KikanCloud」の業務システムAIアシスタント（専門家）です。
対象ユーザー: 監理団体（協同組合）や受入企業の職員。
回答スタイル:
${tone === 'friendly'
        ? '- 親しみやすく、わかりやすい言葉で回答してください。堅苦しい言葉は避け、丁寧ながらも温かみのある表現を使用してください。'
        : '- 常に正確で簡潔なビジネスマナー（敬語・丁寧語）を使用すること。'}
- 外国人技能実習制度、特定技能に関する専門的な知識を踏まえた回答を心がけること。
- 余計な挨拶や長すぎる説明は省き、質問の核心に直接答えること。
- リアルタイムでGoogle検索を行う能力を持っています。ユーザーが最新情報（為替レート、天気、ニュース、新しい法律など）について尋ねた場合は、自主的にGoogle検索を使って最新情報を取得し、正確に回答してください。必要に応じて情報源を引用してください。

データ表形式の出力:
- 複数の人物・企業・書類などのリスト形式のデータを回答する場合は、必ず以下のJSON形式を使用してください。
- フォーマット: [DATACARD]{"title":"タイトル","rows":[{"name":"名前","sub":"補足","badge":"バッジラベル","urgency":"red|amber|blue|green"}]}[/DATACARD]
- urgencyの基準: red=緊急（7日以内）, amber=要注意（30日以内）, blue=通常情報, green=完了・問題なし
- DATACARDブロックは通常のテキストと組み合わせて使用できます。
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

        // Read user's AI settings from DB
        let modelName = 'gemini-2.5-flash';
        let tone = 'professional';
        try {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('ai_model, ai_tone')
                    .eq('id', user.id)
                    .single();
                if (profile?.ai_model) modelName = profile.ai_model;
                if (profile?.ai_tone) tone = profile.ai_tone;
            }
        } catch {
            // fallback to defaults silently
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

        const fullPrompt = context
            ? `以下のコンテキスト情報（状況や対象データ）を踏まえて回答してください。\n\n[コンテキスト]\n${context}\n\n[ユーザーの質問]\n${prompt}`
            : prompt;

        const result = await ai.models.generateContent({
            model: modelName,
            contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
            config: {
                tools: [{ googleSearch: {} }],
                systemInstruction: buildSystemInstruction(tone),
            }
        });
        const responseText = result.text ?? '';

        return NextResponse.json({ reply: responseText });

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Something went wrong processing the AI request.'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
