'use client'
import React, { useState, useCallback, useTransition } from 'react';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, BackgroundVariant, Handle, Position, MarkerType, addEdge, Connection, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { BookOpen, X, FileText, CheckCircle2, Clock, Edit2, Save, Plus, Trash2, Settings2 } from 'lucide-react';
import { saveWorkflowMap } from './actions';

const CustomNode = ({ data, selected, isConnectable }: { data: any, selected: boolean, isConnectable: boolean }) => (
    <div className={`bg-white border ${selected ? 'border-[#24b47e] shadow-md ring-1 ring-[#24b47e]/20' : 'border-gray-200 shadow-sm hover:border-[#878787]'} rounded-xl w-[280px] p-4 transition-all duration-200 cursor-pointer`}>
        <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="!w-3 !h-3 !bg-[#24b47e] !border-2 !border-white hover:!scale-150 transition-transform z-10" />
        <div className="flex items-center gap-2 mb-2">
            <div className={`w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold ${data.status === 'done' ? 'bg-[#24b47e] text-white' : 'bg-white border border-gray-200 text-[#878787]'}`}>{data.step || '?'}</div>
            <span className="text-[10px] font-bold text-[#878787] tracking-widest">{data.phase || '新規区分'}</span>
        </div>
        <h3 className="text-[14px] font-bold text-[#1f1f1f] leading-tight mb-1">{data.label || '新規ノード'}</h3>
        <p className="text-[11px] text-[#878787] font-medium mt-2 flex items-center gap-1.5"><Clock size={12} /> {data.duration || '--'}</p>
        <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="!w-3 !h-3 !bg-[#24b47e] !border-2 !border-white hover:!scale-150 transition-transform z-10" />
    </div>
);
const nodeTypes = { custom: CustomNode };

export default function WorkflowMapClient({ dbNodes, dbEdges, role }: { dbNodes: any[], dbEdges: any[], role: string }) {
    const [nodes, setNodes, onNodesChange] = useNodesState(dbNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(dbEdges);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [isPending, startTransition] = useTransition();

    const selectedNode = nodes.find(n => n.id === selectedNodeId);
    const canEdit = role === 'admin' || role === 'staff';

    const onNodeClick = useCallback((_: React.MouseEvent, node: any) => setSelectedNodeId(node.id), []);
    const onPaneClick = useCallback(() => setSelectedNodeId(null), []);
    const onConnect = useCallback((params: Connection | Edge) => {
        if (!isEditing) return;
        setEdges(eds => addEdge({ ...params, animated: true, style: { stroke: '#24b47e', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#24b47e' } }, eds));
    }, [setEdges, isEditing]);

    const handleAddNode = () => {
        const newNode = {
            id: crypto.randomUUID(), type: 'custom', position: { x: window.innerWidth / 2 - 140, y: window.innerHeight / 2 - 100 },
            data: { step: String(nodes.length + 1), phase: '新規区分', status: 'pending', label: '新しい手順', duration: '未定', content: '業務内容を入力してください。', docs: [] }
        };
        setNodes(nds => [...nds, newNode]);
        setSelectedNodeId(newNode.id);
    };

    const handleDeleteNode = () => {
        if (!selectedNodeId || !confirm('このステップを削除しますか？')) return;
        setNodes(nds => nds.filter(n => n.id !== selectedNodeId));
        setEdges(eds => eds.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId));
        setSelectedNodeId(null);
    };

    const updateNodeData = (field: string, value: any) => {
        setNodes(nds => nds.map(n => n.id === selectedNodeId ? { ...n, data: { ...n.data, [field]: value } } : n));
    };

    const handleSaveMap = () => {
        startTransition(async () => {
            try { await saveWorkflowMap(nodes, edges); setIsEditing(false); alert('マップを保存しました'); }
            catch (e: any) { alert('エラー: ' + e.message); }
        });
    };

    return (
        <div className="w-full h-full relative bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex">
            {/* MAP AREA */}
            <div className="flex-1 h-full relative">
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                    <div className="bg-white/90 backdrop-blur-sm border border-gray-200 px-4 py-2.5 rounded-md shadow-sm">
                        <h2 className="text-[13px] font-bold text-[#1f1f1f] flex items-center gap-2"><Settings2 size={16} className="text-[#24b47e]" /> 業務フロービルダー</h2>
                        <p className="text-[11px] text-[#878787] mt-1">{isEditing ? '編集モード：ドラッグで配置、丸い端子を繋げます。' : '閲覧モード：スクロールでズーム。クリックで詳細。'}</p>
                    </div>
                    {canEdit && (
                        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-gray-200 p-1.5 rounded-md shadow-sm w-fit">
                            {!isEditing ? (
                                <button onClick={() => { setIsEditing(true); setSelectedNodeId(null); }} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#1f1f1f] bg-white border border-gray-200 rounded hover:bg-white transition-colors"><Edit2 size={12} /> 編集モード</button>
                            ) : (
                                <>
                                    <button onClick={handleAddNode} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-white bg-[#1f1f1f] rounded hover:bg-[#333] transition-colors"><Plus size={12} /> 追加</button>
                                    <button onClick={handleSaveMap} disabled={isPending} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-white bg-[#24b47e] rounded hover:bg-[#1e9a6a] transition-colors"><Save size={12} /> {isPending ? '保存中...' : '保存'}</button>
                                    <button onClick={() => { setIsEditing(false); setNodes(dbNodes); setEdges(dbEdges); setSelectedNodeId(null); }} className="px-3 py-1.5 text-[11px] font-bold text-[#878787] hover:bg-gray-50 rounded">キャンセル</button>
                                </>
                            )}
                        </div>
                    )}
                </div>
                <ReactFlow
                    nodes={nodes} edges={edges}
                    onNodesChange={isEditing ? onNodesChange : undefined} onEdgesChange={isEditing ? onEdgesChange : undefined}
                    onNodeClick={onNodeClick} onPaneClick={onPaneClick} onConnect={onConnect}
                    nodeTypes={nodeTypes} fitView minZoom={0.2} maxZoom={2} nodesDraggable={isEditing} nodesConnectable={isEditing} elementsSelectable={true} deleteKeyCode={isEditing ? 'Backspace' : null}
                >
                    <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e1e5ea" />
                    <Controls className="!bg-white !border !border-gray-200 !rounded-md !shadow-sm fill-[#878787] mb-4 ml-4" showInteractive={false} />
                    <MiniMap className="!bg-white !border !border-gray-200 !rounded-md !shadow-sm mb-4 mr-4 hidden md:block" maskColor="rgba(255, 255, 255, 0.7)" nodeColor="#24b47e" />
                </ReactFlow>
            </div>

            {/* SIDE PANEL (SOP / EDIT FORM) */}
            <div className={`absolute top-0 right-0 h-full w-full sm:w-[420px] bg-white border-l border-gray-200 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-20 flex flex-col ${selectedNode ? 'translate-x-0' : 'translate-x-full'}`}>
                {selectedNode && (
                    <div className="w-full h-full flex flex-col">
                        <div className="p-6 border-b border-gray-200 flex items-start justify-between bg-white shrink-0">
                            <div className="flex-1 pr-4">
                                {isEditing ? (
                                    <div className="space-y-3 w-full">
                                        <div className="flex gap-2">
                                            <input type="text" value={selectedNode.data.step || ''} onChange={e => updateNodeData('step', e.target.value)} placeholder="番号" className="w-16 px-2.5 py-1.5 bg-white border border-gray-200 rounded-md text-xs outline-none focus:border-[#24b47e]" />
                                            <input type="text" value={selectedNode.data.phase || ''} onChange={e => updateNodeData('phase', e.target.value)} placeholder="区分" className="flex-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-md text-xs outline-none focus:border-[#24b47e] tracking-wider" />
                                        </div>
                                        <input type="text" value={selectedNode.data.label || ''} onChange={e => updateNodeData('label', e.target.value)} placeholder="タイトル" className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-md text-lg font-bold text-[#1f1f1f] outline-none focus:border-[#24b47e]" />
                                    </div>
                                ) : (
                                    <>
                                        <span className="px-2.5 py-1 border border-gray-200 text-[#878787] rounded-[4px] text-[10px] tracking-wider bg-white mb-3 inline-block">手順 {selectedNode.data.step} : {selectedNode.data.phase}</span>
                                        <h2 className="text-xl font-bold text-[#1f1f1f] leading-tight">{selectedNode.data.label}</h2>
                                    </>
                                )}
                            </div>
                            <button onClick={() => setSelectedNodeId(null)} className="w-8 h-8 flex items-center justify-center rounded-md border border-transparent hover:bg-gray-50 hover:border-gray-200 text-[#878787] hover:text-[#1f1f1f] transition-all"><X size={18} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-white">
                            {isEditing ? (
                                <div className="space-y-5">
                                    <div>
                                        <h3 className="text-[10px] font-bold text-[#878787] uppercase mb-1.5">ステータス</h3>
                                        <select value={selectedNode.data.status || 'pending'} onChange={e => updateNodeData('status', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-xs outline-none focus:border-[#24b47e]">
                                            <option value="pending">未着手</option><option value="done">完了</option>
                                        </select>
                                    </div>
                                    <div>
                                        <h3 className="text-[10px] font-bold text-[#878787] uppercase mb-1.5">所要期間</h3>
                                        <input type="text" value={selectedNode.data.duration || ''} onChange={e => updateNodeData('duration', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-xs outline-none focus:border-[#24b47e]" />
                                    </div>
                                    <div>
                                        <h3 className="text-[10px] font-bold text-[#878787] uppercase mb-1.5 flex items-center gap-1.5"><BookOpen size={12} /> 業務マニュアル</h3>
                                        <textarea rows={6} value={selectedNode.data.content || ''} onChange={e => updateNodeData('content', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-xs outline-none focus:border-[#24b47e] resize-none leading-relaxed" />
                                    </div>
                                    <div>
                                        <h3 className="text-[10px] font-bold text-[#878787] uppercase mb-1.5 flex items-center gap-1.5"><FileText size={12} /> 必要書類（カンマ区切り）</h3>
                                        <textarea rows={3} value={(selectedNode.data.docs || []).join(', ')} onChange={e => updateNodeData('docs', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))} placeholder="履歴書, パスポート, 申請書..." className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-xs outline-none focus:border-[#24b47e] resize-none leading-relaxed" />
                                    </div>
                                    <div className="pt-4 border-t border-gray-200">
                                        <button onClick={handleDeleteNode} className="flex justify-center items-center gap-1.5 w-full py-2.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"><Trash2 size={14} /> 削除</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-[11px] font-bold text-[#878787] uppercase tracking-widest flex items-center gap-2 mb-3"><Clock size={14} className="text-[#24b47e]" /> 目安期間</h3>
                                        <p className="text-[13px] text-[#1f1f1f] font-medium">{selectedNode.data.duration}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-[11px] font-bold text-[#878787] uppercase tracking-widest flex items-center gap-2 mb-3"><BookOpen size={14} className="text-[#24b47e]" /> 業務マニュアル</h3>
                                        <div className="text-[13px] text-[#444746] leading-relaxed bg-white border border-gray-200 p-4 rounded-xl shadow-sm whitespace-pre-wrap">{selectedNode.data.content}</div>
                                    </div>
                                    {selectedNode.data.docs?.length > 0 && (
                                        <div>
                                            <h3 className="text-[11px] font-bold text-[#878787] uppercase tracking-widest flex items-center gap-2 mb-3"><FileText size={14} className="text-[#24b47e]" /> 必要書類</h3>
                                            <ul className="space-y-2.5">
                                                {selectedNode.data.docs.map((doc: string, idx: number) => (
                                                    <li key={idx} className="flex items-center gap-2.5 text-[13px] font-medium text-[#1f1f1f] bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
                                                        <CheckCircle2 size={16} className="text-[#24b47e] shrink-0" /> {doc}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-200 bg-white text-center shrink-0">
                            <p className="text-[10px] font-bold text-[#878787] uppercase tracking-widest">{isEditing ? '編集モード（未公開）' : 'KIKANCLOUD 業務マニュアル'}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
