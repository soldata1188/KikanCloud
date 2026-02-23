import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });


const { GEMINI_API_KEY } = process.env;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const filesToTranslate = [
    'src/app/api/chat/route.ts',
    'src/app/audits/actions.ts',
    'src/app/audits/ExportExcelButton.tsx',
    'src/app/audits/print/page.tsx',
    'src/app/b2b-chat/B2BChatClient.tsx',
    'src/app/operations/actions.ts',
    'src/app/page.tsx',
    'src/app/portal/layout.tsx',
    'src/app/portal/page.tsx',
    'src/app/procedures/actions.ts',
    'src/app/roadmap/RoadmapClient.tsx',
    'src/app/routing/page.tsx',
    'src/app/routing/RoutingClient.tsx',
    'src/app/workers/actions.ts',
    'src/app/workers/new/NewWorkerClient.tsx',
    'src/app/workers/[id]/edit/EditWorkerClient.tsx',
    'src/app/workers/[id]/WorkerDetailClient.tsx',
    'src/components/TestDataFiller.tsx',
    'src/components/TopNav.tsx',
    'src/hooks/useSupabaseChat.ts',
    'src/hooks/useSupabaseUpload.ts',
    'src/app/accounts/TeamManagerClient.tsx'
    , 'src/app/actions/ai.ts', 'src/app/actions/routeAi.ts', 'src/app/organization/StaffList.tsx', 'src/app/organization/OrganizationForm.tsx', 'src/app/organization/actions.ts'];

async function run() {
    for (let file of filesToTranslate) {
        if (!fs.existsSync(file)) {
            console.log(`Skip ${file}, not found`);
            continue;
        }
        console.log(`==== Translating: ${file}... ====`);
        let content = fs.readFileSync(file, 'utf8');

        const prompt = `You are a strict code translator. 
Task: Translate ALL Vietnamese strings in this React/TypeScript codebase into Business Japanese (Keigo), and ALL Vietnamese code comments into professional English.
CRITICAL RULES:
- If translating AI prompts (e.g. system prompts), translate them to professional English and append this instruction: "CRITICAL INSTRUCTION: You MUST output your responses EXCLUSIVELY in professional Japanese (Keigo). Under NO circumstances should you use or output Vietnamese."
- DO NOT change ANY logic, variable names, function names, object keys, database table names, or Tailwind classes.
- "Thực tập sinh" -> "実習生"
- "Xí nghiệp" -> "受入企業"
- "Nghiệp đoàn" -> "監理団体"
- Your output MUST be ONLY the raw translated code. DO NOT wrap it in Markdown like \`\`\`tsx. NO EXTRA TEXT.

Here is the file content:

${content}
`;

        try {
            const resp = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { temperature: 0.1 }
            });
            let result = resp.text.trim();

            if (result.startsWith('\`\`\`')) {
                let lines = result.split('\n');
                lines.shift();
                if (lines[lines.length - 1].startsWith('\`\`\`')) lines.pop();
                result = lines.join('\n');
            }

            fs.writeFileSync(file, result, 'utf8');
            console.log(`Success: ${file}`);
        } catch (e) {
            console.log(`Failed: ${file}`, e);
        }
    }
}

run();
