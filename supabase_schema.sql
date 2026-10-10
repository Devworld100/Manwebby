-- =============================================================================
-- MAN COMMERCIAL PROTECTION - SUPABASE DATABASE INITIALIZATION SCHEMA
-- Run this script in the Supabase Dashboard -> SQL Editor -> New query -> Run
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

-- Enable Row Level Security (RLS) but allow service_role and public access for API server
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reassignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_notices ENABLE ROW LEVEL SECURITY;

-- Create open policies for REST API (or authenticated service role)
DROP POLICY IF EXISTS "Public access users" ON public.users;
CREATE POLICY "Public access users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access profiles" ON public.profiles;
CREATE POLICY "Public access profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access reassignments" ON public.reassignments;
CREATE POLICY "Public access reassignments" ON public.reassignments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access notices" ON public.collection_notices;
CREATE POLICY "Public access notices" ON public.collection_notices FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- SEED INITIAL DATA
-- =============================================================================

-- Seed Admin User
INSERT INTO public.users (id, username, email, password, role, created_at)
VALUES (
    'admin-001',
    'admin',
    'admin@mancommercial.co.uk',
    'AdminPass2024!',
    'admin',
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    password = EXCLUDED.password,
    role = EXCLUDED.role;

-- Seed Client Users & Profiles
-- 1. Anita Johnson
INSERT INTO public.users (id, username, email, password, role, created_at)
VALUES (
    'user_anita_johnson',
    'anita.johnson',
    'anita.johnson@vault-trustee.co.uk',
    'Password123!',
    'user',
    '2019-05-02T10:00:00Z'
)
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    password = EXCLUDED.password;

INSERT INTO public.profiles (
    id, auth_user_id, username, email, password, role,
    owner_name, beneficiary_name, deposit_amount, deposit_item, currency,
    profile_image_url, context_details, security_code, transaction_code,
    deposit_code, cert_code, serial_no, date_of_deposit, status, created_at, updated_at
) VALUES (
    'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
    'user_anita_johnson',
    'anita.johnson',
    'anita.johnson@vault-trustee.co.uk',
    'Password123!',
    'user',
    'Engineer Steven Johnson',
    'Anita Johnson',
    24500000,
    'GOLD (490Kilos)',
    'USD',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=180&auto=format&fit=crop&q=80',
    'Certificate of Deposit Code: 316SJ17 | Security Code: 0147 | Transaction Code: 529138 | Deposit Code: 198308MZL14 | Serial No: 01479040198308. Consignment deposited on 2nd May 2019 under Safe Keeping protocol at Solihull Vault facility. Mandate clause: In the absence of the Depositor only the next of Kin or the Beneficiary (Anita Johnson & to whom it may concern) has the mandate to claim the consignment with at least two (2) days notification prior to collection. Demurrage rate: US $10.00 / day. Signatories: Iain McCallister (General Manager & CEO) & Engineer Steven Johnson (Depositor).',
    '0147',
    '529138',
    '198308MZL14',
    '316SJ17',
    '01479040198308',
    '2019-05-02',
    'Active',
    '2019-05-02T10:00:00Z',
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    owner_name = EXCLUDED.owner_name,
    beneficiary_name = EXCLUDED.beneficiary_name,
    deposit_amount = EXCLUDED.deposit_amount,
    deposit_item = EXCLUDED.deposit_item;

-- 2. Marcus Vance
INSERT INTO public.users (id, username, email, password, role, created_at)
VALUES (
    'user_marcus_vance',
    'marcus.vance',
    'marcus.vance@vance-holdings.co.uk',
    'Password123!',
    'user',
    '2021-09-14T11:30:00Z'
)
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    password = EXCLUDED.password;

INSERT INTO public.profiles (
    id, auth_user_id, username, email, password, role,
    owner_name, beneficiary_name, deposit_amount, deposit_item, currency,
    profile_image_url, context_details, security_code, transaction_code,
    deposit_code, cert_code, serial_no, date_of_deposit, status, created_at, updated_at
) VALUES (
    'a23c4e10-8fa1-11ec-b909-0242ac120002',
    'user_marcus_vance',
    'marcus.vance',
    'marcus.vance@vance-holdings.co.uk',
    'Password123!',
    'user',
    'Lord Arthur Vance (Deceased)',
    'Marcus Vance',
    4200000,
    'Sovereign Bonds & Title Deeds',
    'GBP',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=180&auto=format&fit=crop&q=80',
    'Certificate of Deposit Code: 482VA21 | Security Code: 0288 | Deposit Code: 202109VNC02. Consignment contains bearer instruments and certified UK sovereign bonds deposited for custody on 14th Sept 2021. High Court Probate granted naming Marcus Vance as sole designated claimant.',
    '0288',
    '614920',
    '202109VNC02',
    '482VA21',
    '02881940192881',
    '2021-09-14',
    'Active',
    '2021-09-14T11:30:00Z',
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    owner_name = EXCLUDED.owner_name,
    beneficiary_name = EXCLUDED.beneficiary_name;

-- 3. Sophia Chen
INSERT INTO public.users (id, username, email, password, role, created_at)
VALUES (
    'user_sophia_chen',
    'sophia.chen',
    'dr.sophia.chen@oxford-research.ac.uk',
    'Password123!',
    'user',
    '2022-11-20T09:00:00Z'
)
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    password = EXCLUDED.password;

INSERT INTO public.profiles (
    id, auth_user_id, username, email, password, role,
    owner_name, beneficiary_name, deposit_amount, deposit_item, currency,
    profile_image_url, context_details, security_code, transaction_code,
    deposit_code, cert_code, serial_no, date_of_deposit, status, created_at, updated_at
) VALUES (
    'b56d8f22-9bc2-11ec-b909-0242ac120003',
    'user_sophia_chen',
    'sophia.chen',
    'dr.sophia.chen@oxford-research.ac.uk',
    'Password123!',
    'user',
    'Chen Wei-Ming (Estate)',
    'Dr. Sophia Chen',
    8750000,
    'Rough & Cut Diamonds (1,250 Carats)',
    'USD',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=180&auto=format&fit=crop&q=80',
    'Certificate of Deposit Code: 591CH22 | Security Code: 0359 | Deposit Code: 202211CHN03. GIA certified gemstone parcel locked in Solihull High-Security Safe 4B. Beneficiary mandate verified under international probate convention.',
    '0359',
    '782341',
    '202211CHN03',
    '591CH22',
    '03590123849102',
    '2022-11-20',
    'Active',
    '2022-11-20T09:00:00Z',
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    owner_name = EXCLUDED.owner_name,
    beneficiary_name = EXCLUDED.beneficiary_name;

-- 4. Harrington Estate
INSERT INTO public.users (id, username, email, password, role, created_at)
VALUES (
    'user_estate_harrington',
    'estate.harrington',
    'trustee@harrington-chancery.co.uk',
    'Password123!',
    'user',
    '2023-04-10T14:45:00Z'
)
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    password = EXCLUDED.password;

INSERT INTO public.profiles (
    id, auth_user_id, username, email, password, role,
    owner_name, beneficiary_name, deposit_amount, deposit_item, currency,
    profile_image_url, context_details, security_code, transaction_code,
    deposit_code, cert_code, serial_no, date_of_deposit, status, created_at, updated_at
) VALUES (
    'c89e1a34-0cd3-11ed-b909-0242ac120004',
    'user_estate_harrington',
    'estate.harrington',
    'trustee@harrington-chancery.co.uk',
    'Password123!',
    'user',
    'Capt. David Harrington (Deceased)',
    'Estate Trustee (Pending Heir Kinship)',
    3100000,
    'Rare Numismatic Coins & Charter Deeds',
    'GBP',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=180&auto=format&fit=crop&q=80',
    'Certificate of Deposit Code: 604HR23 | Security Code: 0412 | Deposit Code: 202304HRG04. Account created with preliminary estate representation. Ready for dynamic administrator reassignment once direct heir kinship is confirmed by High Court Probate.',
    '0412',
    '839210',
    '202304HRG04',
    '604HR23',
    '04120849204910',
    '2023-04-10',
    'Pending',
    '2023-04-10T14:45:00Z',
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    owner_name = EXCLUDED.owner_name,
    beneficiary_name = EXCLUDED.beneficiary_name;
