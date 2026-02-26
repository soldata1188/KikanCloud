export type SystemType = 'ginou_jisshu' | 'ikusei_shuro' | 'tokuteigino';
export type WorkerStatus = 'waiting' | 'working' | 'missing' | 'returned' | 'standby';

export interface Company {
    id: string;
    tenant_id: string;
    name_jp: string;
    name_kana?: string;
    name_romaji?: string;
    corporate_number?: string;
    postal_code?: string;
    address?: string;
    phone?: string;
    email?: string;
    industry?: string;
    accepted_occupations?: string;
    representative?: string;
    representative_romaji?: string;
    manager_name?: string;
    training_date?: string;
    pic_name?: string;
    guidance_manager?: string;
    life_advisor?: string;
    tech_advisor?: string;
    employee_count?: number;
    labor_insurance_number?: string;
    employment_insurance_number?: string;
    acceptance_notification_number?: string;
    acceptance_notification_date?: string;
    general_supervision_fee?: number;
    category_3_supervision_fee?: number;
    support_fee?: number;
    remarks?: string;
    latitude?: number | null;
    longitude?: number | null;
    is_deleted?: boolean;
    updated_at?: string;
}

export interface Worker {
    id: string;
    tenant_id: string;
    company_id?: string;
    full_name_romaji: string;
    full_name_kana?: string;
    dob: string;
    gender?: 'male' | 'female';
    nationality?: string;
    system_type: SystemType;
    status: WorkerStatus;
    passport_no?: string;
    passport_exp?: string;
    zairyu_no?: string;
    zairyu_exp?: string;
    visa_status?: string;
    cert_start_date?: string;
    cert_end_date?: string;
    entry_date?: string;
    industry_field?: string;
    japanese_level?: string;
    entry_batch?: string;
    sending_org?: string;
    address?: string;
    emergency_contact?: string;
    insurance_exp?: string;
    avatar_url?: string;
    is_deleted?: boolean;
    created_at?: string;
    updated_at?: string;

    // Relationships joined from DB queries
    companies?: Company;
}

export interface Procedure {
    id: string;
    tenant_id: string;
    worker_id?: string;
    company_id?: string;
    agency: 'nyukan' | 'kikou' | 'kentei';
    procedure_name: string;
    status: 'preparing' | 'submitted' | 'completed' | 'issue';
    target_date?: string;
    submitted_date?: string;
    completed_date?: string;
    pic_name?: string;
    notes?: string;
    is_deleted?: boolean;
    created_at?: string;
    updated_at?: string;

    // Relationships
    workers?: Worker;
    companies?: Company;
}

export interface Audit {
    id: string;
    tenant_id: string;
    company_id: string;
    audit_type: 'kansa' | 'homon' | 'rinji';
    scheduled_date: string;
    actual_date?: string;
    status: 'planned' | 'in_progress' | 'completed';
    pic_name?: string;
    notes?: string;
    is_deleted?: boolean;
    created_at?: string;
    updated_at?: string;

    // Relationships
    companies?: Company;
}

export interface User {
    id: string;
    tenant_id: string;
    company_id?: string;
    full_name: string;
    role: string;
    avatar_url?: string;
    is_deleted?: boolean;
    created_at?: string;
    updated_at?: string;
}
