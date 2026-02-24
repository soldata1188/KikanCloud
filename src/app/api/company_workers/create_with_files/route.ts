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

        const workerData: any = {
            tenant_id,
            full_name_romaji: getStr('full_name_romaji'),
            full_name_kana: getStr('full_name_kana'),
            dob: getStr('dob') || '2000-01-01',
            gender: getStr('gender'),
            blood_type: getStr('blood_type'),
            nationality: getStr('nationality'),
            address: getStr('address'),
            company_id: getStr('company_id') || null,
            industry_field: getStr('industry_field'),
            sending_org: getStr('sending_org'),
            system_type: getStr('system_type'),
            status: getStr('status'),
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

        /* 
        // 開発環境テストのため、一時的に重複チェック（Duplicate Check）を無効化
        if (workerData.passport_no || workerData.zairyu_no) {
            let query = supabase.from('workers').select('id, passport_no, zairyu_no').eq('tenant_id', tenant_id).eq('is_deleted', false);

            // Build an OR condition
            const orConditions = [];
            if (workerData.passport_no) orConditions.push(`passport_no.eq.${workerData.passport_no}`);
            if (workerData.zairyu_no) orConditions.push(`zairyu_no.eq.${workerData.zairyu_no}`);

            query = query.or(orConditions.join(','));

            const { data: existingWorkers, error: checkErr } = await query;
            if (checkErr) throw checkErr;

            if (existingWorkers && existingWorkers.length > 0) {
                const isPassportMatch = existingWorkers.some((w: any) => w.passport_no === workerData.passport_no);
                const isZairyuMatch = existingWorkers.some((w: any) => w.zairyu_no === workerData.zairyu_no);

                let errorMsg = "この外国人材は既に登録されています。"; // Default error message
                if (isPassportMatch && isZairyuMatch) {
                    errorMsg = "入力されたパスポート番号と在留カード番号は既にシステムに存在します。(Both Passport and Zairyu Card number already exist)";
                } else if (isPassportMatch) {
                    errorMsg = "入力されたパスポート番号は既にシステムに存在します。(Passport number already exists)";
                } else if (isZairyuMatch) {
                    errorMsg = "入力された在留カード番号は既にシステムに存在します。(Zairyu Card number already exists)";
                }

                return NextResponse.json({ error: errorMsg }, { status: 400 });
            }
        }
        */

        const { data: newWorker, error: workerErr } = await supabase
            .from('workers')
            .insert(workerData)
            .select()
            .single();

        if (workerErr) throw workerErr;

        const workerId = newWorker.id;

        // 2. Upload Files to Storage
        for (const [key, value] of formData.entries()) {
            if (key.startsWith('file_') && value instanceof File && value.size > 0) {
                const docType = key.replace('file_', '');
                const file = value;
                const isAvatar = docType === 'avatar';
                const bucketName = isAvatar ? 'avatars' : 'worker_documents';

                // Keep original filename but ensure it's safe
                const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
                const filePath = `${tenant_id}/${workerId}/${docType}_${Date.now()}_${safeName}`;

                const { error: uploadError } = await supabase.storage.from(bucketName).upload(filePath, file);

                if (!uploadError) {
                    const { data: pubUrl } = supabase.storage.from(bucketName).getPublicUrl(filePath);

                    if (isAvatar) {
                        // Update worker avatar
                        await supabase.from('workers').update({ avatar_url: pubUrl.publicUrl }).eq('id', workerId);
                    }
                } else {
                    console.error(`Failed to upload ${docType}:`, uploadError);
                }
            }
        }

        return NextResponse.json({ success: true, workerId }, { status: 200 });

    } catch (error: any) {
        console.error("Worker Creation Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
