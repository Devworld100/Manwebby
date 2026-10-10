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

// Database Layer Implementation (Clean production layer - no hardcoded demo accounts)

// Database Layer Implementation
module.exports = {
  isSupabase() {
    return Boolean(supabase);
  },

  getEngineName() {
    return supabase ? 'Supabase (PostgreSQL Cloud)' : 'SQLite (node:sqlite WAL)';
  },

  async authenticateUser(usernameOrEmail, password) {
    const clean = (usernameOrEmail || '').trim().toLowerCase();

    // 1. Supabase Mode
    if (supabase) {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .or(`username.ilike.${clean},email.ilike.${clean}`);

      if (error || !users || users.length === 0) return null;
      const user = users.find(u => u.password === password);
      if (!user) return null;

      if (user.role === 'user') {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .or(`username.ilike.${clean},email.ilike.${clean},auth_user_id.eq.${user.id},id.eq.${user.id}`)
          .limit(1);

        user.profile = (profiles && profiles.length > 0) ? profiles[0] : null;
      }
      return user;
    }

    // 2. SQLite Fallback
    const stmt = sqliteDb.prepare(`
      SELECT * FROM users
      WHERE (LOWER(username) = ? OR LOWER(email) = ?) AND password = ?;
    `);
    const user = stmt.get(clean, clean, password);
    if (!user) return null;

    if (user.role === 'user') {
      const pStmt = sqliteDb.prepare(`
        SELECT * FROM profiles 
        WHERE LOWER(username) = ? OR LOWER(email) = ? OR auth_user_id = ? OR id = ?;
      `);
      user.profile = pStmt.get(clean, clean, user.id, user.id);
    }
    return user;
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
    const id = data.id || ('p-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7));
    const now = new Date().toISOString();
    const cleanUser = (data.username || '').trim().toLowerCase();
    const authId = data.auth_user_id || ('user_' + cleanUser.replace(/[^a-z0-9]/g, '_'));

    const profileData = {
      id,
      auth_user_id: authId,
      username: data.username,
      email: data.email,
      password: data.password || 'SecureKey2026!',
      role: 'user',
      owner_name: data.owner_name,
      beneficiary_name: data.beneficiary_name,
      deposit_amount: Number(data.deposit_amount) || 0,
      deposit_item: data.deposit_item || 'Vault Deposit',
      currency: data.currency || 'USD',
      profile_image_url: data.profile_image_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=180&auto=format&fit=crop&q=80',
      context_details: data.context_details || '',
      security_code: data.security_code || ('0' + Math.floor(100 + Math.random() * 900)),
      transaction_code: data.transaction_code || String(Math.floor(100000 + Math.random() * 900000)),
      deposit_code: data.deposit_code || (new Date().getFullYear() + '09MCP' + Math.floor(10 + Math.random() * 90)),
      cert_code: data.cert_code || (Math.floor(100 + Math.random() * 900) + 'MC' + Math.floor(10 + Math.random() * 90)),
      serial_no: data.serial_no || ('0147' + Math.floor(1000000000 + Math.random() * 9000000000)),
      date_of_deposit: data.date_of_deposit || now.split('T')[0],
      status: data.status || 'Active',
      created_at: data.created_at || now,
      updated_at: now
    };

    if (supabase) {
      await supabase.from('users').upsert({
        id: authId,
        username: data.username,
        email: data.email,
        password: data.password || 'SecureKey2026!',
        role: 'user',
        created_at: now
      });

      const { data: created, error } = await supabase
        .from('profiles')
        .upsert(profileData)
        .select()
        .single();

      if (error) console.error('[Supabase createProfile Error]:', error.message);
      return created || profileData;
    }

    sqliteDb.prepare(`
      INSERT OR REPLACE INTO users (id, username, email, password, role, created_at)
      VALUES (?, ?, ?, ?, 'user', ?);
    `).run(authId, data.username, data.email, data.password || 'SecureKey2026!', now);

    sqliteDb.prepare(`
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
      profileData.id, profileData.auth_user_id, profileData.username, profileData.email, profileData.password,
      profileData.owner_name, profileData.beneficiary_name, profileData.deposit_amount, profileData.deposit_item, profileData.currency,
      profileData.profile_image_url, profileData.context_details, profileData.security_code,
      profileData.transaction_code, profileData.deposit_code, profileData.cert_code,
      profileData.serial_no, profileData.date_of_deposit, profileData.status, profileData.created_at, profileData.updated_at
    );

    return this.getProfileById(id);
  },

  async updateProfile(id, updates) {
    const existing = await this.getProfileById(id);
    if (!existing) return null;

    const merged = { ...existing, ...updates, updated_at: new Date().toISOString() };

    if (supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          owner_name: merged.owner_name,
          beneficiary_name: merged.beneficiary_name,
          deposit_amount: Number(merged.deposit_amount),
          deposit_item: merged.deposit_item,
          currency: merged.currency,
          profile_image_url: merged.profile_image_url,
          context_details: merged.context_details,
          security_code: merged.security_code,
          transaction_code: merged.transaction_code,
          deposit_code: merged.deposit_code,
          cert_code: merged.cert_code,
          serial_no: merged.serial_no,
          date_of_deposit: merged.date_of_deposit,
          status: merged.status,
          updated_at: merged.updated_at
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) console.error('[Supabase updateProfile Error]:', error.message);
      return data || merged;
    }

    sqliteDb.prepare(`
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
      merged.date_of_deposit, merged.status, merged.updated_at, existing.id
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
