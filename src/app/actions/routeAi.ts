'use server'

export async function optimizeRouteWithAI(locations: any[], startTime: string = '09:00') {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('API Key missing');

        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });

        const context = locations.map(l => `- [ID: ${l.id}] ${l.name} (${l.type}): Address: ${l.address || 'Unknown'}`).join('\n');

        const prompt = `
      You are KikanCloud AI, an expert logistics and route planner for a Japanese cooperative (監理団体).
      I need to visit the following companies and worker housings today for audits (Kansa).
      Start time is ${startTime}. Assume each visit takes 60 minutes for a company and 30 minutes for a worker housing.
      Add realistic driving time between locations in Japan (around 15-30 mins depending on order).
      
      Locations to visit:
      ${context}
      
      Task:
      Logically order these locations to minimize driving time and zigzagging (solve the Traveling Salesperson Problem based on addresses). 
      Include a 1-hour lunch break around 12:00 PM - 13:00 PM.
      
      Return a JSON object EXACTLY in this format, without markdown blocks (\`\`\`json):
      {
        "total_time": "approx. X hours",
        "summary": "1 short sentence in Japanese explaining why this route is efficient.",
        "itinerary": [
          {
            "id": "match the ID from input, or 'lunch' if it's a break",
            "name": "Location Name or '昼休憩'",
            "type": "company, worker, or break",
            "arrivalTime": "HH:MM",
            "departureTime": "HH:MM",
            "notes": "Short Japanese note about what to check (e.g., タイムカードの確認, 寮の清掃状況の確認)"
          }
        ]
      }
    `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', contents: prompt,
            config: { temperature: 0.1, responseMimeType: "application/json" }
        });

        const cleanJson = response.text?.replace(/```json/g, '').replace(/```/g, '').trim() || '{}';
        return { success: true, data: JSON.parse(cleanJson) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
