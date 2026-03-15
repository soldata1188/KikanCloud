CREATE TABLE public.transfer_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('airport_pickup', 'airport_dropoff', 'repatriation', 'hospital', 'other')),
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    departure_location TEXT,
    destination TEXT,
    flight_number VARCHAR(50),
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    pic_name TEXT,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_upd_transfer_schedules
    BEFORE UPDATE ON public.transfer_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.transfer_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant Isolation" ON public.transfer_schedules
    FOR ALL USING (tenant_id = public.get_auth_tenant_id() AND is_deleted = false);
