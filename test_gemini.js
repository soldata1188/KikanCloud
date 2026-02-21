
require('dotenv').config({ path: '.env.local' });
const { GoogleGenAI } = require('@google/genai');

async function main() {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const systemInstruction = 'You are a helpful assistant. Reply in Vietnamese.';
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                { role: 'user', parts: [{ text: 'chao b?n' }] }
            ],
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.5,
                safetySettings: [
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
                ]
            }
        });
        console.log('Success:', response.text);
    } catch(err) {
        console.error('API Error:', err);
    }
}
main();

