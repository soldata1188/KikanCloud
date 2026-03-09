-- Add company documents table
CREATE TABLE public.company_documents (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tenant_id uuid NOT NULL,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  doc_type character varying NOT NULL,
  file_name character varying NOT NULL,
  file_path character varying NOT NULL,
  file_size integer DEFAULT 0,
  content_type character varying,
  storage_path character varying,
  is_deleted boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Index
CREATE INDEX idx_company_documents_company_id ON public.company_documents(company_id);
CREATE INDEX idx_company_documents_tenant_id ON public.company_documents(tenant_id);

-- RLS
ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant_Isolation_All" ON public.company_documents
  FOR ALL USING (tenant_id = public.get_auth_tenant_id());

-- Create a storage bucket for company docs if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('company_docs', 'company_docs', false, 104857600, '{image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv}')
ON CONFLICT (id) DO UPDATE SET public = false;

CREATE POLICY "company_docs_select" ON storage.objects FOR SELECT USING (bucket_id = 'company_docs' AND storage.foldername(name)[1] IN (SELECT id::text FROM public.companies WHERE tenant_id = public.get_auth_tenant_id()));
CREATE POLICY "company_docs_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'company_docs' AND storage.foldername(name)[1] IN (SELECT id::text FROM public.companies WHERE tenant_id = public.get_auth_tenant_id()));
CREATE POLICY "company_docs_delete" ON storage.objects FOR DELETE USING (bucket_id = 'company_docs' AND storage.foldername(name)[1] IN (SELECT id::text FROM public.companies WHERE tenant_id = public.get_auth_tenant_id()));
