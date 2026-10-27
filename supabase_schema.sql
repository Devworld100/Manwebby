-- =============================================================================
-- MAN COMMERCIAL PROTECTION - SUPABASE DATABASE INITIALIZATION SCHEMA
-- Run this script in the Supabase Dashboard -> SQL Editor -> New query -> Run
-- (Clean Production Schema - No Demo Data or Hardcoded Credentials)
-- =============================================================================

-- 1. Create USERS Table
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create PROFILES Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    auth_user_id TEXT,
    username TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    owner_name TEXT NOT NULL,
    beneficiary_name TEXT NOT NULL,
    deposit_amount NUMERIC NOT NULL DEFAULT 0,
    deposit_item TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    profile_image_url TEXT,
    signature TEXT,
    context_details TEXT,
    security_code TEXT,
    transaction_code TEXT,
    deposit_code TEXT,
    cert_code TEXT,
    serial_no TEXT,
    date_of_deposit TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create REASSIGNMENTS Table
CREATE TABLE IF NOT EXISTS public.reassignments (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    prev_owner TEXT NOT NULL,
    new_owner TEXT NOT NULL,
    prev_beneficiary TEXT NOT NULL,
    new_beneficiary TEXT NOT NULL,
    note TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create COLLECTION_NOTICES Table
CREATE TABLE IF NOT EXISTS public.collection_notices (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    collection_date TEXT NOT NULL,
    courier_name TEXT NOT NULL,
    id_document TEXT,
    contact_phone TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS) and grant API access
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reassignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_notices ENABLE ROW LEVEL SECURITY;

-- API access policies
DROP POLICY IF EXISTS "Public access users" ON public.users;
CREATE POLICY "Public access users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access profiles" ON public.profiles;
CREATE POLICY "Public access profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access reassignments" ON public.reassignments;
CREATE POLICY "Public access reassignments" ON public.reassignments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access notices" ON public.collection_notices;
CREATE POLICY "Public access notices" ON public.collection_notices FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- OPTIONAL: CREATE YOUR INITIAL ADMIN ACCOUNT
-- To create an admin account, uncomment the query below and replace the placeholder
-- values with your own username, email, and secure password:
--
-- INSERT INTO public.users (id, username, email, password, role, created_at)
-- VALUES (
--     'admin-001',
--     'your_admin_username',
--     'admin@yourdomain.com',
--     'YourStrongPasswordHere!',
--     'admin',
--     NOW()
-- );
-- =============================================================================
