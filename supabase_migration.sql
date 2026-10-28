-- =============================================================================
-- MAN COMMERCIAL PROTECTION - SUPABASE SCHEMA UPDATE / MIGRATION SCRIPT
-- Run this script in: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- This script is completely SAFE to run on existing Supabase databases:
-- uses IF NOT EXISTS so it won't delete or overwrite any existing data.
-- =============================================================================

-- 1. Ensure all standard and tracking columns exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS auth_user_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS beneficiary_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deposit_item TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signature TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS context_details TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS security_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS transaction_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deposit_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cert_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS serial_no TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_deposit TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';

-- 2. Add all custom certificate, deposit days, and demurrage rate columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS days_in_custody NUMERIC;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_rate NUMERIC DEFAULT 10.00;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS purpose_of_deposit TEXT DEFAULT 'SAFE KEEPING';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cert_remarks TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS manager_name TEXT DEFAULT 'IAIN MCCALLISTER';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS manager_title TEXT DEFAULT '(GENERAL MANAGER & CEO)';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS manager_signature TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS seal_text TEXT DEFAULT 'OFFICIAL
VAULT SEAL
★ 1993 ★';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cert_title TEXT DEFAULT 'CERTIFICATE OF DEPOSIT';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS beneficiary_mandate_text TEXT;

-- 3. Standardize all existing currencies to USD ($)
UPDATE public.profiles 
SET currency = 'USD' 
WHERE currency IS NULL OR currency != 'USD';

-- 4. Set default daily rate ($10.00) where empty
UPDATE public.profiles 
SET daily_rate = 10.00 
WHERE daily_rate IS NULL;

-- 5. Clean out any fake AI generated SVG signatures from existing rows
UPDATE public.profiles 
SET signature = '' 
WHERE signature LIKE 'data:image/svg+xml%';

-- 6. Set default custody days for Anita Johnson if empty (2669 days)
UPDATE public.profiles 
SET days_in_custody = 2669 
WHERE username = 'anita.johnson' AND (days_in_custody IS NULL OR days_in_custody = 0);

-- 7. Instantly refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

