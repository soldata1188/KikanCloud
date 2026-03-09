-- Function to wrap the task generation for triggers
CREATE OR REPLACE FUNCTION public.handle_automation_trigger() 
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.generate_automatic_tasks();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for Visas
DROP TRIGGER IF EXISTS on_visa_change_automation ON public.visas;
CREATE TRIGGER on_visa_change_automation
AFTER INSERT OR UPDATE OF expiration_date, process_status ON public.visas
FOR EACH STATEMENT
EXECUTE FUNCTION public.handle_automation_trigger();

-- Trigger for Exams
DROP TRIGGER IF EXISTS on_exam_change_automation ON public.exams;
CREATE TRIGGER on_exam_change_automation
AFTER INSERT OR UPDATE OF deadline_date, result ON public.exams
FOR EACH STATEMENT
EXECUTE FUNCTION public.handle_automation_trigger();

-- Trigger for Audits (Kansa)
DROP TRIGGER IF EXISTS on_audit_change_automation ON public.audits;
CREATE TRIGGER on_audit_change_automation
AFTER INSERT OR UPDATE OF actual_date, status ON public.audits
FOR EACH STATEMENT
EXECUTE FUNCTION public.handle_automation_trigger();
