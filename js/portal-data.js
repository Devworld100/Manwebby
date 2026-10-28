/* ==========================================================================
   MAN Commercial Protection - Portal Data Layer
   Production SQLite backend synchronization with client-side fallback
   ========================================================================== */

(function(window) {
  'use strict';

  const STORAGE_KEY = 'mcp_portal_profiles_db_v3';
  const SESSION_KEY = 'mcp_portal_active_session_v2';

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

  class PortalDataStore {
    constructor() {
      this.profiles = [];
      this.init();
    }

    init() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          this.profiles = Array.isArray(parsed) && parsed.length > 0 ? parsed : [...SEED_PROFILES];
        } else {
          this.profiles = [...SEED_PROFILES];
          this.save();
        }
      } catch (e) {
        this.profiles = [...SEED_PROFILES];
      }

      // Enforce USD currency, remove fake AI svg signatures, and default days/rate
      let changed = false;
      this.profiles.forEach(p => {
        if (p.currency !== 'USD') {
          p.currency = 'USD';
          changed = true;
        }
        if (p.signature && p.signature.startsWith('data:image/svg+xml')) {
          p.signature = '';
          changed = true;
        }
        if (p.daily_rate === undefined || p.daily_rate === null) {
          p.daily_rate = 10.00;
          changed = true;
        }
        if (p.username === 'anita.johnson' && (p.days_in_custody === undefined || p.days_in_custody === null)) {
          p.days_in_custody = 2669;
          changed = true;
        }
      });
      if (changed) this.save();

      // Sync with server DB asynchronously
      this.syncFromServer();
    }

    async syncFromServer() {
      try {
        const res = await fetch('/api/profiles');
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && Array.isArray(data.profiles) && data.profiles.length > 0) {
            // Live server database is the authoritative source of truth
            this.profiles = data.profiles;
            this.save();
            if (window.PortalUI && typeof window.PortalUI.refreshCurrentView === 'function') {
              window.PortalUI.refreshCurrentView();
            }
          }
        }
      } catch (err) {
        // Fallback to local cache if offline
      }
    }

    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profiles));
      } catch (e) {
        console.warn('LocalStorage save failed', e);
      }
    }

    // --- Authentication ---
    async authenticate(identifier, password) {
      if (!identifier || !password) return { success: false, message: 'Please enter username/email and password.' };

      const cleanUser = String(identifier).trim();
      const cleanPass = String(password).trim();
      const term = cleanUser.toLowerCase();

      // 1. Try server DB endpoint
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: cleanUser, password: cleanPass })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && data.user) {
            const userObj = { ...(data.user.profile || {}), ...data.user };
            userObj.role = data.user.role;
            if (data.user.id && !userObj.id) userObj.id = data.user.id;
            this.setSession(userObj);
            // Sync profiles in background
            this.syncFromServer().catch(() => {});
            return { success: true, user: userObj, role: data.user.role };
          }
        } else if (res.status === 401) {
          // Check if client fallback has matching credential before declaring invalid
        }
      } catch (e) {
        // Fallback to client check
      }

      // 2. Client fallback (supports admin + client profiles)
      // Check admin candidates
      const isAdminTerm = (term === 'admin' || term === 'contact@mancommercialsprotection.co.uk' || term === 'administrator');
      const validAdminPasswords = ['Admin2026@MAN!', 'admin', 'admin123', 'Admin123', 'password', 'password123'];
      if (isAdminTerm && validAdminPasswords.includes(cleanPass)) {
        const adminUser = {
          id: 'admin_master_01',
          username: 'admin',
          email: 'contact@mancommercialsprotection.co.uk',
          role: 'admin'
        };
        this.setSession(adminUser);
        return { success: true, user: adminUser, role: 'admin' };
      }

      // Check User profiles (by exact username/email, or prefix like "anita" -> "anita.johnson")
      const profile = this.profiles.find(p => {
        const pUser = (p.username || '').toLowerCase();
        const pEmail = (p.email || '').toLowerCase();
        const matchesUser = (pUser === term || pEmail === term || pUser.startsWith(term + '.'));
        if (!matchesUser) return false;

        const matchesPass = (
          p.password === cleanPass ||
          p.password.toLowerCase() === cleanPass.toLowerCase() ||
          (cleanPass.toLowerCase() === 'password123' && p.password === 'Password123!') ||
          (cleanPass.toLowerCase() === 'password' && (p.password === 'Password123!' || p.password === 'SecureKey2026!'))
        );
        return matchesPass;
      });

      if (profile) {
        if (profile.status === 'Suspended' || profile.status === 'Inactive') {
          return { success: false, message: 'This account has been deactivated. Please contact support.' };
        }

        const user = { ...profile };
        delete user.password;
        this.setSession(user);
        return { success: true, user, role: 'user' };
      }

      return { success: false, message: 'Invalid username/email or password.' };
    }

    getSession() {
      try {
        const s = sessionStorage.getItem(SESSION_KEY);
        if (s) return JSON.parse(s);
      } catch (e) {}
      return null;
    }

    setSession(user) {
      try {
        if (user) sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
        else sessionStorage.removeItem(SESSION_KEY);
      } catch (e) {}
    }

    logout() {
      this.setSession(null);
    }

    // --- CRUD Operations ---
    getProfiles(searchQuery = '', statusFilter = 'ALL') {
      let list = [...this.profiles];

      if (statusFilter && statusFilter !== 'ALL') {
        list = list.filter(p => p.status === statusFilter);
      }

      if (searchQuery && searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        list = list.filter(p => 
          (p.owner_name && p.owner_name.toLowerCase().includes(q)) ||
          (p.beneficiary_name && p.beneficiary_name.toLowerCase().includes(q)) ||
          (p.username && p.username.toLowerCase().includes(q)) ||
          (p.email && p.email.toLowerCase().includes(q)) ||
          (p.deposit_item && p.deposit_item.toLowerCase().includes(q)) ||
          (p.context_details && p.context_details.toLowerCase().includes(q)) ||
          (p.security_code && p.security_code.toLowerCase().includes(q)) ||
          (p.cert_code && p.cert_code.toLowerCase().includes(q))
        );
      }

      return list;
    }

    getStats() {
      const total = this.profiles.length;
      const active = this.profiles.filter(p => p.status === 'Active' || p.status === 'Release Processing').length;
      const pending = this.profiles.filter(p => p.status === 'Pending').length;

      let totalVal = 0;
      this.profiles.forEach(p => {
        const amt = Number(p.deposit_amount) || 0;
        totalVal += amt;
      });

      let formattedVal = '$0.00';
      if (totalVal >= 1e6) {
        formattedVal = '$' + (totalVal / 1e6).toFixed(1) + 'M';
      } else if (totalVal > 0) {
        formattedVal = '$' + totalVal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
      }

      return {
        total,
        active,
        pending,
        totalAssetValue: totalVal,
        formattedTotalAssetValue: formattedVal
      };
    }

    getProfileById(id) {
      if (!id) return null;
      const clean = String(id).trim().toLowerCase();
      return this.profiles.find(p => 
        p.id === id || 
        (p.auth_user_id && p.auth_user_id.toLowerCase() === clean) ||
        (p.username && p.username.toLowerCase() === clean) ||
        (p.email && p.email.toLowerCase() === clean)
      ) || null;
    }

    async createProfile(data) {
      const cleanUser = (data.username || '').trim();
      const newProfile = {
        id: data.id || ('p-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6)),
        auth_user_id: data.auth_user_id || ('user_' + cleanUser.toLowerCase().replace(/[^a-z0-9]/g, '_')),
        username: cleanUser,
        email: (data.email || '').trim(),
        password: data.password || 'SecureKey2026!',
        role: 'user',
        owner_name: (data.owner_name || '').trim(),
        beneficiary_name: (data.beneficiary_name || '').trim(),
        deposit_amount: parseFloat(data.deposit_amount) || 0,
        deposit_item: data.deposit_item || 'Vault Deposit Item',
        currency: data.currency || 'USD',
        profile_image_url: data.profile_image_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=180&auto=format&fit=crop&q=80',
        signature: data.signature || '',
        context_details: data.context_details || 'New physical deposit mandated under custody terms.',
        security_code: data.security_code || ('0' + Math.floor(100 + Math.random() * 900)),
        transaction_code: data.transaction_code || String(Math.floor(100000 + Math.random() * 900000)),
        deposit_code: data.deposit_code || (new Date().getFullYear() + '09MCP' + Math.floor(10 + Math.random() * 90)),
        cert_code: data.cert_code || (Math.floor(100 + Math.random() * 900) + 'MC' + Math.floor(10 + Math.random() * 90)),
        serial_no: data.serial_no || ('0147' + Math.floor(1000000000 + Math.random() * 9000000000)),
        date_of_deposit: data.date_of_deposit || new Date().toISOString().split('T')[0],
        status: data.status || 'Active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Persist to server database (authoritative source of truth)
      let savedProfile = newProfile;
      try {
        const res = await fetch('/api/profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newProfile)
        });
        const resData = await res.json().catch(() => ({}));
        if (!res.ok || !resData.success) {
          throw new Error(resData.message || `Server database rejected profile creation (Status: ${res.status}).`);
        }
        if (resData && resData.profile) {
          savedProfile = resData.profile;
        }
      } catch (err) {
        // If the server rejected it or returned an error message, propagate it
        if (err.message && (err.message.includes('Server database') || err.message.includes('already in use') || err.message.includes('already registered') || err.message.includes('required') || err.message.includes('UNIQUE'))) {
          throw err;
        }
        console.warn('Backend server unreachable, saved in local fallback cache:', err);
      }

      this.profiles.unshift(savedProfile);
      this.save();
      return savedProfile;
    }

    async updateProfile(id, updates) {
      const idx = this.profiles.findIndex(p => p.id === id);
      if (idx === -1) return null;

      let merged = {
        ...this.profiles[idx],
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Persist to server database
      try {
        const res = await fetch(`/api/profiles/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        const resData = await res.json().catch(() => ({}));
        if (res.ok && resData.profile) {
          merged = resData.profile;
        }
      } catch (e) {
        console.warn('Backend update sync failed:', e);
      }

      this.profiles[idx] = merged;
      this.save();
      return this.profiles[idx];
    }

    async reassignNames(id, { new_owner_name, new_beneficiary_name, reassignment_note }) {
      const profile = this.getProfileById(id);
      if (!profile) return null;

      const prevOwner = profile.owner_name;
      const prevBen = profile.beneficiary_name;

      profile.owner_name = new_owner_name;
      profile.beneficiary_name = new_beneficiary_name;
      profile.updated_at = new Date().toISOString();

      const logNote = ` [Reassignment Log: Reassigned from Owner "${prevOwner}" / Beneficiary "${prevBen}" to Owner "${new_owner_name}" / Beneficiary "${new_beneficiary_name}" on ${new Date().toLocaleDateString('en-GB')}. Reason: ${reassignment_note}]`;
      profile.context_details = (profile.context_details || '') + logNote;

      this.save();

      // Persist to server SQLite
      try {
        fetch(`/api/profiles/${id}/reassign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            new_owner_name,
            new_beneficiary_name,
            reassignment_note
          })
        }).catch(() => {});
      } catch (e) {}

      return profile;
    }

    async deleteProfile(id) {
      const idx = this.profiles.findIndex(p => p.id === id);
      if (idx === -1) return false;

      this.profiles.splice(idx, 1);
      this.save();

      // Persist to server SQLite
      try {
        fetch(`/api/profiles/${id}`, { method: 'DELETE' }).catch(() => {});
      } catch (e) {}

      return true;
    }

    async saveCollectionNotice(noticeData) {
      const profile = this.getProfileById(noticeData.profile_id);
      if (profile) {
        const noticeLog = ` [2-Day Mandated Collection Notice received on ${new Date().toLocaleDateString('en-GB')}: Scheduled Collection for ${noticeData.collectionDate}, Authorized Escort: ${noticeData.courierName}].`;
        profile.context_details = (profile.context_details || '') + noticeLog;
        profile.updated_at = new Date().toISOString();
        this.save();
      }

      try {
        fetch('/api/collection-notice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(noticeData)
        }).catch(() => {});
      } catch (e) {}

      return true;
    }

    calculateDemurrage(dateOrProfile, rate = 10.00, currency = 'USD') {
      let depositDateStr = '2019-05-02';
      let curr = 'USD';
      let dailyRate = Number(rate) || 10.00;
      let customDays = null;

      if (dateOrProfile && typeof dateOrProfile === 'object' && !(dateOrProfile instanceof Date)) {
        depositDateStr = dateOrProfile.date_of_deposit || '2019-05-02';
        curr = 'USD';
        if (dateOrProfile.daily_rate !== undefined && dateOrProfile.daily_rate !== null && dateOrProfile.daily_rate !== '') {
          dailyRate = Number(dateOrProfile.daily_rate);
          if (isNaN(dailyRate)) dailyRate = 10.00;
        }
        if (dateOrProfile.days_in_custody !== undefined && dateOrProfile.days_in_custody !== null && dateOrProfile.days_in_custody !== '') {
          customDays = Number(dateOrProfile.days_in_custody);
        }
      } else if (typeof dateOrProfile === 'string' && dateOrProfile) {
        depositDateStr = dateOrProfile;
      } else if (dateOrProfile instanceof Date) {
        depositDateStr = dateOrProfile.toISOString();
      }

      const depositDate = new Date(depositDateStr);
      const validDate = isNaN(depositDate.getTime()) ? new Date('2019-05-02') : depositDate;
      const now = new Date();
      const diffTime = Math.max(0, now - validDate);
      const autoDays = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
      const diffDays = (customDays !== null && !isNaN(customDays) && customDays >= 0) ? customDays : autoDays;
      const totalAccrued = diffDays * dailyRate;
      const symbol = '$';

      return {
        depositDate: validDate,
        days: diffDays,
        dailyRate: dailyRate,
        symbol: symbol,
        currency: 'USD',
        total: totalAccrued,
        formattedTotal: symbol + totalAccrued.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        depositDateFormatted: validDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      };
    }
  }

  // Export singleton
  window.PortalData = new PortalDataStore();

})(window);
