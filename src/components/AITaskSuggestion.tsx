import { Sparkles } from 'lucide-react'

export function AITaskSuggestion({
    priorityTask,
    secondaryTask,
    reasoning
}: {
    priorityTask: string;
    secondaryTask: string;
    reasoning: string;
}) {
    return (
        <div className="border text-left border-gray-200 rounded-none p-5 relative overflow-hidden group h-full">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#24b47e]"></div>

            <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-[#24b47e]" />
                <h3 className="text-[11px] font-bold text-[#24b47e] tracking-wider">ヒント</h3>
            </div>

            <p className="text-[14px] leading-relaxed text-[#1f1f1f]">
                <strong>進め方のご提案:</strong> これらのタスクは段階的に進めることができます。まずは<strong>優先度1 ({priorityTask})</strong>に着手し、続いて<strong>{secondaryTask}</strong>を確認することをお勧めします。これは{reasoning}
            </p>
        </div>
    )
}
