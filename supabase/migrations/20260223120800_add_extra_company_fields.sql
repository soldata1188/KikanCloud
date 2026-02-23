ALTER TABLE public.companies
ADD COLUMN name_kana varchar,
ADD COLUMN employee_count integer,
ADD COLUMN labor_insurance_number varchar,
ADD COLUMN employment_insurance_number varchar,
ADD COLUMN acceptance_notification_number varchar,
ADD COLUMN acceptance_notification_date date,
ADD COLUMN general_supervision_fee numeric,
ADD COLUMN category_3_supervision_fee numeric,
ADD COLUMN support_fee numeric;
