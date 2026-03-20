-- Add name column to calls; make contact/company/goal nullable for initial create
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.calls ALTER COLUMN contact_name DROP NOT NULL;
ALTER TABLE public.calls ALTER COLUMN company_name DROP NOT NULL;
ALTER TABLE public.calls ALTER COLUMN goal DROP NOT NULL;
-- Backfill: set name from contact+company for existing rows
UPDATE public.calls SET name = COALESCE(contact_name || ' @ ' || company_name, 'Untitled') WHERE name IS NULL;
