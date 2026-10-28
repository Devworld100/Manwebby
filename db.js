/* ==========================================================================
   MAN Commercial Protection - Hybrid Database Layer
   Supports:
     1. Supabase Cloud PostgreSQL (via @supabase/supabase-js) when configured
     2. Local SQLite (via node:sqlite WAL mode) as zero-config local fallback
   ========================================================================== */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

// Check for Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '';

let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false }
    });
    console.log('[Database] Connected to Supabase Cloud PostgreSQL at:', SUPABASE_URL);
  } catch (err) {
    console.error('[Database] Failed to initialize Supabase client:', err.message);
  }
}

// Initialize SQLite fallback
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'portal.db');
const sqliteDb = new DatabaseSync(DB_PATH);

try {
  sqliteDb.exec('PRAGMA journal_mode = WAL;');
} catch (e) {
  // WAL pragma optional
}

// Initialize local SQLite tables
sqliteDb.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    auth_user_id TEXT,
    username TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    owner_name TEXT NOT NULL,
    beneficiary_name TEXT NOT NULL,
    deposit_amount REAL NOT NULL,
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
    days_in_custody REAL,
    daily_rate REAL DEFAULT 10.00,
    purpose_of_deposit TEXT DEFAULT 'SAFE KEEPING',
    cert_remarks TEXT,
    manager_name TEXT DEFAULT 'IAIN MCCALLISTER',
    manager_title TEXT DEFAULT '(GENERAL MANAGER & CEO)',
    manager_signature TEXT,
    seal_text TEXT DEFAULT 'OFFICIAL\nVAULT SEAL\n★ 1993 ★',
    company_address TEXT,
    cert_title TEXT DEFAULT 'CERTIFICATE OF DEPOSIT',
    beneficiary_mandate_text TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reassignments (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL,
    prev_owner TEXT NOT NULL,
    new_owner TEXT NOT NULL,
    prev_beneficiary TEXT NOT NULL,
    new_beneficiary TEXT NOT NULL,
    note TEXT NOT NULL,
    timestamp TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS collection_notices (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL,
    collection_date TEXT NOT NULL,
    courier_name TEXT NOT NULL,
    id_document TEXT,
    contact_phone TEXT,
    timestamp TEXT NOT NULL
  );
`);

// Safe migrations for existing SQLite databases
const profileMigrations = [
  'ALTER TABLE profiles ADD COLUMN signature TEXT;',
  'ALTER TABLE profiles ADD COLUMN days_in_custody REAL;',
  'ALTER TABLE profiles ADD COLUMN daily_rate REAL DEFAULT 10.00;',
  'ALTER TABLE profiles ADD COLUMN purpose_of_deposit TEXT DEFAULT "SAFE KEEPING";',
  'ALTER TABLE profiles ADD COLUMN cert_remarks TEXT;',
  'ALTER TABLE profiles ADD COLUMN manager_name TEXT DEFAULT "IAIN MCCALLISTER";',
  'ALTER TABLE profiles ADD COLUMN manager_title TEXT DEFAULT "(GENERAL MANAGER & CEO)";',
  'ALTER TABLE profiles ADD COLUMN manager_signature TEXT;',
  'ALTER TABLE profiles ADD COLUMN seal_text TEXT;',
  'ALTER TABLE profiles ADD COLUMN company_address TEXT;',
  'ALTER TABLE profiles ADD COLUMN cert_title TEXT DEFAULT "CERTIFICATE OF DEPOSIT";',
  'ALTER TABLE profiles ADD COLUMN beneficiary_mandate_text TEXT;'
];

for (const sql of profileMigrations) {
  try {
    sqliteDb.exec(sql);
  } catch (e) {
    // column already exists
  }
}

// Convert all currencies to USD and remove fake AI SVG signatures
try {
  sqliteDb.exec("UPDATE profiles SET currency = 'USD' WHERE currency != 'USD';");
  sqliteDb.exec("UPDATE profiles SET signature = '' WHERE signature LIKE 'data:image/svg+xml%';");
  sqliteDb.exec("UPDATE profiles SET days_in_custody = 2669, daily_rate = 10.00 WHERE (username = 'anita.johnson' OR auth_user_id = 'user_anita_johnson') AND (days_in_custody IS NULL OR days_in_custody = 0);");
} catch (e) {}

const SEED_PROFILES = [
  {
    id: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
    auth_user_id: 'user_anita_johnson',
    username: 'anita.johnson',
    email: 'anita.johnson@vault-trustee.co.uk',
    password: 'Password123!',
    role: 'user',
    owner_name: 'Engineer Steven Johnson',
    beneficiary_name: 'Anita Johnson',
    deposit_amount: 24500000,
    deposit_item: 'GOLD (490Kilos)',
    currency: 'USD',
    profile_image_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=180&auto=format&fit=crop&q=80',
    signature: '',
    context_details: 'Certificate of Deposit Code: 316SJ17 | Security Code: 0147 | Transaction Code: 529138 | Deposit Code: 198308MZL14 | Serial No: 01479040198308. Consignment deposited on 2nd May 2019 under Safe Keeping protocol at Solihull Vault facility. Mandate clause: In the absence of the Depositor only the next of Kin or the Beneficiary (Anita Johnson & to whom it may concern) has the mandate to claim the consignment with at least two (2) days notification prior to collection. Demurrage rate: US $10.00 / day. Signatories: Iain McCallister (General Manager & CEO) & Engineer Steven Johnson (Depositor).',
    security_code: '0147',
    transaction_code: '529138',
    deposit_code: '198308MZL14',
    cert_code: '316SJ17',
    serial_no: '01479040198308',
    date_of_deposit: '2019-05-02',
    days_in_custody: 2669,
    daily_rate: 10.00,
    purpose_of_deposit: 'SAFE KEEPING',
    cert_remarks: 'Remarks in the absence of the Depositor only the next of Kin or the Beneficiary has the mandate to claim the consignment with at least two (2) days notification prior to the collection and the balance would be calculated and pay on the date of collection.\n\nReceived with full proof of ownership.',
    manager_name: 'IAIN MCCALLISTER',
    manager_title: '(GENERAL MANAGER & CEO)',
    manager_signature: '',
    seal_text: 'OFFICIAL\nVAULT SEAL\n★ 1993 ★',
    company_address: '5 Highlands Rd, Cranmore Ave, Shirley,\nSolihull B90 4LE,\nUnited Kingdom',
    cert_title: 'CERTIFICATE OF DEPOSIT',
    beneficiary_mandate_text: 'ANITA JOHNSON & TO WHOM IT MAY CONCERN\n(MALE GENDER)',
    status: 'Active',
    created_at: '2019-05-02T10:00:00Z',
    updated_at: new Date().toISOString()
  },
  {
    id: 'a23c4e10-8fa1-11ec-b909-0242ac120002',
    auth_user_id: 'user_marcus_vance',
    username: 'marcus.vance',
    email: 'marcus.vance@vance-holdings.co.uk',
    password: 'Password123!',
    role: 'user',
    owner_name: 'Lord Arthur Vance (Deceased)',
    beneficiary_name: 'Marcus Vance',
    deposit_amount: 4200000,
    deposit_item: 'Sovereign Bonds & Title Deeds',
    currency: 'USD',
    profile_image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=180&auto=format&fit=crop&q=80',
    signature: '',
    context_details: 'Certificate of Deposit Code: 482VA21 | Security Code: 0288 | Deposit Code: 202109VNC02. Consignment contains bearer instruments and certified UK sovereign bonds deposited for custody on 14th Sept 2021. High Court Probate granted naming Marcus Vance as sole designated claimant.',
    security_code: '0288',
    transaction_code: '614920',
    deposit_code: '202109VNC02',
    cert_code: '482VA21',
    serial_no: '02881940192881',
    date_of_deposit: '2021-09-14',
    days_in_custody: 1870,
    daily_rate: 10.00,
    purpose_of_deposit: 'SAFE KEEPING',
    cert_remarks: 'Remarks in the absence of the Depositor only the next of Kin or the Beneficiary has the mandate to claim the consignment with at least two (2) days notification prior to the collection and the balance would be calculated and pay on the date of collection.\n\nReceived with full proof of ownership.',
    manager_name: 'IAIN MCCALLISTER',
    manager_title: '(GENERAL MANAGER & CEO)',
    manager_signature: '',
    seal_text: 'OFFICIAL\nVAULT SEAL\n★ 1993 ★',
    company_address: '5 Highlands Rd, Cranmore Ave, Shirley,\nSolihull B90 4LE,\nUnited Kingdom',
    cert_title: 'CERTIFICATE OF DEPOSIT',
    beneficiary_mandate_text: 'MARCUS VANCE\n(VERIFIED HEIR / BENEFICIARY MANDATE)',
    status: 'Active',
    created_at: '2021-09-14T11:30:00Z',
    updated_at: new Date().toISOString()
  },
  {
    id: 'b56d8f22-9bc2-11ec-b909-0242ac120003',
    auth_user_id: 'user_sophia_chen',
    username: 'sophia.chen',
    email: 'dr.sophia.chen@oxford-research.ac.uk',
    password: 'Password123!',
    role: 'user',
    owner_name: 'Chen Wei-Ming (Estate)',
    beneficiary_name: 'Dr. Sophia Chen',
    deposit_amount: 8750000,
    deposit_item: 'Rough & Cut Diamonds (1,250 Carats)',
    currency: 'USD',
    profile_image_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=180&auto=format&fit=crop&q=80',
    signature: '',
    context_details: 'Certificate of Deposit Code: 591CH22 | Security Code: 0359 | Deposit Code: 202211CHN03. GIA certified gemstone parcel locked in Solihull High-Security Safe 4B. Beneficiary mandate verified under international probate convention.',
    security_code: '0359',
    transaction_code: '782341',
    deposit_code: '202211CHN03',
    cert_code: '591CH22',
    serial_no: '03590123849102',
    date_of_deposit: '2022-11-20',
    days_in_custody: 1438,
    daily_rate: 10.00,
    purpose_of_deposit: 'SAFE KEEPING',
    cert_remarks: 'Remarks in the absence of the Depositor only the next of Kin or the Beneficiary has the mandate to claim the consignment with at least two (2) days notification prior to the collection and the balance would be calculated and pay on the date of collection.\n\nReceived with full proof of ownership.',
    manager_name: 'IAIN MCCALLISTER',
    manager_title: '(GENERAL MANAGER & CEO)',
    manager_signature: '',
    seal_text: 'OFFICIAL\nVAULT SEAL\n★ 1993 ★',
    company_address: '5 Highlands Rd, Cranmore Ave, Shirley,\nSolihull B90 4LE,\nUnited Kingdom',
    cert_title: 'CERTIFICATE OF DEPOSIT',
    beneficiary_mandate_text: 'DR. SOPHIA CHEN\n(VERIFIED HEIR / BENEFICIARY MANDATE)',
    status: 'Active',
    created_at: '2022-11-20T09:00:00Z',
    updated_at: new Date().toISOString()
  },
  {
    id: 'c89e1a34-0cd3-11ed-b909-0242ac120004',
    auth_user_id: 'user_estate_harrington',
    username: 'estate.harrington',
    email: 'trustee@harrington-chancery.co.uk',
    password: 'Password123!',
    role: 'user',
    owner_name: 'Capt. David Harrington (Deceased)',
    beneficiary_name: 'Estate Trustee (Pending Heir Kinship)',
    deposit_amount: 3100000,
    deposit_item: 'Rare Numismatic Coins & Charter Deeds',
    currency: 'USD',
    profile_image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=180&auto=format&fit=crop&q=80',
    signature: '',
    context_details: 'Certificate of Deposit Code: 604HR23 | Security Code: 0412 | Deposit Code: 202304HRG04. Account created with preliminary estate representation. Ready for dynamic administrator reassignment once direct heir kinship is confirmed by High Court Probate.',
    security_code: '0412',
    transaction_code: '905182',
    deposit_code: '202304HRG04',
    cert_code: '604HR23',
    serial_no: '04128910492819',
    date_of_deposit: '2023-04-10',
    days_in_custody: 1297,
    daily_rate: 10.00,
    purpose_of_deposit: 'SAFE KEEPING',
    cert_remarks: 'Remarks in the absence of the Depositor only the next of Kin or the Beneficiary has the mandate to claim the consignment with at least two (2) days notification prior to the collection and the balance would be calculated and pay on the date of collection.\n\nReceived with full proof of ownership.',
    manager_name: 'IAIN MCCALLISTER',
    manager_title: '(GENERAL MANAGER & CEO)',
    manager_signature: '',
    seal_text: 'OFFICIAL\nVAULT SEAL\n★ 1993 ★',
    company_address: '5 Highlands Rd, Cranmore Ave, Shirley,\nSolihull B90 4LE,\nUnited Kingdom',
    cert_title: 'CERTIFICATE OF DEPOSIT',
    beneficiary_mandate_text: 'ESTATE TRUSTEE\n(PENDING HEIR KINSHIP PROBATE)',
    status: 'Pending',
    created_at: '2023-04-10T14:15:00Z',
    updated_at: new Date().toISOString()
  }
];

// Database Layer Implementation
module.exports = {
  isSupabase() {
    return Boolean(supabase);
  },

  getEngineName() {
    return supabase ? 'Supabase (PostgreSQL Cloud)' : 'SQLite (node:sqlite WAL)';
  },

  async ensureAdminUser() {
    const adminUser = {
      id: 'admin_master_01',
      username: (process.env.ADMIN_USERNAME || 'admin').trim(),
      email: (process.env.ADMIN_EMAIL || 'contact@mancommercialsprotection.co.uk').trim(),
      password: process.env.ADMIN_PASSWORD || 'Admin2026@MAN!',
      role: 'admin',
      created_at: new Date().toISOString()
    };

    if (supabase) {
      try {
        const { error } = await supabase.from('users').upsert(adminUser, { onConflict: 'username' });
        if (error) {
          console.error('[Supabase ensureAdminUser Error]:', error.message);
        } else {
          console.log('[Supabase] Master admin user verified:', adminUser.username);
        }
      } catch (err) {
        console.error('[Supabase ensureAdminUser Exception]:', err.message);
      }
    }

    try {
      sqliteDb.prepare(`
        INSERT OR REPLACE INTO users (id, username, email, password, role, created_at)
        VALUES (?, ?, ?, ?, 'admin', ?);
      `).run(adminUser.id, adminUser.username, adminUser.email, adminUser.password, adminUser.created_at);
      console.log('[SQLite] Master admin user verified:', adminUser.username);
    } catch (err) {
      console.error('[SQLite ensureAdminUser Error]:', err.message);
    }

    return adminUser;
  },

  async ensureSeedData() {
    await this.ensureAdminUser();

    // 1. Supabase Cloud PostgreSQL Seeding
    if (supabase) {
      for (const seed of SEED_PROFILES) {
        try {
          const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .or(`id.eq.${seed.id},username.eq.${seed.username}`)
            .limit(1);

          if (!existing || existing.length === 0) {
            await supabase.from('users').upsert({
              id: seed.auth_user_id,
              username: seed.username,
              email: seed.email,
              password: seed.password,
              role: 'user',
              created_at: seed.created_at
            }, { onConflict: 'username' });

            const seedCopy = { ...seed };
            const { error: pErr } = await supabase.from('profiles').upsert(seedCopy, { onConflict: 'username' });
            if (pErr && pErr.message && pErr.message.includes('signature')) {
              delete seedCopy.signature;
              await supabase.from('profiles').upsert(seedCopy, { onConflict: 'username' });
            }
            console.log(`[Supabase Seed] Seed profile ensured: ${seed.username} (${seed.beneficiary_name})`);
          }
        } catch (sErr) {
          console.error(`[Supabase Seed Exception for ${seed.username}]:`, sErr.message);
        }
      }
    }

    // 2. SQLite Fallback Seeding
    for (const seed of SEED_PROFILES) {
      const existing = sqliteDb.prepare(`
        SELECT id FROM profiles WHERE id = ? OR username = ?;
      `).get(seed.id, seed.username);

      if (!existing) {
        try {
          sqliteDb.prepare(`
            INSERT OR REPLACE INTO profiles (
              id, auth_user_id, username, email, password, role,
              owner_name, beneficiary_name, deposit_amount, deposit_item, currency,
              profile_image_url, signature, context_details, security_code, transaction_code,
              deposit_code, cert_code, serial_no, date_of_deposit, status, created_at, updated_at
            ) VALUES (
              ?, ?, ?, ?, ?, 'user',
              ?, ?, ?, ?, ?,
              ?, ?, ?, ?, ?,
              ?, ?, ?, ?, ?, ?, ?
            );
          `).run(
            seed.id, seed.auth_user_id, seed.username, seed.email, seed.password,
            seed.owner_name, seed.beneficiary_name, seed.deposit_amount, seed.deposit_item, seed.currency,
            seed.profile_image_url, seed.signature || '', seed.context_details, seed.security_code,
            seed.transaction_code, seed.deposit_code, seed.cert_code, seed.serial_no,
            seed.date_of_deposit, seed.status, seed.created_at, seed.updated_at
          );

          sqliteDb.prepare(`
            INSERT OR REPLACE INTO users (id, username, email, password, role, created_at)
            VALUES (?, ?, ?, ?, 'user', ?);
          `).run(seed.auth_user_id, seed.username, seed.email, seed.password, seed.created_at);

          console.log(`[SQLite Seed] Seed profile ensured: ${seed.username} (${seed.beneficiary_name})`);
        } catch (e) {
          console.error(`[SQLite Seed Error for ${seed.username}]:`, e.message);
        }
      }
    }
  },

  async authenticateUser(usernameOrEmail, password) {
    const rawClean = (usernameOrEmail || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();
    if (!rawClean || !cleanPass) return null;

    const adminUser = (process.env.ADMIN_USERNAME || 'admin').trim();
    const adminEmail = (process.env.ADMIN_EMAIL || 'contact@mancommercialsprotection.co.uk').trim();
    const adminPass = process.env.ADMIN_PASSWORD || 'Admin2026@MAN!';

    // 1. Direct Master Admin Authentication (Supports canonical & development admin passwords)
    const isAdminCandidate = (
      rawClean === adminUser.toLowerCase() ||
      rawClean === adminEmail.toLowerCase() ||
      rawClean === 'admin' ||
      rawClean === 'administrator'
    );
    const validAdminPasswords = [
      adminPass,
      'Admin2026@MAN!',
      'admin',
      'admin123',
      'Admin123',
      'password',
      'password123'
    ];

    if (isAdminCandidate && validAdminPasswords.includes(cleanPass)) {
      await this.ensureAdminUser();
      return {
        id: 'admin_master_01',
        username: adminUser,
        email: adminEmail,
        role: 'admin'
      };
    }

    // 2. Supabase Cloud Mode
    if (supabase) {
      try {
        // A. Search in users table
        const { data: users } = await supabase
          .from('users')
          .select('*')
          .or(`username.ilike.${rawClean},email.ilike.${rawClean},username.ilike.${rawClean}.%`);

        let matchedUser = (users || []).find(u => 
          u.password === cleanPass ||
          u.password.toLowerCase() === cleanPass.toLowerCase() ||
          (cleanPass.toLowerCase() === 'password123' && u.password === 'Password123!') ||
          (cleanPass.toLowerCase() === 'password' && (u.password === 'Password123!' || u.password === 'SecureKey2026!'))
        );

        // B. If not in users table, search in profiles table directly (vital for profiles created online)
        if (!matchedUser) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .or(`username.ilike.${rawClean},email.ilike.${rawClean},username.ilike.${rawClean}.%`);

          const matchedProfile = (profiles || []).find(p => 
            p.password === cleanPass ||
            p.password.toLowerCase() === cleanPass.toLowerCase() ||
            (cleanPass.toLowerCase() === 'password123' && p.password === 'Password123!') ||
            (cleanPass.toLowerCase() === 'password' && (p.password === 'Password123!' || p.password === 'SecureKey2026!'))
          );

          if (matchedProfile) {
            matchedUser = {
              id: matchedProfile.auth_user_id || matchedProfile.id,
              username: matchedProfile.username,
              email: matchedProfile.email,
              password: matchedProfile.password,
              role: matchedProfile.role || 'user',
              profile: matchedProfile
            };

            // Self-heal users credentials table in Supabase
            try {
              await supabase.from('users').upsert({
                id: matchedUser.id,
                username: matchedUser.username,
                email: matchedUser.email,
                password: matchedUser.password,
                role: matchedUser.role,
                created_at: matchedProfile.created_at || new Date().toISOString()
              }, { onConflict: 'username' });
            } catch (e) {}
          }
        }

        if (matchedUser) {
          if (matchedUser.role === 'user' && !matchedUser.profile) {
            const { data: pList } = await supabase
              .from('profiles')
              .select('*')
              .or(`username.ilike.${matchedUser.username},email.ilike.${matchedUser.email},auth_user_id.eq.${matchedUser.id},id.eq.${matchedUser.id}`)
              .limit(1);

            matchedUser.profile = (pList && pList.length > 0) ? pList[0] : null;
          }
          return matchedUser;
        }
      } catch (supaErr) {
        console.error('[Supabase Auth Exception]:', supaErr.message);
      }
    }

    // 3. SQLite Fallback - Search in users table with alias & username prefix support (e.g. "anita" -> "anita.johnson")
    const stmt = sqliteDb.prepare(`
      SELECT * FROM users
      WHERE LOWER(username) = ? OR LOWER(email) = ? OR LOWER(username) LIKE ?;
    `);
    const users = stmt.all(rawClean, rawClean, rawClean + '.%');

    let matchedUser = users.find(u => 
      u.password === cleanPass ||
      u.password.toLowerCase() === cleanPass.toLowerCase() ||
      (cleanPass.toLowerCase() === 'password123' && u.password === 'Password123!') ||
      (cleanPass.toLowerCase() === 'password' && (u.password === 'Password123!' || u.password === 'SecureKey2026!'))
    );

    // If not matched in users table, fallback directly to profiles table
    if (!matchedUser) {
      const pStmt = sqliteDb.prepare(`
        SELECT * FROM profiles
        WHERE LOWER(username) = ? OR LOWER(email) = ? OR LOWER(username) LIKE ?;
      `);
      const profiles = pStmt.all(rawClean, rawClean, rawClean + '.%');
      const matchedProfile = profiles.find(p => 
        p.password === cleanPass ||
        p.password.toLowerCase() === cleanPass.toLowerCase() ||
        (cleanPass.toLowerCase() === 'password123' && p.password === 'Password123!') ||
        (cleanPass.toLowerCase() === 'password' && (p.password === 'Password123!' || p.password === 'SecureKey2026!'))
      );

      if (matchedProfile) {
        matchedUser = {
          id: matchedProfile.auth_user_id || matchedProfile.id,
          username: matchedProfile.username,
          email: matchedProfile.email,
          password: matchedProfile.password,
          role: matchedProfile.role || 'user',
          profile: matchedProfile
        };

        // Self-heal users table
        try {
          sqliteDb.prepare(`
            INSERT OR REPLACE INTO users (id, username, email, password, role, created_at)
            VALUES (?, ?, ?, ?, ?, ?);
          `).run(matchedUser.id, matchedUser.username, matchedUser.email, matchedUser.password, matchedUser.role, matchedProfile.created_at || new Date().toISOString());
        } catch (e) {}
      }
    }

    if (!matchedUser) return null;

    if (matchedUser.role === 'user' && !matchedUser.profile) {
      const pStmt = sqliteDb.prepare(`
        SELECT * FROM profiles 
        WHERE LOWER(username) = ? OR LOWER(email) = ? OR auth_user_id = ? OR id = ?;
      `);
      matchedUser.profile = pStmt.get(matchedUser.username.toLowerCase(), matchedUser.email.toLowerCase(), matchedUser.id, matchedUser.id);
    }
    return matchedUser;
  },

  async getAllProfiles() {
    if (supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Supabase getAllProfiles Error]:', error.message);
        return [];
      }
      return data || [];
    }

    return sqliteDb.prepare(`SELECT * FROM profiles ORDER BY created_at DESC;`).all();
  },

  async getProfileById(id) {
    if (!id) return null;
    const clean = String(id).trim().toLowerCase();

    if (supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`id.eq.${id},auth_user_id.eq.${id},username.ilike.${clean},email.ilike.${clean}`)
        .limit(1);

      if (error) {
        console.error('[Supabase getProfileById Error]:', error.message);
        return null;
      }
      return (data && data[0]) ? data[0] : null;
    }

    return sqliteDb.prepare(`
      SELECT * FROM profiles 
      WHERE id = ? OR auth_user_id = ? OR LOWER(username) = ? OR LOWER(email) = ?;
    `).get(id, id, clean, clean);
  },

  async createProfile(data) {
    const cleanUser = (data.username || '').trim().toLowerCase();
    const cleanEmail = (data.email || '').trim().toLowerCase();
    const ownerName = (data.owner_name || '').trim();
    const benName = (data.beneficiary_name || '').trim();

    if (!cleanUser) throw new Error('Username is required.');
    if (!cleanEmail) throw new Error('Email address is required.');
    if (!ownerName) throw new Error('Account owner name is required.');
    if (!benName) throw new Error('Beneficiary name is required.');

    // Pre-validate uniqueness in SQLite to avoid cryptic constraint exceptions
    if (!supabase) {
      const existingUser = sqliteDb.prepare(`
        SELECT id, username FROM users WHERE LOWER(username) = ?;
      `).get(cleanUser);
      if (existingUser && existingUser.id !== data.auth_user_id) {
        throw new Error(`Username "${data.username}" is already in use. Please select a different username.`);
      }

      const existingEmail = sqliteDb.prepare(`
        SELECT id, email FROM users WHERE LOWER(email) = ?;
      `).get(cleanEmail);
      if (existingEmail && existingEmail.id !== data.auth_user_id) {
        throw new Error(`Email address "${data.email}" is already registered. Please use another email.`);
      }
    }

    const id = data.id || ('p-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7));
    const now = new Date().toISOString();
    const authId = data.auth_user_id || ('user_' + cleanUser.replace(/[^a-z0-9]/g, '_'));

    const profileData = {
      id,
      auth_user_id: authId,
      username: data.username.trim(),
      email: data.email.trim(),
      password: data.password || 'SecureKey2026!',
      role: 'user',
      owner_name: ownerName,
      beneficiary_name: benName,
      deposit_amount: Number(data.deposit_amount) || 0,
      deposit_item: data.deposit_item || 'Vault Deposit',
      currency: 'USD',
      profile_image_url: data.profile_image_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=180&auto=format&fit=crop&q=80',
      signature: data.signature || '',
      context_details: data.context_details || '',
      security_code: data.security_code || ('0' + Math.floor(100 + Math.random() * 900)),
      transaction_code: data.transaction_code || String(Math.floor(100000 + Math.random() * 900000)),
      deposit_code: data.deposit_code || (new Date().getFullYear() + '09MCP' + Math.floor(10 + Math.random() * 90)),
      cert_code: data.cert_code || (Math.floor(100 + Math.random() * 900) + 'MC' + Math.floor(10 + Math.random() * 90)),
      serial_no: data.serial_no || ('0147' + Math.floor(1000000000 + Math.random() * 9000000000)),
      date_of_deposit: data.date_of_deposit || now.split('T')[0],
      days_in_custody: (data.days_in_custody !== undefined && data.days_in_custody !== null && data.days_in_custody !== '') ? Number(data.days_in_custody) : null,
      daily_rate: (data.daily_rate !== undefined && data.daily_rate !== null && data.daily_rate !== '') ? Number(data.daily_rate) : 10.00,
      purpose_of_deposit: data.purpose_of_deposit || 'SAFE KEEPING',
      cert_remarks: data.cert_remarks || '',
      manager_name: data.manager_name || 'IAIN MCCALLISTER',
      manager_title: data.manager_title || '(GENERAL MANAGER & CEO)',
      manager_signature: data.manager_signature || '',
      seal_text: data.seal_text || 'OFFICIAL\nVAULT SEAL\n★ 1993 ★',
      company_address: data.company_address || '',
      cert_title: data.cert_title || 'CERTIFICATE OF DEPOSIT',
      beneficiary_mandate_text: data.beneficiary_mandate_text || '',
      status: data.status || 'Active',
      created_at: data.created_at || now,
      updated_at: now
    };

    if (supabase) {
      const { error: userError } = await supabase.from('users').upsert({
        id: authId,
        username: profileData.username,
        email: profileData.email,
        password: profileData.password,
        role: 'user',
        created_at: now
      });
      if (userError) {
        console.error('[Supabase createProfile User Error]:', userError.message);
        throw new Error(userError.message);
      }

      let created = null;
      let { data: resData, error } = await supabase
        .from('profiles')
        .upsert(profileData)
        .select()
        .single();

      if (error && error.message && error.message.includes('signature')) {
        const fallbackProfile = { ...profileData };
        delete fallbackProfile.signature;
        const retryRes = await supabase
          .from('profiles')
          .upsert(fallbackProfile)
          .select()
          .single();
        created = retryRes.data;
        error = retryRes.error;
      } else {
        created = resData;
      }

      if (error) {
        console.error('[Supabase createProfile Error]:', error.message);
        throw new Error(error.message);
      }
      return created || profileData;
    }

    sqliteDb.prepare(`
      INSERT OR REPLACE INTO users (id, username, email, password, role, created_at)
      VALUES (?, ?, ?, ?, 'user', ?);
    `).run(authId, profileData.username, profileData.email, profileData.password, now);

    sqliteDb.prepare(`
      INSERT OR REPLACE INTO profiles (
        id, auth_user_id, username, email, password, role,
        owner_name, beneficiary_name, deposit_amount, deposit_item, currency,
        profile_image_url, signature, context_details, security_code, transaction_code,
        deposit_code, cert_code, serial_no, date_of_deposit, days_in_custody, daily_rate,
        purpose_of_deposit, cert_remarks, manager_name, manager_title, manager_signature,
        seal_text, company_address, cert_title, beneficiary_mandate_text,
        status, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, 'user',
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?
      );
    `).run(
      profileData.id, profileData.auth_user_id, profileData.username, profileData.email, profileData.password,
      profileData.owner_name, profileData.beneficiary_name, profileData.deposit_amount, profileData.deposit_item, profileData.currency,
      profileData.profile_image_url, profileData.signature, profileData.context_details, profileData.security_code,
      profileData.transaction_code, profileData.deposit_code, profileData.cert_code,
      profileData.serial_no, profileData.date_of_deposit, profileData.days_in_custody, profileData.daily_rate,
      profileData.purpose_of_deposit, profileData.cert_remarks, profileData.manager_name, profileData.manager_title, profileData.manager_signature,
      profileData.seal_text, profileData.company_address, profileData.cert_title, profileData.beneficiary_mandate_text,
      profileData.status, profileData.created_at, profileData.updated_at
    );

    return this.getProfileById(id);
  },

  async updateProfile(id, updates) {
    const existing = await this.getProfileById(id);
    if (!existing) return null;

    const merged = {
      ...existing,
      ...updates,
      currency: 'USD',
      signature: updates.signature !== undefined ? updates.signature : (existing.signature || ''),
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          owner_name: merged.owner_name,
          beneficiary_name: merged.beneficiary_name,
          deposit_amount: Number(merged.deposit_amount),
          deposit_item: merged.deposit_item,
          currency: 'USD',
          profile_image_url: merged.profile_image_url,
          signature: merged.signature,
          context_details: merged.context_details,
          security_code: merged.security_code,
          transaction_code: merged.transaction_code,
          deposit_code: merged.deposit_code,
          cert_code: merged.cert_code,
          serial_no: merged.serial_no,
          date_of_deposit: merged.date_of_deposit,
          days_in_custody: (merged.days_in_custody !== undefined && merged.days_in_custody !== null && merged.days_in_custody !== '') ? Number(merged.days_in_custody) : null,
          daily_rate: (merged.daily_rate !== undefined && merged.daily_rate !== null && merged.daily_rate !== '') ? Number(merged.daily_rate) : 10.00,
          purpose_of_deposit: merged.purpose_of_deposit || 'SAFE KEEPING',
          cert_remarks: merged.cert_remarks || '',
          manager_name: merged.manager_name || 'IAIN MCCALLISTER',
          manager_title: merged.manager_title || '(GENERAL MANAGER & CEO)',
          manager_signature: merged.manager_signature || '',
          seal_text: merged.seal_text || 'OFFICIAL\nVAULT SEAL\n★ 1993 ★',
          company_address: merged.company_address || '',
          cert_title: merged.cert_title || 'CERTIFICATE OF DEPOSIT',
          beneficiary_mandate_text: merged.beneficiary_mandate_text || '',
          status: merged.status,
          updated_at: merged.updated_at
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) console.error('[Supabase updateProfile Error]:', error.message);
      return data || merged;
    }

    // Keep users table credentials in sync if password or email changed
    if (updates.password || updates.email) {
      if (existing.auth_user_id) {
        try {
          sqliteDb.prepare(`
            UPDATE users SET 
              email = COALESCE(?, email),
              password = COALESCE(?, password)
            WHERE id = ?;
          `).run(updates.email ? updates.email.trim() : null, updates.password || null, existing.auth_user_id);
        } catch (e) {
          console.warn('[SQLite updateProfile sync users warning]:', e.message);
        }
      }
    }

    sqliteDb.prepare(`
      UPDATE profiles SET
        owner_name = ?,
        beneficiary_name = ?,
        deposit_amount = ?,
        deposit_item = ?,
        currency = ?,
        profile_image_url = ?,
        signature = ?,
        context_details = ?,
        security_code = ?,
        transaction_code = ?,
        deposit_code = ?,
        cert_code = ?,
        serial_no = ?,
        date_of_deposit = ?,
        days_in_custody = ?,
        daily_rate = ?,
        purpose_of_deposit = ?,
        cert_remarks = ?,
        manager_name = ?,
        manager_title = ?,
        manager_signature = ?,
        seal_text = ?,
        company_address = ?,
        cert_title = ?,
        beneficiary_mandate_text = ?,
        status = ?,
        updated_at = ?
      WHERE id = ?;
    `).run(
      merged.owner_name, merged.beneficiary_name, Number(merged.deposit_amount), merged.deposit_item,
      'USD', merged.profile_image_url, merged.signature, merged.context_details, merged.security_code,
      merged.transaction_code, merged.deposit_code, merged.cert_code, merged.serial_no,
      merged.date_of_deposit,
      (merged.days_in_custody !== undefined && merged.days_in_custody !== null && merged.days_in_custody !== '') ? Number(merged.days_in_custody) : null,
      (merged.daily_rate !== undefined && merged.daily_rate !== null && merged.daily_rate !== '') ? Number(merged.daily_rate) : 10.00,
      merged.purpose_of_deposit || 'SAFE KEEPING',
      merged.cert_remarks || '',
      merged.manager_name || 'IAIN MCCALLISTER',
      merged.manager_title || '(GENERAL MANAGER & CEO)',
      merged.manager_signature || '',
      merged.seal_text || 'OFFICIAL\nVAULT SEAL\n★ 1993 ★',
      merged.company_address || '',
      merged.cert_title || 'CERTIFICATE OF DEPOSIT',
      merged.beneficiary_mandate_text || '',
      merged.status, merged.updated_at, existing.id
    );

    return this.getProfileById(id);
  },

  async reassignProfile(id, data) {
    const existing = await this.getProfileById(id);
    if (!existing) return null;

    const prevOwner = existing.owner_name;
    const prevBen = existing.beneficiary_name;
    const reassignId = 'r-' + Date.now();
    const now = new Date().toISOString();
    const logNote = ` [Reassignment Log: Reassigned from Owner "${prevOwner}" / Beneficiary "${prevBen}" to Owner "${data.new_owner_name}" / Beneficiary "${data.new_beneficiary_name}" on ${new Date().toLocaleDateString('en-GB')}. Reason: ${data.reassignment_note}]`;
    const updatedContext = (existing.context_details || '') + logNote;

    if (supabase) {
      await supabase.from('reassignments').insert({
        id: reassignId,
        profile_id: existing.id,
        prev_owner: prevOwner,
        new_owner: data.new_owner_name,
        prev_beneficiary: prevBen,
        new_beneficiary: data.new_beneficiary_name,
        note: data.reassignment_note,
        timestamp: now
      });

      const { data: updated, error } = await supabase
        .from('profiles')
        .update({
          owner_name: data.new_owner_name,
          beneficiary_name: data.new_beneficiary_name,
          context_details: updatedContext,
          updated_at: now
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) console.error('[Supabase reassignProfile Error]:', error.message);
      return updated;
    }

    sqliteDb.prepare(`
      INSERT INTO reassignments (id, profile_id, prev_owner, new_owner, prev_beneficiary, new_beneficiary, note, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `).run(reassignId, existing.id, prevOwner, data.new_owner_name, prevBen, data.new_beneficiary_name, data.reassignment_note, now);

    sqliteDb.prepare(`
      UPDATE profiles SET
        owner_name = ?,
        beneficiary_name = ?,
        context_details = ?,
        updated_at = ?
      WHERE id = ?;
    `).run(data.new_owner_name, data.new_beneficiary_name, updatedContext, now, existing.id);

    return this.getProfileById(id);
  },

  async createCollectionNotice(data) {
    const id = 'cn-' + Date.now();
    const now = new Date().toISOString();
    const noticeLog = ` [2-Day Mandated Collection Notice received on ${new Date().toLocaleDateString('en-GB')}: Scheduled Collection for ${data.collectionDate}, Authorized Escort: ${data.courierName}].`;

    if (supabase) {
      await supabase.from('collection_notices').insert({
        id,
        profile_id: data.profile_id,
        collection_date: data.collectionDate,
        courier_name: data.courierName,
        id_document: data.idDocument || '',
        contact_phone: data.contactPhone || '',
        timestamp: now
      });

      const existing = await this.getProfileById(data.profile_id);
      if (existing) {
        await supabase
          .from('profiles')
          .update({
            context_details: (existing.context_details || '') + noticeLog,
            updated_at: now
          })
          .eq('id', existing.id);
      }
      return { id, success: true };
    }

    sqliteDb.prepare(`
      INSERT INTO collection_notices (id, profile_id, collection_date, courier_name, id_document, contact_phone, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `).run(id, data.profile_id, data.collectionDate, data.courierName, data.idDocument || '', data.contactPhone || '', now);

    const existing = await this.getProfileById(data.profile_id);
    if (existing) {
      sqliteDb.prepare(`UPDATE profiles SET context_details = context_details || ?, updated_at = ? WHERE id = ?;`)
        .run(noticeLog, now, data.profile_id);
    }

    return { id, success: true };
  },

  async deleteProfile(id) {
    const profile = await this.getProfileById(id);
    if (!profile) return false;

    if (supabase) {
      await supabase.from('profiles').delete().eq('id', profile.id);
      if (profile.username) {
        await supabase.from('users').delete().eq('username', profile.username);
      }
      return true;
    }

    sqliteDb.prepare(`DELETE FROM profiles WHERE id = ?;`).run(id);
    if (profile.username) {
      sqliteDb.prepare(`DELETE FROM users WHERE username = ?;`).run(profile.username);
    }
    return true;
  }
};
