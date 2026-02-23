'use server'
import { GoogleGenAI } from '@google/genai';

export async function extractDocumentAI(base64Image: string, mimeType: string) {
 try {
 const apiKey = process.env.GEMINI_API_KEY;
 if (!apiKey) throw new Error('システムエラー: GEMINI_API_KEYが環境変数に設定されていません。管理者に連絡してください。');

 const ai = new GoogleGenAI({ apiKey });
 const base64Data = base64Image.replace(/^data:(.*);base64,/,"");

 const prompt =`
 You are an expert Japanese immigration document OCR assistant.
 Analyze the provided document (Zairyu Card, Passport, or PDF).
 Extract the following information and return it EXACTLY as a valid JSON object.
 If a field is unreadable or missing, leave it as an empty string"".
 Do not include markdown formatting like \`\`\`json.
 Required JSON format:
 {
"full_name_romaji":"string (uppercase, extract exact English name, e.g., NGUYEN VAN A)",
"full_name_kana":"string (Extract Katakana name if present, otherwise empty)",
"nationality":"string (e.g., ベトナム, インドネシア)",
"date_of_birth":"string (YYYY-MM-DD format, convert from Japanese era if needed)",
"gender":"string (male or female)",
"zairyu_no":"string (12 alphanumeric characters, only if Zairyu card)",
"address":"string (Extract full Japanese address, e.g., 東京都新宿区...)",
"visa_status":"string (Extract residence status/在留資格 exactly as written in Japanese, e.g., 技能実習第1号イ, 特定技能1号, 留学)",
"zairyu_exp":"string (YYYY-MM-DD format, extract expiration date/在留期間の満了日, convert from Japanese era if needed)"
 }

 Translate the nationality to Japanese (e.g., VIET NAM -> ベトナム, INDONESIA -> インドネシア, CHINA -> 中国, PHILIPPINES -> フィリピン, NEPAL -> ネパール, CAMBODIA -> カンボジア).
 CRITICAL INSTRUCTION: You MUST output your responses EXCLUSIVELY in professional Japanese (Keigo). Under NO circumstances should you use or output Vietnamese.
`;

 const response = await ai.models.generateContent({
 model: 'gemini-2.5-flash',
 contents: [
 {
 role: 'user',
 parts: [
 { text: prompt },
 { inlineData: { mimeType, data: base64Data } }
 ]
 }
 ],
 config: {
 temperature: 0.1,
 responseMimeType:"application/json",
 }
 });

 const resultText = response.text;
 if (!resultText) throw new Error('AIがデータを抽出できませんでした。画像が不鮮明である可能性がございます。');

 const cleanJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
 return { success: true, data: JSON.parse(cleanJson) };

 } catch (error: any) {
 console.error('Gemini Vision Error:', error);
 return { success: false, error: error.message || '画像のデータ抽出に失敗いたしました。恐れ入りますが、再度お試しください。' };
 }
}