import fs from 'fs';

// 1. routeAi.ts
let routeAi = fs.readFileSync('src/app/actions/routeAi.ts', 'utf8');
routeAi = routeAi.replace(
    ' CRITICAL INSTRUCTION: You MUST output your responses EXCLUSIVELY in professional Japanese (Keigo). Under NO circumstances should you use or output Vietnamese.',
    '      CRITICAL RULES:\n      1. Return ONLY raw JSON. No markdown blocks (\\`\\`\\`json), no text outside JSON.\n      2. The "summary" field MUST be EXACTLY ONE short Japanese sentence (Max 30 chars) explaining the route logic. NO fluff.\n      3. The "notes" field MUST be extremely short keywords (e.g., "タイムカード確認", "寮点検"). No full sentences.\n      4. STRICTLY JAPANESE ONLY for all text values. NEVER use Vietnamese.'
);
fs.writeFileSync('src/app/actions/routeAi.ts', routeAi, 'utf8');

// 2. ai.ts
let aiTs = fs.readFileSync('src/app/actions/ai.ts', 'utf8');
aiTs = aiTs.replace(
    ' CRITICAL INSTRUCTION: You MUST output your responses EXCLUSIVELY in professional Japanese (Keigo). Under NO circumstances should you use or output Vietnamese.',
    ' CRITICAL RULE: Return ONLY a raw JSON object. Do NOT include markdown code blocks like \\`\\`\\`json. Do NOT output any conversational text or explanations. Output values in Japanese where applicable.'
);
fs.writeFileSync('src/app/actions/ai.ts', aiTs, 'utf8');
console.log('Fixed backticks!');
