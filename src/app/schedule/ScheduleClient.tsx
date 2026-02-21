'use client'

import { useState, useEffect, useTransition } from 'react'
import { getScheduleEntries, saveScheduleEntry } from './actions'

export default function ScheduleClient() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [entries, setEntries] = useState<Record<string, Record<number, string>>>({})
    const [isPending, startTransition] = useTransition()

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // Format date string for DB (YYYY-MM-DD)
    const formatDateStr = (y: number, m: number, d: number) => {
        let tgtY = y;
        let tgtM = m;
        if (m < 0) { tgtY--; tgtM += 12; }
        else if (m > 11) { tgtY++; tgtM -= 12; }
        return `${tgtY}-${String(tgtM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    }

    const loadEntries = async () => {
        // Fetch a bit wider range than just this month to cover previous/next month days
        const startDate = formatDateStr(year, month - 1, 20)
        const endDate = formatDateStr(year, month + 1, 10)

        try {
            const data = await getScheduleEntries(startDate, endDate)
            const newEntries: Record<string, Record<number, string>> = {}

            data.forEach((item: any) => {
                if (!newEntries[item.entry_date]) {
                    newEntries[item.entry_date] = {}
                }
                newEntries[item.entry_date][item.row_index] = item.content
            })

            setEntries(newEntries)
        } catch (error) {
            console.error('Failed to load schedule entries:', error)
        }
    }

    useEffect(() => {
        loadEntries()
    }, [year, month])

    const handleInputChange = (dateStr: string, rowIndex: number, value: string) => {
        setEntries(prev => {
            const dayEntries = { ...(prev[dateStr] || {}) }
            dayEntries[rowIndex] = value
            return { ...prev, [dateStr]: dayEntries }
        })
    }

    const handleInputBlur = (dateStr: string, rowIndex: number, value: string) => {
        // Only trigger API if onBlur. We use startTransition to run actions without blocking UI.
        startTransition(async () => {
            try {
                await saveScheduleEntry(dateStr, rowIndex, value)
            } catch (error) {
                console.error('Failed to save entry:', error)
                alert('保存に失敗しました。再試行してください。')
            }
        })
    }

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
    const goToToday = () => setCurrentDate(new Date())

    const daysOfWeek = [
        { name: '日', color: 'text-red-500' },
        { name: '月', color: 'text-[#1f1f1f]' },
        { name: '火', color: 'text-[#1f1f1f]' },
        { name: '水', color: 'text-[#1f1f1f]' },
        { name: '木', color: 'text-[#1f1f1f]' },
        { name: '金', color: 'text-[#1f1f1f]' },
        { name: '土', color: 'text-blue-500' },
    ]

    const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate()

    const daysInMonth = getDaysInMonth(year, month)
    const firstDayIndex = new Date(year, month, 1).getDay()

    let gridCells = []

    // Fill previous month empty slots
    const prevMonthDays = getDaysInMonth(year, month - 1)
    for (let i = firstDayIndex - 1; i >= 0; i--) {
        gridCells.push({ dayNum: prevMonthDays - i, m: month - 1, isCurrent: false })
    }

    // Fill current month
    for (let i = 1; i <= daysInMonth; i++) {
        gridCells.push({ dayNum: i, m: month, isCurrent: true })
    }

    // Fill next month empty slots
    let nextMonthDay = 1
    while (gridCells.length % 7 !== 0 || gridCells.length < 35) {
        gridCells.push({ dayNum: nextMonthDay++, m: month + 1, isCurrent: false })
    }

    const rowsPerDay = 5
    const todayObj = new Date()
    const isToday = (d: number, m: number) => {
        let tgtY = year;
        let tgtM = m;
        if (m < 0) { tgtY--; tgtM += 12; }
        else if (m > 11) { tgtY++; tgtM -= 12; }
        return d === todayObj.getDate() && tgtM === todayObj.getMonth() && tgtY === todayObj.getFullYear();
    }

    return (
        <div className="w-full h-full pb-8 select-none flex flex-col pt-2">

            <div className="flex items-center justify-between mb-6 px-1">
                <div className="flex items-center gap-4">
                    <h1 className="text-[28px] font-normal tracking-tight text-[#1f1f1f] flex items-center gap-2">
                        {year}年 {month + 1}月
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-md bg-[#fbfcfd] border border-[#ededed] hover:bg-[#ededed] transition-colors text-[#878787]">&lt;</button>
                    <button onClick={goToToday} className="px-4 py-1.5 bg-[#24b47e] shadow-sm hover:bg-[#1e9a6a] rounded-md text-[13px] font-bold transition-colors text-white tracking-wide">今日</button>
                    <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-md bg-[#fbfcfd] border border-[#ededed] hover:bg-[#ededed] transition-colors text-[#878787]">&gt;</button>
                </div>
            </div>

            <div className="w-full bg-white rounded-lg shadow-sm border border-[#d1d5db] overflow-hidden flex flex-col flex-1">
                {/* Header Row */}
                <div className="flex w-full border-b border-[#d1d5db] bg-[#f0f4f9]">
                    {daysOfWeek.map((day, idx) => (
                        <div key={idx} className={`flex-1 text-center py-2.5 border-r border-[#d1d5db] last:border-r-0 font-bold text-[13px] uppercase tracking-wide ${day.color}`}>
                            {day.name}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 flex flex-col w-full min-w-[800px] overflow-x-auto overflow-y-hidden">
                    {Array.from({ length: gridCells.length / 7 }).map((_, weekIdx) => (
                        <div key={weekIdx} className="flex relative w-full flex-1 min-h-[140px] border-b border-[#d1d5db] last:border-b-0">

                            {/* Vertical borders */}
                            <div className="absolute inset-0 flex pointer-events-none">
                                {Array.from({ length: 7 }).map((_, i) => (
                                    <div key={i} className="flex-1 border-r border-[#d1d5db] last:border-r-0"></div>
                                ))}
                            </div>

                            {/* Logic Columns */}
                            {Array.from({ length: 7 }).map((_, dayIdx) => {
                                const cellData = gridCells[weekIdx * 7 + dayIdx]
                                const isSunday = dayIdx === 0
                                const isSaturday = dayIdx === 6

                                let textColor = cellData.isCurrent ? "text-[#1f1f1f]" : "text-[#878787]"
                                if (isSunday && cellData.isCurrent) textColor = "text-red-700"
                                if (isSaturday && cellData.isCurrent) textColor = "text-blue-700"

                                const dateStr = formatDateStr(year, cellData.m, cellData.dayNum)
                                const cellEntries = entries[dateStr] || {}
                                const todayBg = isToday(cellData.dayNum, cellData.m) ? 'bg-[#24b47e]/5 ring-[1.5px] ring-inset ring-[#24b47e] z-20' : ''
                                const disabledBg = !cellData.isCurrent ? 'bg-[#fbfcfd]' : ''

                                return (
                                    <div key={dayIdx} className={`flex-1 relative flex flex-col z-10 transition-colors ${todayBg} ${disabledBg}`}>

                                        {/* Row 0 is the date number slot (disabled for typing) */}
                                        <div className="flex border-b border-gray-200 last:border-b-0 relative h-7 bg-[#f8fafc]">
                                            <div className="absolute top-[3px] left-2 z-20 font-bold text-[14px] select-none pointer-events-none">
                                                <span className={textColor}>{cellData.dayNum}</span>
                                            </div>
                                            <input
                                                type="text"
                                                className="w-full h-full bg-transparent px-2 outline-none text-sm text-[#1f1f1f] opacity-0 cursor-default"
                                                disabled
                                            />
                                        </div>

                                        {Array.from({ length: 4 }).map((_, i) => {
                                            const rIdx = i + 1;
                                            return (
                                                <div key={rIdx} className="flex-1 border-b border-gray-200 last:border-b-0 flex group">
                                                    <input
                                                        type="text"
                                                        value={cellEntries[rIdx] || ''}
                                                        onChange={(e) => handleInputChange(dateStr, rIdx, e.target.value)}
                                                        onBlur={(e) => handleInputBlur(dateStr, rIdx, e.target.value)}
                                                        className="w-full h-full bg-transparent outline-none text-[12px] font-medium text-[#1f1f1f] focus:bg-emerald-50 focus:text-emerald-900 transition-colors px-2 py-0.5 hover:bg-[#fbfcfd]"
                                                        disabled={!cellData.isCurrent}
                                                    />
                                                </div>
                                            )
                                        })}

                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
