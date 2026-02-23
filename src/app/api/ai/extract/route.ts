import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: NextRequest) {
    if (!apiKey) {
        return NextResponse.json(
            { error: "GEMINI_API_KEY environment variable is missing" },
            { status: 500 }
        );
    }

    try {
        const body = await req.json();
        const { base64str, mimeType } = body;

        console.log(`[AI Extract] Received base64str length: ${base64str?.length}`);

        if (!base64str || !mimeType) {
            return NextResponse.json(
                { error: "Image base64 data and mimeType are required" },
                { status: 400 }
            );
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
Extract the following information from the provided document image (Residence Card or Passport) and return ONLY a valid JSON object matching this structure exactly. 
Infer the information if not explicitly written but obviously deducible. 
Dates should be in YYYY-MM-DD format.

Required JSON Structure:
{
    "nameRomaji": "STRING (e.g. NGUYEN VAN A. If passport, usually uppercase)",
    "nameKana": "STRING (if not present on document, return empty string)",
    "dob": "YYYY-MM-DD",
    "gender": "male or female or empty string",
    "nationality": "STRING (e.g. Viet Nam, Indonesia, Philippines)",
    "zairyuStatus": "STRING (Visa status in Japanese, e.g. 技能実習１号ロ)",
    "zairyuCardNumber": "STRING (12 alphanumeric characters, e.g. AB12345678CD. If passport, return empty string)",
    "zairyuExpiration": "YYYY-MM-DD (If passport, return empty string)",
    "passportNumber": "STRING (e.g. C1234567. If residence card, return empty string)",
    "passportExpiration": "YYYY-MM-DD (If residence card, return empty string)"
}
`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64str,
                    mimeType: mimeType
                }
            }
        ]);

        let text = result.response.text();

        // Strip markdown backticks if Gemini included them
        if (text.startsWith("\`\`\`json")) {
            text = text.replace(/^\`\`\`json/m, "").replace(/\`\`\`$/m, "").trim();
        } else if (text.startsWith("\`\`\`")) {
            text = text.replace(/^\`\`\`/m, "").replace(/\`\`\`$/m, "").trim();
        }

        const jsonData = JSON.parse(text);

        return NextResponse.json({ data: jsonData }, { status: 200 });
    } catch (error: any) {
        console.error("Gemini AI Extract Error:", error);
        return NextResponse.json(
            { error: "Failed to extract data using AI", details: error.message },
            { status: 500 }
        );
    }
}
