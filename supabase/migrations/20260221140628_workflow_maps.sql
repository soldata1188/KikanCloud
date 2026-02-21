CREATE TABLE IF NOT EXISTS public.workflow_maps (
    tenant_id UUID PRIMARY KEY,
    nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
    edges JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.workflow_maps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their tenant workflow map" ON public.workflow_maps FOR ALL
USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()))
WITH CHECK (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
