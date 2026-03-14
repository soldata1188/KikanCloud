import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: userProfile } = await supabase.from('users').select('tenant_id').eq('id', user.id).single();
        if (!userProfile) return NextResponse.json({ error: "User profile not found" }, { status: 404 });

        const tenant_id = userProfile.tenant_id;

        // 1. Insert Worker Data
        const getStr = (key: string) => (formData.get(key) as string) || null;

        const full_name_romaji = getStr('full_name_romaji') || '';
        const full_name_kana   = getStr('full_name_kana') || full_name_romaji; // fallback to romaji if kana is empty

        const workerData: Record<string, unknown> = {
            tenant_id,
            full_name_romaji,
            full_name_kana,
            dob: getStr('dob') || '2000-01-01',
            gender: getStr('gender'),
            blood_type: getStr('blood_type'),
            nationality: getStr('nationality') || 'ベトナム',
            address: getStr('address'),
            company_id: getStr('company_id') || null,
            industry_field: getStr('industry_field'),
            sending_org: getStr('sending_org'),
            system_type: getStr('system_type') || 'ikusei_shuro',
            status: getStr('status') || 'waiting',
            entry_batch: getStr('entry_batch'),
            entry_date: getStr('entry_date'),
            insurance_exp: getStr('insurance_exp'),
            visa_status: getStr('visa_status'),
            zairyu_no: getStr('zairyu_no'),
            zairyu_exp: getStr('zairyu_exp'),
            passport_no: getStr('passport_no'),
            passport_exp: getStr('passport_exp'),
            cert_no: getStr('cert_no'),
            cert_start_date: getStr('cert_start_date'),
            cert_end_date: getStr('cert_end_date'),
            remarks: getStr('remarks'),
            has_spouse: getStr('has_spouse') === 'true' ? true : (getStr('has_spouse') === 'false' ? false : null),
            birthplace: getStr('birthplace'),
            japan_residence: getStr('japan_residence'),
        };

        // Clear empty strings to null for text fields and dates to avoid parsing issues
        for (const [key, value] of Object.entries(workerData)) {
            if (value === "") workerData[key] = null;
        }



        const { data: newWorker, error: workerErr } = await supabase
            .from('workers')
            .insert(workerData)
            .select()
            .single();

        if (workerErr) {
            console.error('[create_worker] DB Error:', JSON.stringify(workerErr));
            // Unique constraint violation → duplicate worker
            if (workerErr.code === '23505') {
                return NextResponse.json({
                    error: '同じ氏名・生年月日の人材がすでに登録されています。'
                }, { status: 409 });
            }
            // Not null violations
            if (workerErr.code === '23502') {
                return NextResponse.json({
                    error: `必須項目が入力されていません: ${workerErr.message}`
                }, { status: 400 });
            }
            return NextResponse.json({
                error: workerErr.message || 'データベースエラーが発生しました。'
            }, { status: 500 });
        }

        const workerId = newWorker.id;

        // 2. Upload Files to Storage
        for (const [key, value] of formData.entries()) {
            if (key.startsWith('file_') && value instanceof File && value.size > 0) {
                const docType = key.replace('file_', '');
                const file = value;
                const isAvatar = docType === 'avatar';
                const bucketName = isAvatar ? 'avatars' : 'worker_documents';

                const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
                const filePath = `${tenant_id}/${workerId}/${docType}_${Date.now()}_${safeName}`;

                const { error: uploadError } = await supabase.storage.from(bucketName).upload(filePath, file);

                if (!uploadError) {
                    const { data: pubUrl } = supabase.storage.from(bucketName).getPublicUrl(filePath);
                    if (isAvatar) {
                        await supabase.from('workers').update({ avatar_url: pubUrl.publicUrl }).eq('id', workerId);
                    }
                }
            }
        }

        return NextResponse.json({ success: true, workerId }, { status: 200 });

    } catch (error: unknown) {
        console.error('[create_worker] Unexpected error:', error);
        const msg = error instanceof Error ? error.message : 'Internal Server Error'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
