'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, MoreVertical, Paperclip, Send, FileText, Download, Folder, Image as ImageIcon, File as FileIconLucide, Info, ChevronDown, Loader2 } from 'lucide-react'
import { useFirebaseUpload } from '@/hooks/useFirebaseUpload'

// --- Types ---
type Company = { id: string; name: string; avatar: string; lastMessage: string; unread: number; time: string; }
type FileData = { id: string; name: string; url?: string; size: string; type: 'pdf' | 'word' | 'image' | 'excel' | 'other'; date: string }
type Message = { id: string; sender: 'me' | 'them'; type: 'text' | 'file'; content?: string; file?: FileData; time: string }

// --- Initial Data ---
const INITIAL_COMPANIES: Company[] = [
    { id: '1', name: '株式会社テクノソリューションズ', avatar: 'T', lastMessage: '書類を確認しました。ありがとうございます。', unread: 2, time: '10:30' },
    { id: '2', name: 'グローバル製造株式会社', avatar: 'G', lastMessage: '面接の日程ですが、来週の水曜日は...', unread: 0, time: '昨日' },
    { id: '3', name: 'さくら建設工業', avatar: 'S', lastMessage: 'よろしくお願いします。', unread: 0, time: '10/24' },
    { id: '4', name: '未来ファーム農業組合', avatar: 'M', lastMessage: 'ビザの更新手続きについて質問があります。', unread: 1, time: '10/22' },
    { id: '5', name: 'ひまわり介護サービス', avatar: 'H', lastMessage: '新しい候補者の履歴書をお待ちしております。', unread: 0, time: '10/20' },
]

const INITIAL_MESSAGES: Record<string, Message[]> = {
    '1': [
        { id: 'm1', sender: 'me', type: 'text', content: 'お世話になっております。次期の実習生に関する書類を送付いたします。ご確認のほどよろしくお願いいたします。', time: '10:00' },
        { id: 'm2', sender: 'me', type: 'file', file: { id: 'f1', name: '実習生候補者名簿_2026.pdf', size: '2.4 MB', type: 'pdf', date: '今日 10:01' }, time: '10:01' },
        { id: 'm3', sender: 'them', type: 'text', content: '書類を確認しました。ありがとうございます。\nいくつか修正点がありますので、別途ファイルの確認をお願いできますでしょうか？', time: '10:30' },
        { id: 'm4', sender: 'them', type: 'file', file: { id: 'f2', name: '要件修正依頼_2026.docx', size: '1.2 MB', type: 'word', date: '今日 10:31' }, time: '10:31' },
    ],
    '2': [
        { id: 'm2-1', sender: 'them', type: 'text', content: 'お世話になっております。\n面接の日程ですが、来週の水曜日はご都合いかがでしょうか？', time: '昨日' }
    ]
}

const INITIAL_FILES: Record<string, FileData[]> = {
    '1': [
        { id: 'f2', name: '要件修正依頼_2026.docx', size: '1.2 MB', date: '今日 10:31', type: 'word' },
        { id: 'f1', name: '実習生候補者名簿_2026.pdf', size: '2.4 MB', date: '今日 10:01', type: 'pdf' },
        { id: 'f3', name: '会社案内パンフレット.pdf', size: '5.6 MB', date: '10/12', type: 'pdf' },
        { id: 'f4', name: '採用条件シート.xlsx', size: '840 KB', date: '10/05', type: 'excel' },
    ],
    '2': []
}

const getCurrentTimeStr = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

const getFileType = (fileName: string): 'pdf' | 'word' | 'image' | 'excel' | 'other' => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (['pdf'].includes(ext)) return 'pdf';
    if (['doc', 'docx'].includes(ext)) return 'word';
    if (['xls', 'xlsx'].includes(ext)) return 'excel';
    if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) return 'image';
    return 'other';
}

const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const FileIcon = ({ type, className = "" }: { type: string, className?: string }) => {
    switch (type) {
        case 'pdf': return <div className={`p-2 bg-red-100 text-red-600 rounded-lg ${className}`}><FileText size={20} /></div>
        case 'word': return <div className={`p-2 bg-blue-100 text-blue-600 rounded-lg ${className}`}><FileText size={20} /></div>
        case 'excel': return <div className={`p-2 bg-green-100 text-green-600 rounded-lg ${className}`}><FileText size={20} /></div>
        case 'image': return <div className={`p-2 bg-purple-100 text-purple-600 rounded-lg ${className}`}><ImageIcon size={20} /></div>
        default: return <div className={`p-2 bg-gray-100 text-gray-600 rounded-lg ${className}`}><FileIconLucide size={20} /></div>
    }
}

export default function B2BChatClient() {
    // State
    const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES)
    const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>(INITIAL_MESSAGES)
    const [filesMap, setFilesMap] = useState<Record<string, FileData[]>>(INITIAL_FILES)

    const [selectedCompanyId, setSelectedCompanyId] = useState('1')
    const [searchQuery, setSearchQuery] = useState('')
    const [messageInput, setMessageInput] = useState('')
    const [isDragging, setIsDragging] = useState(false)
    const [activeTab, setActiveTab] = useState<'files' | 'info'>('files')
    const [fileInputKey, setFileInputKey] = useState(0)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Firebase Upload Hook
    const { progress, error: uploadError, isUploading, uploadFile } = useFirebaseUpload('b2b_chat_files')

    // Derived values
    const selectedCompany = companies.find(c => c.id === selectedCompanyId) || companies[0]
    const filteredCompanies = companies.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    const currentMessages = messagesMap[selectedCompanyId] || []
    const currentFiles = filesMap[selectedCompanyId] || []

    // Read messages when company selected
    useEffect(() => {
        setCompanies(prev => prev.map(c =>
            c.id === selectedCompanyId ? { ...c, unread: 0 } : c
        ))
    }, [selectedCompanyId])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [currentMessages, selectedCompanyId])

    const updateCompanyStatus = useCallback((companyId: string, lastMessage: string, time: string) => {
        setCompanies(prev => {
            const index = prev.findIndex(c => c.id === companyId)
            if (index === -1) return prev;
            const company = prev[index];
            const updatedCompany = { ...company, lastMessage, time };
            const newCompanies = [...prev];
            newCompanies.splice(index, 1);
            return [updatedCompany, ...newCompanies];
        })
    }, [])

    const handleSendMessage = () => {
        if (!messageInput.trim()) return

        const timeStr = getCurrentTimeStr()
        const newMsg: Message = {
            id: Date.now().toString(),
            sender: 'me',
            type: 'text',
            content: messageInput,
            time: timeStr
        }

        setMessagesMap(prev => ({
            ...prev,
            [selectedCompanyId]: [...(prev[selectedCompanyId] || []), newMsg]
        }))

        updateCompanyStatus(selectedCompanyId, messageInput.slice(0, 20) + (messageInput.length > 20 ? '...' : ''), timeStr)
        setMessageInput('')
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const compressImage = async (file: File): Promise<File> => {
        if (!file.type.startsWith('image/')) return file;

        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    const MAX_SIZE = 800;
                    if (width > height && width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    } else if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    let quality = 0.8;
                    const reduceQuality = () => {
                        canvas.toBlob((blob) => {
                            if (!blob) {
                                resolve(file);
                                return;
                            }
                            if (blob.size > 200 * 1024 && quality > 0.1) {
                                quality -= 0.1;
                                reduceQuality();
                            } else {
                                const compressedFile = new File([blob], file.name, {
                                    type: 'image/jpeg',
                                    lastModified: Date.now(),
                                });
                                resolve(compressedFile);
                            }
                        }, 'image/jpeg', quality);
                    };

                    reduceQuality();
                };
                img.onerror = () => resolve(file);
            };
            reader.onerror = () => resolve(file);
        });
    };

    const handleFilesAttached = async (files: FileList | File[]) => {
        const timeStr = getCurrentTimeStr()
        const currentCompanyId = selectedCompanyId
        const newMessages: Message[] = []
        const newSharedFiles: FileData[] = []

        const processedFiles = await Promise.all(Array.from(files).map(f => compressImage(f as File)));

        for (let idx = 0; idx < processedFiles.length; idx++) {
            const file = processedFiles[idx];
            let fileUrl = '';
            try {
                fileUrl = (await uploadFile(file)) || '';
            } catch (err) {
                console.error("Lỗi khi tải file:", err);
            }

            const fileData: FileData = {
                id: `f-${Date.now()}-${idx}`,
                name: file.name,
                url: fileUrl,
                size: formatBytes(file.size), // Displays compressed size
                type: getFileType(file.name),
                date: `今日 ${timeStr}`
            }
            newSharedFiles.push(fileData)
            newMessages.push({
                id: `msg-${Date.now()}-${idx}`,
                sender: 'me',
                type: 'file',
                file: fileData,
                time: timeStr
            })
        }

        if (newMessages.length > 0) {
            setMessagesMap(prev => ({
                ...prev,
                [currentCompanyId]: [...(prev[currentCompanyId] || []), ...newMessages]
            }))

            setFilesMap(prev => ({
                ...prev,
                [currentCompanyId]: [...newSharedFiles, ...(prev[currentCompanyId] || [])]
            }))

            updateCompanyStatus(currentCompanyId, `${newMessages.length} 個のファイルを送信しました`, timeStr)
        }
    }

    // Drag and Drop Handlers
    const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFilesAttached(e.dataTransfer.files)
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFilesAttached(e.target.files)
            setFileInputKey(prev => prev + 1) // Reset input
        }
    }

    return (
        <div className="flex w-full h-full bg-[#f4f7f6]">

            {/* Column 1: Company List (25% ~ 320px) */}
            <div className="w-[320px] shrink-0 flex flex-col bg-white border-r border-gray-200 z-10">
                <div className="h-16 flex items-center px-4 border-b border-gray-200 shrink-0">
                    <h2 className="text-lg font-bold text-gray-800">企業連絡チャット</h2>
                </div>
                <div className="p-3 bg-white shrink-0">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="企業名で検索..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-gray-100 border-transparent rounded-lg text-sm focus:bg-white focus:border-[#24b47e] focus:ring-1 focus:ring-[#24b47e] outline-none transition-all text-gray-800 placeholder:text-gray-500"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto w-full no-scrollbar">
                    {filteredCompanies.map(company => (
                        <button
                            key={company.id}
                            onClick={() => setSelectedCompanyId(company.id)}
                            className={`w-full flex items-start gap-3 p-3 text-left transition-colors border-l-2
                                ${selectedCompanyId === company.id
                                    ? 'bg-[#e8f5f0] border-[#24b47e]'
                                    : 'border-transparent hover:bg-gray-50'}
                            `}
                        >
                            <div className="relative shrink-0">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                                    ${selectedCompanyId === company.id ? 'bg-[#24b47e] text-white' : 'bg-gray-200 text-gray-600'}
                                `}>
                                    {company.avatar}
                                </div>
                                {company.unread > 0 && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">
                                        {company.unread}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0 pr-1">
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <h3 className={`font-semibold text-[15px] truncate ${selectedCompanyId === company.id ? 'text-gray-900' : 'text-gray-800'}`}>
                                        {company.name}
                                    </h3>
                                    <span className={`text-[11px] shrink-0 ml-2 ${company.unread > 0 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                                        {company.time}
                                    </span>
                                </div>
                                <p className={`text-xs truncate ${company.unread > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                                    {company.lastMessage}
                                </p>
                            </div>
                        </button>
                    ))}
                    {filteredCompanies.length === 0 && (
                        <div className="text-center p-4 text-sm text-gray-400">
                            見つかりませんでした
                        </div>
                    )}
                </div>
            </div>

            {/* Column 2: Main Chat Window (Flex 1) */}
            <div
                className="flex-1 flex flex-col relative min-w-[400px]"
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Drag Overlay */}
                {isDragging && (
                    <div className="absolute inset-0 bg-indigo-50/90 z-50 flex flex-col items-center justify-center border-4 border-dashed border-indigo-400 m-4 rounded-3xl">
                        <div className="w-20 h-20 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center mb-4 shadow-sm animate-bounce">
                            <Download size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-indigo-700">ファイルをドロップして送信</h2>
                        <p className="text-indigo-500 mt-2">PDF, Word, Excel, 画像ファイルなど</p>
                    </div>
                )}

                {/* Header */}
                <div className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-200 shrink-0 shadow-sm z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#24b47e] flex items-center justify-center font-bold text-lg text-white shadow-sm">
                            {selectedCompany.avatar}
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-800 text-[16px] leading-tight">{selectedCompany.name}</h2>
                            <p className="text-xs text-[#24b47e] font-medium flex items-center gap-1 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#24b47e]"></span>
                                担当者: 佐藤 様
                            </p>
                        </div>
                    </div>
                    <div>
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                            <MoreVertical size={20} />
                        </button>
                    </div>
                </div>

                {/* Chat Body */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#f4f7f6] flex flex-col gap-5">
                    {currentMessages.length > 0 ? (
                        <div className="text-center my-4">
                            <span className="text-[11px] font-bold text-gray-400 bg-white px-3 py-1 rounded-full shadow-sm">今日</span>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center text-gray-400 flex flex-col items-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                    <Send size={24} className="text-gray-300 ml-1" />
                                </div>
                                <p className="text-sm">メッセージ履歴がありません</p>
                                <p className="text-xs mt-1">メッセージを送るか、ファイルをドロップして共有を開始</p>
                            </div>
                        </div>
                    )}

                    {currentMessages.map((msg) => (
                        <div key={msg.id} className={`flex max-w-[85%] ${msg.sender === 'me' ? 'self-end flex-row-reverse' : 'self-start'} gap-3`}>
                            {/* Avatar for 'them' */}
                            {msg.sender === 'them' && (
                                <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-600 shrink-0 shadow-sm text-sm">
                                    {selectedCompany.avatar}
                                </div>
                            )}

                            <div className="flex flex-col gap-1">
                                <div className={`flex items-baseline gap-2 ${msg.sender === 'me' ? 'flex-row-reverse' : ''}`}>
                                    <span className="text-xs text-gray-400 font-medium">{msg.time}</span>
                                </div>

                                {/* Text Message */}
                                {msg.type === 'text' && (
                                    <div className={`px-5 py-3 text-[15px] leading-relaxed shadow-sm whitespace-pre-wrap
                                        ${msg.sender === 'me'
                                            ? 'bg-[#24b47e] text-white rounded-[24px] rounded-tr-sm'
                                            : 'bg-white text-gray-800 border border-gray-100 rounded-[24px] rounded-tl-sm'}
                                    `}>
                                        {msg.content}
                                    </div>
                                )}

                                {/* File Message */}
                                {msg.type === 'file' && msg.file && (
                                    <div className={`flex flex-col gap-2 p-1 rounded-2xl shadow-sm border
                                        ${msg.sender === 'me' ? 'bg-[#e8f5f0] border-[#24b47e]/20 rounded-tr-sm' : 'bg-white border-gray-200 rounded-tl-sm'}
                                    `}>
                                        <div className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-gray-100 group min-w-[280px]">
                                            <FileIcon type={msg.file.type} />
                                            <div className="flex-1 min-w-0 pr-2">
                                                <p className="text-sm font-semibold text-gray-800 truncate" title={msg.file.name}>{msg.file.name}</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[11px] text-gray-500 font-medium">{msg.file.size}</p>
                                                    {msg.file.url && (
                                                        <span className="text-[10px] text-blue-500 font-medium bg-blue-50 px-1.5 py-0.5 rounded">Uploaded</span>
                                                    )}
                                                </div>
                                            </div>
                                            <a
                                                href={msg.file.url || '#'}
                                                target={msg.file.url ? "_blank" : "_self"}
                                                rel="noopener noreferrer"
                                                className={`p-2 rounded-full transition-colors z-10 ${msg.file.url ? 'text-[#24b47e] hover:bg-green-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                                            >
                                                <Download size={18} />
                                            </a>
                                        </div>
                                        {msg.sender === 'me' && <span className="text-[10px] text-[#24b47e] text-right px-2 font-medium">送信済み</span>}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Footer */}
                <div className="bg-white border-t border-gray-200 p-4 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-10">
                    <div className="max-w-4xl mx-auto bg-[#f8f9fa] border border-gray-200 rounded-[24px] p-1.5 flex items-end focus-within:ring-2 focus-within:ring-[#24b47e]/30 focus-within:border-[#24b47e] focus-within:bg-white transition-all">
                        <div className="flex items-center self-end mb-1 ml-1 shrink-0">
                            <input
                                type="file"
                                multiple
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                key={fileInputKey}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className={`p-2 rounded-full transition-colors relative group ${isUploading ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-[#24b47e] hover:bg-[#e8f5f0]'}`}
                            >
                                <Paperclip size={20} />
                                {!isUploading && <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">ファイルを添付</div>}
                            </button>
                        </div>

                        <textarea
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isUploading}
                            placeholder={isUploading ? "ファイルをアップロード中..." : "メッセージを入力...（ファイルをここにドロップ可能）"}
                            className="flex-1 max-h-32 min-h-[40px] bg-transparent border-none resize-none px-3 py-2.5 text-[15px] text-gray-800 outline-none placeholder:text-gray-400 disabled:opacity-50"
                            rows={1}
                        />

                        <div className="flex items-center self-end mb-1 mr-1 shrink-0 gap-2">
                            {isUploading && (
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                                    <Loader2 size={14} className="animate-spin" />
                                    <span className="text-[11px] font-bold">{progress}%</span>
                                </div>
                            )}
                            <button
                                onClick={handleSendMessage}
                                disabled={!messageInput.trim() || isUploading}
                                className={`p-2.5 rounded-full transition-all duration-200 shadow-sm
                                    ${messageInput.trim() && !isUploading
                                        ? 'bg-[#24b47e] text-white hover:bg-[#1e9668] hover:scale-105 active:scale-95'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                                `}
                            >
                                <Send size={18} className="translate-x-0.5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Column 3: Info & Files (25% ~ 300px) */}
            <div className="w-[300px] shrink-0 bg-white border-l border-gray-200 flex flex-col z-10 hidden lg:flex">
                <div className="h-16 flex items-center justify-between px-5 border-b border-gray-200 shrink-0">
                    <h2 className="text-[15px] font-bold text-gray-800 flex items-center gap-2">
                        <Info size={18} className="text-gray-400" />
                        情報とファイル
                    </h2>
                </div>

                <div className="flex border-b border-gray-100 shrink-0">
                    <button
                        onClick={() => setActiveTab('files')}
                        className={`flex-1 py-3 text-[13px] font-bold border-b-2 transition-colors
                            ${activeTab === 'files' ? 'border-[#24b47e] text-[#24b47e]' : 'border-transparent text-gray-500 hover:text-gray-700'}
                        `}
                    >
                        共有ファイル
                    </button>
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`flex-1 py-3 text-[13px] font-bold border-b-2 transition-colors
                            ${activeTab === 'info' ? 'border-[#24b47e] text-[#24b47e]' : 'border-transparent text-gray-500 hover:text-gray-700'}
                        `}
                    >
                        企業情報
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {activeTab === 'files' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">最近のファイル</span>
                                <button className="text-[11px] text-[#24b47e] hover:underline font-medium">すべて見る</button>
                            </div>

                            <div className="space-y-3">
                                {currentFiles.map(file => (
                                    <div key={file.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors group cursor-pointer border border-transparent hover:border-gray-100">
                                        <FileIcon type={file.type} className="shadow-sm" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-semibold text-gray-800 truncate leading-tight mb-1" title={file.name}>{file.name}</p>
                                            <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                                <span className="font-medium bg-gray-100 px-1.5 py-0.5 rounded">{file.size}</span>
                                                <span>{file.date}</span>
                                            </div>
                                        </div>
                                        <button className="text-gray-400 hover:text-[#24b47e] p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Download size={16} />
                                        </button>
                                    </div>
                                ))}
                                {currentFiles.length === 0 && (
                                    <div className="text-center py-6 text-xs text-gray-400">ファイルはありません</div>
                                )}
                            </div>

                            {currentFiles.length > 0 && (
                                <div className="mt-6">
                                    <button className="w-full flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold transition-colors justify-center border border-gray-200 shadow-sm">
                                        <Folder size={16} className="text-yellow-500" />
                                        共有フォルダを開く
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'info' && (
                        <div className="space-y-5">
                            <div>
                                <h4 className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-2">連絡先</h4>
                                <div className="p-3 bg-gray-50 rounded-xl space-y-2 border border-gray-100 text-[13px]">
                                    <div className="flex items-center justify-between"><span className="text-gray-500">担当者</span><span className="font-medium text-gray-800">佐藤 健太</span></div>
                                    <div className="flex items-center justify-between"><span className="text-gray-500">電話</span><span className="font-medium text-gray-800">03-1234-5678</span></div>
                                    <div className="flex items-center justify-between"><span className="text-gray-500">メール</span><span className="font-medium text-[#24b47e]">sato@techno.jp</span></div>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-2">設定</h4>
                                <div className="space-y-1">
                                    <button className="w-full flex items-center justify-between text-[13px] text-gray-700 p-2 hover:bg-gray-50 rounded-lg font-medium transition-colors">
                                        通知設定
                                        <ChevronDown size={16} className="text-gray-400" />
                                    </button>
                                    <button className="w-full flex items-center justify-between text-[13px] text-gray-700 p-2 hover:bg-gray-50 rounded-lg font-medium transition-colors">
                                        メンバー管理
                                        <ChevronDown size={16} className="text-gray-400" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

        </div>
    )
}
