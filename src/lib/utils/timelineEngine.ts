export type TimelineEvent = {
    id: string;
    title: string;
    expectedDate: string;
    status: 'past' | 'current' | 'future';
};

export function inferAgency(title: string): 'nyukan' | 'kikou' | 'kentei' | 'other' {
    if (title.includes('検定') || title.includes('試験')) return 'kentei';
    if (title.includes('在留') || title.includes('ビザ') || title.includes('資格変更') || title.includes('期間更新') || title.includes('特定技能')) return 'nyukan';
    if (title.includes('認定') || title.includes('報告') || title.includes('育成就労開始')) return 'kikou';
    return 'other';
}

export function generateWorkerTimeline(systemType: string, entryDateStr: string | null): TimelineEvent[] {
    const baseDate = entryDateStr ? new Date(entryDateStr) : new Date(new Date().setMonth(new Date().getMonth() - 2));
    const today = new Date();
    const addMonths = (date: Date, months: number) => { const d = new Date(date); d.setMonth(d.getMonth() + months); return d; };
    const formatDate = (date: Date) => { const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, '0'); return `${y}/${m}`; };

    let template: { title: string, offsetMonths: number }[] = [];

    if (systemType === 'tokuteigino') {
        template = [
            { title: '1号特定技能開始', offsetMonths: 0 }, { title: '2年目期間更新', offsetMonths: 10 }, { title: '定期報告', offsetMonths: 12 },
            { title: '3年目期間更新', offsetMonths: 22 }, { title: '定期報告', offsetMonths: 24 }, { title: '4年目期間更新', offsetMonths: 34 },
            { title: '定期報告', offsetMonths: 36 }, { title: '5年目期間更新', offsetMonths: 46 }, { title: '終了', offsetMonths: 60 }
        ];
    } else if (systemType === 'ikusei_shuro') {
        template = [
            { title: '育成就労開始', offsetMonths: 0 }, { title: '1年目期間更新', offsetMonths: 10 }, { title: '日本語・技能試験受験', offsetMonths: 18 },
            { title: '2年目期間更新', offsetMonths: 22 }, { title: '特定技能移行申請', offsetMonths: 32 }, { title: '3年終了・特定技能へ移行', offsetMonths: 36 }
        ];
    } else {
        template = [
            { title: '面接済', offsetMonths: -6 }, { title: '1号認定申請', offsetMonths: -4 }, { title: '在留資格申請', offsetMonths: -3 },
            { title: 'ビザ申請', offsetMonths: -1 }, { title: '法定講習', offsetMonths: 0 }, { title: '実習開始', offsetMonths: 1 },
            { title: '初級検定申込み', offsetMonths: 5 }, { title: '検定受験', offsetMonths: 7 }, { title: '2号認定申請', offsetMonths: 9 },
            { title: '資格変更', offsetMonths: 10 }, { title: '期間更新', offsetMonths: 22 }, { title: '専門検定申込み', offsetMonths: 24 },
            { title: '検定受験', offsetMonths: 26 }, { title: '3年終了', offsetMonths: 36 }
        ];
    }

    const events = template.map((step, index) => {
        const expectedDate = addMonths(baseDate, step.offsetMonths);
        let status: 'past' | 'current' | 'future' = 'future';
        const diffMonths = (expectedDate.getFullYear() - today.getFullYear()) * 12 + (expectedDate.getMonth() - today.getMonth());
        if (diffMonths < 0) status = 'past';
        else if (diffMonths === 0 || diffMonths === 1) status = 'current';

        return { id: `step-${index}`, title: step.title, expectedDate: formatDate(expectedDate), status };
    });

    let foundCurrent = false;
    return events.map(e => {
        if (e.status === 'past') return e;
        if (!foundCurrent) { foundCurrent = true; return { ...e, status: 'current' }; }
        return { ...e, status: 'future' };
    });
}
