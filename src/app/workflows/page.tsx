import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { TopNav } from '@/components/TopNav'
import WorkflowMapClient from './WorkflowMapClient'
import { MarkerType } from '@xyflow/react'

export const dynamic = 'force-dynamic';

export default async function WorkflowsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('role, tenant_id').eq('id', user.id).single()
    const { data: workflowData } = await supabase.from('workflow_maps').select('nodes, edges').eq('tenant_id', userProfile?.tenant_id).single()

    const defaultNodes = [
        { id: '1', type: 'custom', position: { x: 250, y: 50 }, data: { step: '1', phase: '営業', status: 'done', label: '企業登録・求人', duration: '随時', content: '受入企業の基本情報を登録し、求人票を作成します。入管法および技能実習法の要件を満たしているか確認します。', docs: ['企業登記簿', '決算書', '求人票'] } },
        { id: '2', type: 'custom', position: { x: 250, y: 200 }, data: { step: '2', phase: '面接', status: 'done', label: '面接・内定', duration: '約1ヶ月', content: '現地面接またはオンライン面接を実施。合格者と雇用契約を締結します。母国語での十分な説明が必要です。', docs: ['面接評価表', '雇用条件通知書', '雇用契約書'] } },
        { id: '3', type: 'custom', position: { x: 250, y: 350 }, data: { step: '3', phase: '機構申請', status: 'pending', label: '技能実習計画認定申請', duration: '約1〜2ヶ月', content: '外国人技能実習機構（OTIT）へ計画認定申請を行います。審査が完了し認定証が交付されるまで待機します。', docs: ['技能実習計画認定申請書', '送出機関の推薦状'] } },
        { id: '4', type: 'custom', position: { x: 250, y: 500 }, data: { step: '4', phase: '入管申請', status: 'pending', label: '在留資格認定証明書', duration: '約1〜3ヶ月', content: '管轄の出入国在留管理局へCOE（在留資格認定証明書）の交付申請を行います。OTIT認定証の写しが必須です。', docs: ['在留資格認定証明書交付申請書', 'OTIT認定証の写し'] } },
        { id: '5', type: 'custom', position: { x: 250, y: 650 }, data: { step: '5', phase: '入国', status: 'pending', label: 'ビザ発給・入国', duration: '約2週間', content: 'COE原本を現地送出機関へ郵送し、日本大使館でビザを発給。航空券を手配し日本へ入国させます。', docs: ['COE原本', '査証申請書', '航空券手配'] } },
        { id: '6', type: 'custom', position: { x: 250, y: 800 }, data: { step: '6', phase: '講習', status: 'pending', label: '入国後講習・配属', duration: '約1ヶ月', content: '約1ヶ月間の入国後講習（日本語、法的保護など）を実施後、受入企業へ配属し就労を開始します。市役所で住所登録を行います。', docs: ['講習実施記録', '転出転入届', 'マイナンバー申請'] } },
        { id: '7', type: 'custom', position: { x: 250, y: 950 }, data: { step: '7', phase: '監査', status: 'pending', label: '訪問指導・監査', duration: '毎月/3ヶ月毎', content: '毎月の訪問指導（第1号の場合）、3ヶ月ごとの定期監査を実施し、賃金台帳やタイムカードを確認。機構へ報告します。', docs: ['訪問指導記録書', '定期監査報告書', '出勤簿・賃金台帳'] } },
    ];
    const defaultEdges = [
        { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#24b47e', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#24b47e' } },
        { id: 'e2-3', source: '2', target: '3', animated: true, style: { stroke: '#24b47e', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#24b47e' } },
        { id: 'e3-4', source: '3', target: '4', animated: true, style: { stroke: '#24b47e', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#24b47e' } },
        { id: 'e4-5', source: '4', target: '5', animated: true, style: { stroke: '#24b47e', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#24b47e' } },
        { id: 'e5-6', source: '5', target: '6', animated: true, style: { stroke: '#24b47e', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#24b47e' } },
        { id: 'e6-7', source: '6', target: '7', animated: true, style: { stroke: '#24b47e', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#24b47e' } },
    ];

    const initialNodes = workflowData?.nodes && Array.isArray(workflowData.nodes) && workflowData.nodes.length > 0 ? workflowData.nodes : defaultNodes;
    const initialEdges = workflowData?.edges && Array.isArray(workflowData.edges) && workflowData.edges.length > 0 ? workflowData.edges : defaultEdges;

    return (
        <div className="flex h-screen bg-[#fbfcfd] font-sans text-[#1f1f1f] overflow-hidden selection:bg-[#24b47e]/20">
            <Sidebar active="workflows" />
            <div className="flex-1 flex flex-col relative min-w-0">
                <TopNav title="業務フロービルダー" role={userProfile?.role} />
                <main className="flex-1 p-6 md:p-8 relative">
                    <WorkflowMapClient dbNodes={initialNodes} dbEdges={initialEdges} role={userProfile?.role || 'staff'} />
                </main>
            </div>
        </div>
    )
}
