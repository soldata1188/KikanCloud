'use client';

import React, { useState, useEffect } from 'react';
import { Clock, ArrowDown, CheckCircle2, AlertTriangle, ArrowRightCircle, Target, Briefcase, GraduationCap, Edit, Save, Plus, Trash2 } from 'lucide-react';

type NodeType = 'default' | 'highlight' | 'warning' | 'target';

interface NodeData {
    id: string;
    title: string;
    duration: string;
    desc: string;
    type: NodeType;
    hasArrowAfter: boolean;
}

interface ColumnData {
    title: string;
    subtitle: string;
    badge: string;
    badgeClass: string;
    desc: string;
    nodes: NodeData[];
}

const defaultColumns: ColumnData[] = [
    {
        title: "技能実習制度",
        subtitle: "GINO JISSHU (Trainee)",
        badge: "廃止予定 (2027年〜)",
        badgeClass: "bg-gray-100 border-gray-350 text-gray-600",
        desc: "目的は「国際貢献」。開発途上国への技能移転を名目とするが、原則転籍（転職）不可のため人権問題が指摘され、廃止・移行が決定した制度。",
        nodes: [
            { id: "1-1", title: "入国前手続き", duration: "約6ヶ月前", desc: "現地の送出機関で面接。在留資格認定証明書（COE）やビザの申請を実施し、日本では監理団体が受け入れ準備を行う。", type: "default", hasArrowAfter: false },
            { id: "1-2", title: "技能実習 1号 (入国)", duration: "1年目", desc: "入国後、約1ヶ月間の座学講習後に企業配属。【試験】1年目終了前に「基礎級技能検定」と「日本語試験」の合格が必須。", type: "default", hasArrowAfter: false },
            { id: "1-3", title: "【試験】1号修了判定", duration: "1年目 中盤〜終盤", desc: "2号へ移行するための必須試験。「基礎級技能検定（学科・実技）」を受験し、合格することが必須条件。", type: "warning", hasArrowAfter: true },
            { id: "1-4", title: "技能実習 2号", duration: "2〜3年目", desc: "実践的な技能の習熟期間。企業での実務を通じてより高度な作業を学ぶ。", type: "highlight", hasArrowAfter: false },
            { id: "1-5", title: "【試験】2号修了判定", duration: "3年目 終盤", desc: "実習の成果を確認する試験。「随時3級技能検定（実技）」の受験が法令で義務付けられている（合否は以後の在留に直結しないが、特定技能への免除要件となる）。", type: "warning", hasArrowAfter: true },
            { id: "1-6", title: "特定技能1号へ移行", duration: "3年満了後", desc: "良好に実習3年を満了（2号修了等）した場合、同一業務分野に限り日本語試験・技能試験【免除】で特定技能へ移行可能。", type: "target", hasArrowAfter: true },
            { id: "1-7", title: "技能実習 3号 (任意)", duration: "4〜5年目", desc: "優良な受入企業と優秀な実習生（技能検定3級合格など）のみ対象。母国へ原則1ヶ月以上の一時帰国後、さらに2年延長。", type: "default", hasArrowAfter: false }
        ]
    },
    {
        title: "育成就労制度",
        subtitle: "IKUSEI SHURO (New System)",
        badge: "2027年4月 施行予定",
        badgeClass: "bg-blue-100 border-blue-200 text-blue-700",
        desc: "目的は「人材育成・確保」。3年間で特定技能レベルの労働力に育てる。要件を満たせば「同一分野内での転籍（転職）」が認められる新制度。",
        nodes: [
            { id: "2-1", title: "【試験】入国前（日本語）", duration: "入国前", desc: "就労開始前に「日本語能力試験 N5」または「JFT-Basic A1水準」の合格、もしくは同等の日本語講習の受講が義務。", type: "warning", hasArrowAfter: false },
            { id: "2-2", title: "育成就労 開始", duration: "1年目", desc: "企業に配属され働きながら技能と日本語を学ぶ。監理支援機関によるサポート、企業による計画的な教育が行われる。", type: "default", hasArrowAfter: true },
            { id: "2-3", title: "転籍（転職）の解禁", duration: "1〜2年経過後", desc: "就労から1年以上（分野により2年）経過し、「N5相当の日本語資格」＋「各分野の基礎技能試験」に合格すれば、同一分野内での転籍が可能になる。", type: "highlight", hasArrowAfter: false },
            { id: "2-4", title: "【試験】3年目の最終関門", duration: "3年目", desc: "特定技能へ移行するための必須試験。「特定技能評価試験（技能）」と「日本語能力試験 N4以上 (または JFT-Basic)」の合格が絶対条件。旧制度の免除特例はなし。", type: "warning", hasArrowAfter: true },
            { id: "2-5", title: "特定技能1号へ移行", duration: "3年満了時", desc: "試験に合格することで特定技能へ移行。不合格の場合でも、条件付きで最長1年間の【在留延長】（再受験用猶予）が認められる。", type: "target", hasArrowAfter: false }
        ]
    },
    {
        title: "特定技能制度",
        subtitle: "TOKUTEI GINO (Specified Skilled)",
        badge: "即戦力インフラ",
        badgeClass: "bg-[#24b47e]/10 border-[#24b47e]/30 text-[#1e9a6a]",
        desc: "専門性・技能を有し、即戦力となる外国人材を受け入れるための制度。新旧どちらの制度からも、この「特定技能」への移行が最終ゴールとなる。",
        nodes: [
            { id: "3-1", title: "要件 (国内外から移行)", duration: "開始前", desc: "「技能評価試験」＋「日本語能力試験(N4以上)」の合格。または育成就労(旧技能実習2号)からの良好な修了（試験免除）。", type: "default", hasArrowAfter: false },
            { id: "3-2", title: "特定技能 1号", duration: "最大5年間", desc: "同一分野内であれば、自由に会社を転籍(転職)することが可能。在留期間は「4ヶ月、6ヶ月、1年」ごとの更新。この段階では家族の帯同は原則不可。", type: "highlight", hasArrowAfter: true },
            { id: "3-3", title: "【試験】特定技能 2号評価試験", duration: "1号修了前", desc: "特定技能2号へ移行するための超難関試験。「特定技能2号評価試験（高度な専門知識・実技）」を受験。分野によっては実務経験（班長・管理者経験等）の証明も必要。", type: "warning", hasArrowAfter: true },
            { id: "3-4", title: "特定技能 2号へ移行", duration: "5年経過後等", desc: "在留期間の上限が撤廃（「6ヶ月、1年、3年」ごとの更新）。配偶者や子などの【家族の帯同】が認められる。", type: "target", hasArrowAfter: true },
            { id: "3-5", title: "永住権の申請", duration: "通算10年以上", desc: "原則として日本に10年以上在留し、うち5年以上を就労資格（特定技能等）で過ごした場合、日本の永住権申請の要件を満たす。", type: "target", hasArrowAfter: false }
        ]
    }
];

const TimelineNodeRender = ({
    node,
    isLast,
    isEditing,
    onUpdate,
    onRemove,
    onAddAfter
}: {
    node: NodeData;
    isLast: boolean;
    isEditing: boolean;
    onUpdate: (data: Partial<NodeData>) => void;
    onRemove: () => void;
    onAddAfter: () => void;
}) => {
    const bgColors = {
        default: 'bg-gray-50 border-gray-350 text-[#1f1f1f]',
        highlight: 'bg-blue-50/50 border-blue-200 text-blue-800',
        warning: 'bg-orange-50/50 border-orange-200 text-orange-800',
        target: 'bg-[#24b47e]/5 border-[#24b47e]/30 text-[#1e9a6a]'
    };

    const iconColors = {
        default: 'text-gray-400',
        highlight: 'text-blue-500',
        warning: 'text-orange-500',
        target: 'text-[#24b47e]'
    };

    const IconWrapper = () => {
        if (node.type === 'highlight') return <CheckCircle2 size={16} className={iconColors[node.type]} />;
        if (node.type === 'warning') return <AlertTriangle size={16} className={iconColors[node.type]} />;
        if (node.type === 'target') return <Target size={16} className={iconColors[node.type]} />;
        return <ArrowRightCircle size={16} className={iconColors[node.type]} />;
    };

    return (
        <div className="relative pl-6 pb-8 border-l-2 border-gray-200 last:border-transparent last:pb-0 group/node">
            <div className={`absolute top-0 -left-[11px] w-5 h-5 rounded-full bg-white border-2 flex items-center justify-center transition-transform group-hover/node:scale-110
                ${node.type === 'default' ? 'border-gray-350' : node.type === 'highlight' ? 'border-blue-400' : node.type === 'warning' ? 'border-orange-400' : 'border-[#24b47e]'}`}
            >
                <div className={`w-2 h-2 rounded-full 
                    ${node.type === 'default' ? 'bg-gray-350' : node.type === 'highlight' ? 'bg-blue-500' : node.type === 'warning' ? 'bg-orange-500' : 'bg-[#24b47e]'}`}
                />
            </div>

            <div className={`border p-4 transition-colors ${bgColors[node.type]} relative`}>
                {isEditing ? (
                    <div className="flex flex-col gap-2 relative z-10">
                        <div className="flex gap-2 items-center">
                            <select
                                value={node.type}
                                onChange={(e) => onUpdate({ type: e.target.value as NodeType })}
                                className="text-xs border border-gray-300 rounded p-1 outline-none bg-white font-bold text-[#1f1f1f]"
                            >
                                <option value="default">通常</option>
                                <option value="highlight">ハイライト</option>
                                <option value="warning">試験 / 警告</option>
                                <option value="target">目標 / ゴール</option>
                            </select>
                            <button onClick={onRemove} title="削除" className="ml-auto text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"><Trash2 size={14} /></button>
                        </div>
                        <input
                            value={node.title}
                            onChange={(e) => onUpdate({ title: e.target.value })}
                            className="font-bold text-[14px] bg-white border border-gray-300 rounded px-2 py-1 outline-none w-full text-[#1f1f1f]"
                            placeholder="タイトル"
                        />
                        <input
                            value={node.duration}
                            onChange={(e) => onUpdate({ duration: e.target.value })}
                            className="font-mono font-bold text-[12px] bg-white border border-gray-300 rounded px-2 py-1 outline-none w-full text-[#1f1f1f]"
                            placeholder="期間 (例: 1年目)"
                        />
                        <textarea
                            value={node.desc}
                            onChange={(e) => onUpdate({ desc: e.target.value })}
                            className="text-[13px] bg-white border border-gray-300 rounded px-2 py-1 outline-none w-full resize-none h-[6rem] text-[#1f1f1f]"
                            placeholder="詳細説明"
                        />
                        <div className="flex items-center gap-2 mt-1">
                            <label className="text-[12px] flex items-center gap-1.5 cursor-pointer font-bold select-none text-[#1f1f1f]">
                                <input
                                    type="checkbox"
                                    checked={node.hasArrowAfter}
                                    onChange={(e) => onUpdate({ hasArrowAfter: e.target.checked })}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                次のステップに↓矢印を表示
                            </label>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-[14px] flex items-start gap-2 pr-4">
                                <span className="mt-0.5"><IconWrapper /></span>
                                <span>{node.title}</span>
                            </h4>
                            {node.duration && (
                                <span className="flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 border border-current bg-white/50 rounded text-inherit opacity-80 shrink-0">
                                    <Clock size={12} /> {node.duration}
                                </span>
                            )}
                        </div>
                        {node.desc && <p className="text-[13px] leading-relaxed font-medium whitespace-pre-wrap">{node.desc}</p>}
                    </>
                )}
            </div>

            {isEditing && (
                <div className="absolute -bottom-4 left-[9px] z-20 w-full flex items-center">
                    <button
                        onClick={onAddAfter}
                        className="bg-white border border-gray-300 rounded-full p-1.5 text-gray-500 hover:text-[#24b47e] hover:border-[#24b47e] hover:shadow-sm transition-all shadow"
                        title="下にノードを追加"
                    >
                        <Plus size={16} />
                    </button>
                </div>
            )}

            {node.hasArrowAfter && (
                <div className={`py-4 flex justify-center text-gray-300 transition-opacity ${isEditing ? 'opacity-50' : 'opacity-100'}`}>
                    <ArrowDown size={16} />
                </div>
            )}
        </div>
    );
};

export default function RoadmapClient() {
    const [isEditing, setIsEditing] = useState(false);
    const [columns, setColumns] = useState<ColumnData[]>(defaultColumns);
    const [mounted, setMounted] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem('kikan_roadmap_data');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed && Array.isArray(parsed) && parsed.length > 0) {
                    setColumns(parsed);
                }
            } catch (e) {
                console.error("Failed to parse roadmap data", e);
            }
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem('kikan_roadmap_data', JSON.stringify(columns));
        setIsEditing(false);
    };

    const handleCancel = () => {
        const saved = localStorage.getItem('kikan_roadmap_data');
        if (saved) {
            try {
                setColumns(JSON.parse(saved));
            } catch (e) {
                setColumns(defaultColumns);
            }
        } else {
            setColumns(defaultColumns);
        }
        setIsEditing(false);
    };

    const updateNode = (colIndex: number, nodeIndex: number, updates: Partial<NodeData>) => {
        const newCols = [...columns];
        newCols[colIndex].nodes[nodeIndex] = { ...newCols[colIndex].nodes[nodeIndex], ...updates };
        setColumns(newCols);
    };

    const removeNode = (colIndex: number, nodeIndex: number) => {
        const newCols = [...columns];
        newCols[colIndex].nodes.splice(nodeIndex, 1);
        setColumns(newCols);
    };

    const addNodeAfter = (colIndex: number, nodeIndex: number) => {
        const newCols = [...columns];
        const newNode: NodeData = {
            id: Date.now().toString() + Math.random().toString(36).substring(7),
            title: "新しいステップ",
            duration: "",
            desc: "説明文を入力してください。",
            type: "default",
            hasArrowAfter: false
        };
        newCols[colIndex].nodes.splice(nodeIndex + 1, 0, newNode);
        setColumns(newCols);
    };

    // Avoid hydration mismatch
    if (!mounted) return null; 

    const getIcon = (idx: number) => {
        if (idx === 0) return <GraduationCap size={20} />;
        if (idx === 1) return <Briefcase size={20} />;
        return <Target size={20} />;
    };

    const getLineColor = (idx: number) => {
        if (idx === 0) return "bg-gray-400";
        if (idx === 1) return "bg-blue-500";
        return "bg-[#24b47e]";
    };

    const getHeaderBg = (idx: number) => {
        if (idx === 0) return "bg-gray-50/50";
        if (idx === 1) return "bg-blue-50/30";
        return "bg-[#24b47e]/5";
    };

    const getIconBg = (idx: number) => {
        if (idx === 0) return "bg-gray-200 text-gray-600";
        if (idx === 1) return "bg-blue-100 text-blue-600";
        return "bg-[#24b47e]/10 text-[#24b47e]";
    };

    return (
        <div className="flex flex-col h-full bg-[#f3f4f6]/30">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-350 bg-white shrink-0">
                <div>
                    <h2 className="text-[20px] font-bold tracking-tight text-[#1f1f1f]">外国人材制度ロードマップ (Timeline)</h2>
                    <p className="text-sm text-gray-500 font-medium mt-1">各制度の期間や要件を自由に編集・追加できます</p>
                </div>
                <div className="flex items-center gap-3">
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 border border-gray-300 font-bold text-[#1f1f1f] text-sm bg-white hover:bg-gray-50 transition-colors"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-5 py-2 font-bold text-white text-sm bg-[#1f1f1f] hover:bg-black transition-colors flex items-center gap-2"
                            >
                                <Save size={16} /> 保存する
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-5 py-2 font-bold text-[#1f1f1f] border border-gray-300 text-sm bg-white hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                            <Edit size={16} /> タイムラインを編集
                        </button>
                    )}
                </div>
            </div>

            {/* 3 Columns Layout */}
            <div className="flex-1 overflow-y-auto p-6 no-scrollbar pb-24">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {columns.map((col, colIdx) => (
                        <div key={colIdx} className={`bg-white border border-gray-350 flex flex-col relative overflow-hidden ${colIdx === 1 ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}>
                            <div className={`absolute top-0 left-0 w-full h-1 ${getLineColor(colIdx)}`}></div>
                            <div className={`p-5 border-b border-gray-350 ${getHeaderBg(colIdx)}`}>
                                <div className={`w-10 h-10 rounded flex items-center justify-center mb-3 ${getIconBg(colIdx)}`}>
                                    {getIcon(colIdx)}
                                </div>

                                {isEditing ? (
                                    <div className="relative z-20 space-y-2 mb-2">
                                        <input
                                            value={col.title}
                                            onChange={(e) => {
                                                const newCols = [...columns];
                                                newCols[colIdx].title = e.target.value;
                                                setColumns(newCols);
                                            }}
                                            className="font-bold text-lg bg-white border border-gray-300 rounded px-2 py-1 outline-none w-full text-[#1f1f1f]"
                                            placeholder="制度名"
                                        />
                                        <input
                                            value={col.subtitle}
                                            onChange={(e) => {
                                                const newCols = [...columns];
                                                newCols[colIdx].subtitle = e.target.value;
                                                setColumns(newCols);
                                            }}
                                            className="font-bold text-xs bg-white border border-gray-300 rounded px-2 py-1 outline-none w-full text-[#1f1f1f]"
                                            placeholder="英語サブタイトル"
                                        />
                                        <input
                                            value={col.badge}
                                            onChange={(e) => {
                                                const newCols = [...columns];
                                                newCols[colIdx].badge = e.target.value;
                                                setColumns(newCols);
                                            }}
                                            className="font-bold text-xs bg-white border border-gray-300 rounded px-2 py-1 outline-none w-full text-[#1f1f1f]"
                                            placeholder="バッジテキスト"
                                        />
                                        <textarea
                                            value={col.desc}
                                            onChange={(e) => {
                                                const newCols = [...columns];
                                                newCols[colIdx].desc = e.target.value;
                                                setColumns(newCols);
                                            }}
                                            className="font-medium text-[13px] bg-white border border-gray-300 rounded px-2 py-1 outline-none w-full resize-none h-20 text-[#1f1f1f]"
                                            placeholder="制度の概要"
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <h3 className="text-lg font-bold text-[#1f1f1f]">{col.title}</h3>
                                        <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-wider">{col.subtitle}</p>
                                        <span className={`inline-block mt-3 border text-[11px] font-bold px-2 py-0.5 rounded ${col.badgeClass}`}>
                                            {col.badge}
                                        </span>
                                        <p className="text-[13px] text-gray-600 font-medium mt-4 line-clamp-3">
                                            {col.desc}
                                        </p>
                                    </>
                                )}
                            </div>
                            <div className={`px-6 pt-6 bg-white flex-1 relative ${isEditing ? 'pb-16' : 'pb-6'}`}>
                                {isEditing && col.nodes.length === 0 && (
                                    <button
                                        onClick={() => addNodeAfter(colIdx, -1)}
                                        className="w-full py-4 border-2 border-dashed border-gray-300 text-gray-500 rounded font-bold hover:bg-gray-50 hover:text-[#24b47e] hover:border-[#24b47e] transition-colors flex flex-col items-center justify-center gap-2"
                                    >
                                        <Plus size={20} />
                                        最初のノードを追加
                                    </button>
                                )}
                                {col.nodes.map((node, nodeIdx) => (
                                    <TimelineNodeRender
                                        key={node.id}
                                        node={node}
                                        isLast={nodeIdx === col.nodes.length - 1}
                                        isEditing={isEditing}
                                        onUpdate={(updates) => updateNode(colIdx, nodeIdx, updates)}
                                        onRemove={() => removeNode(colIdx, nodeIdx)}
                                        onAddAfter={() => addNodeAfter(colIdx, nodeIdx)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}