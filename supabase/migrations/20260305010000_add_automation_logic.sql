-- Create a function to generate automatic tasks for visas, exams, and audits
CREATE OR REPLACE FUNCTION public.generate_automatic_tasks() RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    visa_rec RECORD;
    exam_rec RECORD;
    kansa_rec RECORD;
BEGIN
    -- 1. Automate Visa Tasks (90 days before expiration)
    FOR visa_rec IN 
        SELECT v.id, v.tenant_id, v.worker_id, v.expiration_date, w.full_name_romaji, w.company_id
        FROM public.visas v
        JOIN public.workers w ON v.worker_id = w.id
        WHERE v.is_deleted = false 
        AND v.expiration_date <= (CURRENT_DATE + INTERVAL '90 days')
        AND v.process_status = 'gathering'
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM public.tasks 
            WHERE worker_id = visa_rec.worker_id 
            AND task_type = 'auto_visa'
            AND status != 'done'
            AND is_deleted = false
        ) THEN
            INSERT INTO public.tasks (tenant_id, company_id, worker_id, title, description, priority, due_date, task_type)
            VALUES (
                visa_rec.tenant_id, 
                visa_rec.company_id, 
                visa_rec.worker_id, 
                '【自動】ビザ更新書類の準備: ' || visa_rec.full_name_romaji,
                'ビザ有効期限が90日以内のため、更新書類の準備を開始してください。期限: ' || visa_rec.expiration_date,
                'high',
                visa_rec.expiration_date,
                'auto_visa'
            );
        END IF;
    END LOOP;

    -- 2. Automate Exam Tasks (15 days before deadline - UPDATED)
    FOR exam_rec IN 
        SELECT e.id, e.tenant_id, e.worker_id, e.deadline_date, e.exam_type, w.full_name_romaji, w.company_id
        FROM public.exams e
        JOIN public.workers w ON e.worker_id = w.id
        WHERE e.is_deleted = false 
        AND e.deadline_date <= (CURRENT_DATE + INTERVAL '15 days')
        AND e.result = 'planned'
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM public.tasks 
            WHERE worker_id = exam_rec.worker_id 
            AND task_type = 'auto_exam'
            AND title LIKE '%' || exam_rec.exam_type || '%'
            AND status != 'done'
            AND is_deleted = false
        ) THEN
            INSERT INTO public.tasks (tenant_id, company_id, worker_id, title, description, priority, due_date, task_type)
            VALUES (
                exam_rec.tenant_id, 
                exam_rec.company_id, 
                exam_rec.worker_id, 
                '【自動】試験受験準備: ' || exam_rec.full_name_romaji || ' (' || exam_rec.exam_type || ')',
                '試験申込期限が15日以内のため、案内と申込状況を確認してください。期限: ' || exam_rec.deadline_date,
                'medium',
                exam_rec.deadline_date,
                'auto_exam'
            );
        END IF;
    END LOOP;

    -- 3. Automate Kansa Tasks (Every 3 months from last audit - NEW)
    FOR kansa_rec IN 
        SELECT c.id as company_id, c.tenant_id, c.name_jp, 
               MAX(a.actual_date) as last_kansa_date
        FROM public.companies c
        LEFT JOIN public.audits a ON c.id = a.company_id AND a.audit_type = 'kansa' AND a.status = 'completed'
        WHERE c.is_deleted = false
        GROUP BY c.id, c.tenant_id, c.name_jp
    LOOP
        -- If last kansa was > 80 days ago (~2.7 months) or never done
        IF kansa_rec.last_kansa_date IS NULL OR kansa_rec.last_kansa_date <= (CURRENT_DATE - INTERVAL '80 days') THEN
             IF NOT EXISTS (
                SELECT 1 FROM public.tasks 
                WHERE company_id = kansa_rec.company_id 
                AND task_type = 'auto_kansa'
                AND status != 'done'
                AND is_deleted = false
             ) THEN
                INSERT INTO public.tasks (tenant_id, company_id, title, description, priority, due_date, task_type)
                VALUES (
                    kansa_rec.tenant_id, 
                    kansa_rec.company_id, 
                    '【自動】定期監査(Kansa)の実施計画: ' || kansa_rec.name_jp,
                    '前回の監査から約3ヶ月が経過します。次回の定期監査を計画してください。',
                    'high',
                    CURRENT_DATE + INTERVAL '7 days',
                    'auto_kansa'
                );
             END IF;
        END IF;
    END LOOP;
END;
$$;
