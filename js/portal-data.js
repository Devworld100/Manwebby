/* ==========================================================================
   MAN Commercial Protection - Portal Data Layer
   Production SQLite backend synchronization with client-side fallback
   ========================================================================== */

(function(window) {
  'use strict';

  const STORAGE_KEY = 'mcp_portal_profiles_db_v3';
  const SESSION_KEY = 'mcp_portal_active_session_v2';

  class PortalDataStore {
    constructor() {
      this.profiles = [];
      this.init();
    }

    init() {
      // Purge legacy demo storage keys so no fake demo data persists
      try {
        localStorage.removeItem('mcp_portal_profiles_db');
        localStorage.removeItem('mcp_portal_profiles_db_v2');
      } catch (e) {}

      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.profiles = JSON.parse(stored);
        } else {
          this.profiles = [];
          this.save();
        }
      } catch (e) {
        this.profiles = [];
      }

      // Sync with server DB asynchronously
      this.syncFromServer();
    }

    async syncFromServer() {
      try {
        const res = await fetch('/api/profiles');
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && Array.isArray(data.profiles)) {
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

      // 1. Try server SQLite DB
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: identifier, password })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && data.user) {
            const userObj = data.user.profile || data.user;
            userObj.role = data.user.role;
            if (data.user.id && !userObj.id) userObj.id = data.user.id;
            this.setSession(userObj);
            await this.syncFromServer();
            return { success: true, user: userObj, role: data.user.role };
          }
        } else if (res.status === 401) {
          return { success: false, message: 'Invalid username/email or password.' };
        }
      } catch (e) {
        // Fallback to client check
      }

      // 2. Client fallback (only matching registered profiles in storage)
      const term = identifier.trim().toLowerCase();

      // Check User profiles
      const profile = this.profiles.find(p => 
        (p.username.toLowerCase() === term || p.email.toLowerCase() === term) && 
        p.password === password
      );

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
        const mult = p.currency === 'GBP' ? 1.30 : (p.currency === 'EUR' ? 1.08 : 1.0);
        totalVal += amt * mult;
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

      this.profiles.unshift(newProfile);
      this.save();

      // Persist to server SQLite
      try {
        const res = await fetch('/api/profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newProfile)
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData && resData.profile) {
            const idx = this.profiles.findIndex(p => p.id === newProfile.id || p.username.toLowerCase() === newProfile.username.toLowerCase());
            if (idx !== -1) {
              this.profiles[idx] = resData.profile;
              this.save();
            }
          }
        }
      } catch (e) {
        console.warn('Backend sync failed, saved in local cache:', e);
      }

      return newProfile;
    }

    async updateProfile(id, updates) {
      const idx = this.profiles.findIndex(p => p.id === id);
      if (idx === -1) return null;

      this.profiles[idx] = {
        ...this.profiles[idx],
        ...updates,
        updated_at: new Date().toISOString()
      };
      this.save();

      // Persist to server SQLite
      try {
        fetch(`/api/profiles/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        }).catch(() => {});
      } catch (e) {}

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

    calculateDemurrage(profile) {
      const depositDate = profile.date_of_deposit ? new Date(profile.date_of_deposit) : new Date('2019-05-02');
      const now = new Date();
      const diffTime = Math.abs(now - depositDate);
      const diffDays = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
      const dailyRate = 10.00;
      const totalAccrued = diffDays * dailyRate;

      return {
        depositDate,
        days: diffDays,
        dailyRate: 10.00,
        total: totalAccrued,
        formattedTotal: '$' + totalAccrued.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        depositDateFormatted: depositDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      };
    }
  }

  // Export singleton
  window.PortalData = new PortalDataStore();

})(window);
