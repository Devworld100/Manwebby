/* ==========================================================================
   MAN Commercial Protection - Production Database Layer (SQLite)
   Built with Node.js built-in node:sqlite for zero-dependency online deployment
   ========================================================================== */

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'portal.db');
const db = new DatabaseSync(DB_PATH);

// Enable WAL mode for high concurrency
try {
  db.exec('PRAGMA journal_mode = WAL;');
} catch (e) {
  // WAL pragma optional
}

// Initialize tables
db.exec(`
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
    context_details TEXT,
    security_code TEXT,
    transaction_code TEXT,
    deposit_code TEXT,
    cert_code TEXT,
    serial_no TEXT,
    date_of_deposit TEXT,
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

// Initial production profiles seed
const INITIAL_PROFILES = [
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
    context_details: 'Certificate of Deposit Code: 316SJ17 | Security Code: 0147 | Transaction Code: 529138 | Deposit Code: 198308MZL14 | Serial No: 01479040198308. Consignment deposited on 2nd May 2019 under Safe Keeping protocol at Solihull Vault facility. Mandate clause: In the absence of the Depositor only the next of Kin or the Beneficiary (Anita Johnson & to whom it may concern) has the mandate to claim the consignment with at least two (2) days notification prior to collection. Demurrage rate: US $10.00 / day. Signatories: Iain McCallister (General Manager & CEO) & Engineer Steven Johnson (Depositor).',
    security_code: '0147',
    transaction_code: '529138',
    deposit_code: '198308MZL14',
    cert_code: '316SJ17',
    serial_no: '01479040198308',
    date_of_deposit: '2019-05-02',
    status: 'Active',
    created_at: '2019-05-02T10:00:00Z',
    updated_at: '2024-03-15T12:00:00Z'
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
    currency: 'GBP',
    profile_image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=180&auto=format&fit=crop&q=80',
    context_details: 'Certificate of Deposit Code: 482VA21 | Security Code: 0288 | Deposit Code: 202109VNC02. Consignment contains bearer instruments and certified UK sovereign bonds deposited for custody on 14th Sept 2021. High Court Probate granted naming Marcus Vance as sole designated claimant.',
    security_code: '0288',
    transaction_code: '614920',
    deposit_code: '202109VNC02',
    cert_code: '482VA21',
    serial_no: '02881940192881',
    date_of_deposit: '2021-09-14',
    status: 'Active',
    created_at: '2021-09-14T11:30:00Z',
    updated_at: '2024-02-10T14:20:00Z'
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
    context_details: 'Certificate of Deposit Code: 591CH22 | Security Code: 0359 | Deposit Code: 202211CHN03. GIA certified gemstone parcel locked in Solihull High-Security Safe 4B. Beneficiary mandate verified under international probate convention.',
    security_code: '0359',
    transaction_code: '782341',
    deposit_code: '202211CHN03',
    cert_code: '591CH22',
    serial_no: '03590123849102',
    date_of_deposit: '2022-11-20',
    status: 'Active',
    created_at: '2022-11-20T09:00:00Z',
    updated_at: '2024-04-02T16:10:00Z'
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
    currency: 'GBP',
    profile_image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=180&auto=format&fit=crop&q=80',
    context_details: 'Certificate of Deposit Code: 604HR23 | Security Code: 0412 | Deposit Code: 202304HRG04. Account created with preliminary estate representation. Ready for dynamic administrator reassignment once direct heir kinship is confirmed by High Court Probate.',
    security_code: '0412',
    transaction_code: '839210',
    deposit_code: '202304HRG04',
    cert_code: '604HR23',
    serial_no: '04120849204910',
    date_of_deposit: '2023-04-10',
    status: 'Pending',
    created_at: '2023-04-10T14:45:00Z',
    updated_at: '2024-01-20T10:00:00Z'
  }
];

const INITIAL_ADMIN = {
  id: 'admin-001',
  username: 'admin',
  email: 'admin@mancommercial.co.uk',
  password: 'AdminPass2024!',
  role: 'admin',
  created_at: new Date().toISOString()
};

// Seed database if empty
const countStmt = db.prepare('SELECT COUNT(*) as count FROM profiles;');
const profileCount = countStmt.get().count;

if (profileCount === 0) {
  // Seed admin
  const userInsert = db.prepare(`
    INSERT OR REPLACE INTO users (id, username, email, password, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?);
  `);
  userInsert.run(INITIAL_ADMIN.id, INITIAL_ADMIN.username, INITIAL_ADMIN.email, INITIAL_ADMIN.password, INITIAL_ADMIN.role, INITIAL_ADMIN.created_at);

  // Seed profiles & users
  const profileInsert = db.prepare(`
    INSERT INTO profiles (
      id, auth_user_id, username, email, password, role,
      owner_name, beneficiary_name, deposit_amount, deposit_item, currency,
      profile_image_url, context_details, security_code, transaction_code,
      deposit_code, cert_code, serial_no, date_of_deposit, status, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?
    );
  `);

  for (const p of INITIAL_PROFILES) {
    userInsert.run(p.auth_user_id, p.username, p.email, p.password, p.role, p.created_at);
    profileInsert.run(
      p.id, p.auth_user_id, p.username, p.email, p.password, p.role,
      p.owner_name, p.beneficiary_name, p.deposit_amount, p.deposit_item, p.currency,
      p.profile_image_url, p.context_details, p.security_code, p.transaction_code,
      p.deposit_code, p.cert_code, p.serial_no, p.date_of_deposit, p.status, p.created_at, p.updated_at
    );
  }
}

// Database helper functions
module.exports = {
  db,

  authenticateUser(usernameOrEmail, password) {
    const clean = (usernameOrEmail || '').trim().toLowerCase();
    const stmt = db.prepare(`
      SELECT * FROM users
      WHERE (LOWER(username) = ? OR LOWER(email) = ?) AND password = ?;
    `);
    const user = stmt.get(clean, clean, password);
    if (!user) return null;

    // If user role, attach associated profile case-insensitively
    if (user.role === 'user') {
      const pStmt = db.prepare(`
        SELECT * FROM profiles 
        WHERE LOWER(username) = ? OR LOWER(email) = ? OR auth_user_id = ? OR id = ?;
      `);
      user.profile = pStmt.get(clean, clean, user.id, user.id);
    }
    return user;
  },

  getAllProfiles() {
    return db.prepare(`SELECT * FROM profiles ORDER BY created_at DESC;`).all();
  },

  getProfileById(id) {
    if (!id) return null;
    const clean = String(id).trim().toLowerCase();
    return db.prepare(`
      SELECT * FROM profiles 
      WHERE id = ? OR auth_user_id = ? OR LOWER(username) = ? OR LOWER(email) = ?;
    `).get(id, id, clean, clean);
  },

  createProfile(data) {
    const id = data.id || ('p-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7));
    const now = new Date().toISOString();
    const cleanUser = (data.username || '').trim().toLowerCase();
    const authId = data.auth_user_id || ('user_' + cleanUser.replace(/[^a-z0-9]/g, '_'));

    // Insert or replace user
    db.prepare(`
      INSERT OR REPLACE INTO users (id, username, email, password, role, created_at)
      VALUES (?, ?, ?, ?, 'user', ?);
    `).run(authId, data.username, data.email, data.password || 'SecureKey2026!', now);

    // Insert or replace profile
    db.prepare(`
      INSERT OR REPLACE INTO profiles (
        id, auth_user_id, username, email, password, role,
        owner_name, beneficiary_name, deposit_amount, deposit_item, currency,
        profile_image_url, context_details, security_code, transaction_code,
        deposit_code, cert_code, serial_no, date_of_deposit, status, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, 'user',
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?
      );
    `).run(
      id, authId, data.username, data.email, data.password || 'SecureKey2026!',
      data.owner_name, data.beneficiary_name, Number(data.deposit_amount) || 0, data.deposit_item || 'Vault Deposit', data.currency || 'USD',
      data.profile_image_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=180&auto=format&fit=crop&q=80',
      data.context_details || '', data.security_code || ('0' + Math.floor(100 + Math.random() * 900)),
      data.transaction_code || String(Math.floor(100000 + Math.random() * 900000)),
      data.deposit_code || (new Date().getFullYear() + '09MCP' + Math.floor(10 + Math.random() * 90)),
      data.cert_code || (Math.floor(100 + Math.random() * 900) + 'MC' + Math.floor(10 + Math.random() * 90)),
      data.serial_no || ('0147' + Math.floor(1000000000 + Math.random() * 9000000000)),
      data.date_of_deposit || new Date().toISOString().split('T')[0], data.status || 'Active', data.created_at || now, now
    );

    return this.getProfileById(id);
  },

  updateProfile(id, updates) {
    const existing = this.getProfileById(id);
    if (!existing) return null;

    const merged = { ...existing, ...updates, updated_at: new Date().toISOString() };

    db.prepare(`
      UPDATE profiles SET
        owner_name = ?,
        beneficiary_name = ?,
        deposit_amount = ?,
        deposit_item = ?,
        currency = ?,
        profile_image_url = ?,
        context_details = ?,
        security_code = ?,
        transaction_code = ?,
        deposit_code = ?,
        cert_code = ?,
        serial_no = ?,
        date_of_deposit = ?,
        status = ?,
        updated_at = ?
      WHERE id = ?;
    `).run(
      merged.owner_name, merged.beneficiary_name, Number(merged.deposit_amount), merged.deposit_item,
      merged.currency, merged.profile_image_url, merged.context_details, merged.security_code,
      merged.transaction_code, merged.deposit_code, merged.cert_code, merged.serial_no,
      merged.date_of_deposit, merged.status, merged.updated_at, id
    );

    return this.getProfileById(id);
  },

  reassignProfile(id, data) {
    const existing = this.getProfileById(id);
    if (!existing) return null;

    const prevOwner = existing.owner_name;
    const prevBen = existing.beneficiary_name;
    const reassignId = 'r-' + Date.now();
    const now = new Date().toISOString();

    // Log reassignment
    db.prepare(`
      INSERT INTO reassignments (id, profile_id, prev_owner, new_owner, prev_beneficiary, new_beneficiary, note, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `).run(reassignId, id, prevOwner, data.new_owner_name, prevBen, data.new_beneficiary_name, data.reassignment_note, now);

    // Update profile
    const logNote = ` [Reassignment Log: Reassigned from Owner "${prevOwner}" / Beneficiary "${prevBen}" to Owner "${data.new_owner_name}" / Beneficiary "${data.new_beneficiary_name}" on ${new Date().toLocaleDateString('en-GB')}. Reason: ${data.reassignment_note}]`;
    const updatedContext = (existing.context_details || '') + logNote;

    db.prepare(`
      UPDATE profiles SET
        owner_name = ?,
        beneficiary_name = ?,
        context_details = ?,
        updated_at = ?
      WHERE id = ?;
    `).run(data.new_owner_name, data.new_beneficiary_name, updatedContext, now, id);

    return this.getProfileById(id);
  },

  createCollectionNotice(data) {
    const id = 'cn-' + Date.now();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO collection_notices (id, profile_id, collection_date, courier_name, id_document, contact_phone, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `).run(id, data.profile_id, data.collectionDate, data.courierName, data.idDocument || '', data.contactPhone || '', now);

    // Append context to profile
    const existing = this.getProfileById(data.profile_id);
    if (existing) {
      const noticeLog = ` [2-Day Mandated Collection Notice received on ${new Date().toLocaleDateString('en-GB')}: Scheduled Collection for ${data.collectionDate}, Authorized Escort: ${data.courierName}].`;
      db.prepare(`UPDATE profiles SET context_details = context_details || ?, updated_at = ? WHERE id = ?;`)
        .run(noticeLog, now, data.profile_id);
    }

    return { id, success: true };
  },

  deleteProfile(id) {
    const profile = this.getProfileById(id);
    if (!profile) return false;

    db.prepare(`DELETE FROM profiles WHERE id = ?;`).run(id);
    if (profile.username) {
      db.prepare(`DELETE FROM users WHERE username = ?;`).run(profile.username);
    }
    return true;
  }
};
