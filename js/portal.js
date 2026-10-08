/* ==========================================================================
   MAN Commercial Protection - Portal Controller
   Controls: Login, User Dashboard (Protected), Admin Portal (Restricted)
   ========================================================================== */

(function(window, document) {
  'use strict';

  let currentUser = null;
  let selectedProfileId = null;

  document.addEventListener('DOMContentLoaded', () => {
    initPortal();
    bindEvents();
  });

  function initPortal() {
    currentUser = window.PortalData.getSession();
    if (currentUser) {
      renderViewForUser(currentUser);
    } else {
      showLoginView();
    }
  }

  function bindEvents() {
    // Login form
    const loginForm = document.getElementById('login-form');
    loginForm?.addEventListener('submit', handleLogin);


    // Logout buttons
    document.querySelectorAll('.btn-portal-logout').forEach(btn => {
      btn.addEventListener('click', () => {
        window.PortalData.logout();
        currentUser = null;
        showLoginView();
        showToast('Logged out successfully.', 'info');
      });
    });

    // Admin Search & Filters
    const searchInput = document.getElementById('admin-search');
    const statusSelect = document.getElementById('admin-status-select');

    searchInput?.addEventListener('input', () => {
      renderAdminTable();
    });

    statusSelect?.addEventListener('change', () => {
      renderAdminTable();
    });

    // Create Profile Form
    document.getElementById('create-profile-form')?.addEventListener('submit', handleCreateProfile);

    // Edit Profile Form
    document.getElementById('edit-profile-form')?.addEventListener('submit', handleEditProfile);

    // Dynamic Reassignment Form
    document.getElementById('reassign-names-form')?.addEventListener('submit', handleReassignNames);

    // Collection Notice Form
    document.getElementById('collection-notice-form')?.addEventListener('submit', handleCollectionNoticeSubmit);

    // Modal Close buttons
    document.querySelectorAll('.portal-modal-close, .btn-close-modal').forEach(btn => {
      btn.addEventListener('click', closeAllModals);
    });

    document.querySelectorAll('.portal-modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeAllModals();
      });
    });
  }

  async function handleLogin(e) {
    if (e && e.preventDefault) e.preventDefault();
    const identifier = document.getElementById('login-username')?.value || '';
    const password = document.getElementById('login-password')?.value || '';
    const errBox = document.getElementById('login-error-alert');

    if (errBox) errBox.style.display = 'none';

    const res = await window.PortalData.authenticate(identifier, password);
    if (res.success) {
      currentUser = res.user;
      showToast(`Welcome back, ${res.user.beneficiary_name || res.user.owner_name}!`, 'success');
      window.syncPortalNavState?.();
      renderViewForUser(currentUser);
    } else {
      if (errBox) {
        errBox.textContent = res.message;
        errBox.style.display = 'block';
      }
      showToast(res.message, 'error');
    }
  }

  function showLoginView() {
    document.getElementById('view-login').style.display = 'block';
    document.getElementById('view-user-dashboard').style.display = 'none';
    document.getElementById('view-admin-portal').style.display = 'none';
    window.syncPortalNavState?.();
  }

  function renderViewForUser(user) {
    document.getElementById('view-login').style.display = 'none';
    window.syncPortalNavState?.();

    if (user.role === 'admin') {
      document.getElementById('view-user-dashboard').style.display = 'none';
      document.getElementById('view-admin-portal').style.display = 'block';
      renderAdminDashboard();
    } else {
      document.getElementById('view-admin-portal').style.display = 'none';
      document.getElementById('view-user-dashboard').style.display = 'block';
      renderUserDashboard(user.id);
    }
  }

  // --- Protected User Dashboard Component ---
  function renderUserDashboard(profileId) {
    const profile = window.PortalData.getProfileById(profileId);
    if (!profile) return;

    // Bound Data Fields
    const avatarEl = document.getElementById('user-dash-avatar');
    const ownerEl = document.getElementById('user-dash-owner');
    const beneficiaryEl = document.getElementById('user-dash-beneficiary');
    const amountEl = document.getElementById('user-dash-amount');
    const contextEl = document.getElementById('user-dash-context');
    const headerTitle = document.getElementById('user-dash-header-name');
    const statusTag = document.getElementById('user-dash-status');

    if (avatarEl) avatarEl.src = profile.profile_image_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=180&auto=format&fit=crop&q=80';
    if (ownerEl) ownerEl.textContent = profile.owner_name || 'N/A';
    if (beneficiaryEl) beneficiaryEl.textContent = profile.beneficiary_name || 'N/A';
    if (headerTitle) headerTitle.textContent = profile.beneficiary_name;

    const formattedAmount = `${profile.currency === 'GBP' ? '£' : '$'}${(profile.deposit_amount || 0).toLocaleString()} (${profile.deposit_item || 'Consignment'})`;
    if (amountEl) amountEl.textContent = formattedAmount;

    if (contextEl) contextEl.textContent = profile.context_details || 'No context details on record.';
    if (statusTag) {
      statusTag.textContent = profile.status || 'Active';
      statusTag.className = `role-tag ${profile.status === 'Active' ? '' : 'bg-warning'}`;
    }

    // Live Demurrage Accrual Calculation
    const demurrage = window.PortalData.calculateDemurrage(profile.date_of_deposit || '2019-05-02', 10, profile.currency || 'USD');
    const demDate = document.getElementById('demurrage-deposit-date');
    const demDays = document.getElementById('demurrage-days');
    const demRate = document.getElementById('demurrage-daily-rate');
    const demFee = document.getElementById('demurrage-total-fee');

    if (demDate) demDate.textContent = demurrage.depositDateFormatted;
    if (demDays) demDays.textContent = `${demurrage.days.toLocaleString()} Days`;
    if (demRate) demRate.textContent = `${demurrage.symbol}${demurrage.dailyRate.toFixed(2)} / Day`;
    if (demFee) demFee.textContent = demurrage.formattedTotal;

    // Stepper State
    const progressBar = document.getElementById('claim-progress-bar');
    const step4 = document.getElementById('step-node-4');
    if (profile.status === 'Release Processing') {
      if (progressBar) progressBar.style.width = '80%';
      if (step4) {
        step4.className = 'step-item active';
        step4.querySelector('.step-circle').innerHTML = '<i class="fas fa-clock"></i>';
      }
    } else {
      if (progressBar) progressBar.style.width = '55%';
    }
  }

  // --- Restricted Admin Portal Component ---
  function renderAdminDashboard() {
    const stats = window.PortalData.getStats();

    const statTotal = document.getElementById('admin-stat-total');
    const statActive = document.getElementById('admin-stat-active');
    const statPending = document.getElementById('admin-stat-pending');
    const statValue = document.getElementById('admin-stat-value');

    if (statTotal) statTotal.textContent = stats.total;
    if (statActive) statActive.textContent = stats.active;
    if (statPending) statPending.textContent = stats.pending;
    if (statValue) statValue.textContent = stats.formattedTotalAssetValue;

    renderAdminTable();
  }

  function renderAdminTable() {
    const search = document.getElementById('admin-search')?.value || '';
    const status = document.getElementById('admin-status-select')?.value || 'ALL';
    const profiles = window.PortalData.getProfiles(search, status);
    const tbody = document.getElementById('admin-table-body');

    if (!tbody) return;

    if (profiles.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No profiles found matching search criteria.</td></tr>';
      return;
    }

    tbody.innerHTML = profiles.map(p => `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <img src="${p.profile_image_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=180&auto=format&fit=crop&q=80'}" style="width:38px; height:38px; border-radius:50%; object-fit:cover; border:1px solid #cbd5e1;" alt="${escapeHtml(p.beneficiary_name)}">
            <div>
              <strong style="color:var(--portal-navy); font-size:0.95rem;">${escapeHtml(p.beneficiary_name)}</strong>
              <div style="font-size:0.75rem; color:#64748b;"><code>${p.username}</code> &bull; ${escapeHtml(p.email)}</div>
            </div>
          </div>
        </td>
        <td>
          <strong style="color:var(--portal-red);">${escapeHtml(p.owner_name)}</strong>
          <div style="font-size:0.72rem; color:#64748b;">Deposit Ref: ${escapeHtml(p.deposit_code || 'N/A')}</div>
        </td>
        <td>
          <strong style="color:#047857;">${p.currency === 'GBP' ? '£' : '$'}${(p.deposit_amount || 0).toLocaleString()}</strong>
          <div style="font-size:0.75rem; color:#475569;">${escapeHtml(p.deposit_item)}</div>
        </td>
        <td>
          <div style="font-size:0.78rem; color:#334155; max-width:320px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeHtml(p.context_details)}">
            ${escapeHtml(p.context_details)}
          </div>
        </td>
        <td>
          <span style="font-size:0.75rem; font-weight:700; padding:0.2rem 0.55rem; border-radius:4px; text-transform:uppercase; background:${p.status === 'Active' ? '#ecfdf5; color:#065f46;' : '#fffbeb; color:#92400e;'}">${p.status}</span>
        </td>
        <td>
          <div style="display:flex; gap:0.35rem; justify-content:flex-end;">
            <button class="btn btn--sm btn--outline" onclick="window.PortalUI.openCertModal('${p.id}')" title="View Official Certificate" style="color:var(--portal-gold); border-color:var(--portal-gold);">
              <i class="fas fa-certificate"></i> Cert
            </button>
            <button class="btn btn--sm btn--outline" onclick="window.PortalUI.openEditModal('${p.id}')" title="Edit Profile">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn--sm btn--outline" onclick="window.PortalUI.openReassignModal('${p.id}')" title="Dynamic Reassignment of Names" style="color:#d97706; border-color:#fde68a; background:#fffbeb;">
              <i class="fas fa-arrows-rotate"></i> Reassign
            </button>
            <button class="btn btn--sm btn--outline text-danger" onclick="window.PortalUI.deleteProfile('${p.id}')" title="Delete Profile">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // --- Official Certificate of Deposit Modal Handler ---
  function openCertModal(profileId) {
    const id = profileId || (currentUser ? currentUser.id : null);
    const profile = id ? window.PortalData.getProfileById(id) : window.PortalData.profiles[0];
    if (!profile) return;

    // Bind fields matching the PDF Certificate
    const secEl = document.getElementById('cert-render-security');
    const txEl = document.getElementById('cert-render-transaction');
    const certCodeEl = document.getElementById('cert-render-cert-code');
    const depCodeEl = document.getElementById('cert-render-deposit-code');
    const serialEl = document.getElementById('cert-render-serial');
    const itemsEl = document.getElementById('cert-render-items');
    const dateEl = document.getElementById('cert-render-date');
    const purposeEl = document.getElementById('cert-render-purpose');
    const depEl = document.getElementById('cert-render-depositor');
    const benEl = document.getElementById('cert-render-beneficiary');
    const sigDepEl = document.getElementById('cert-render-sig-depositor');

    if (secEl) secEl.textContent = profile.security_code || '0147';
    if (txEl) txEl.textContent = profile.transaction_code || '529138';
    if (certCodeEl) certCodeEl.textContent = profile.cert_code || '316SJ17';
    if (depCodeEl) depCodeEl.textContent = profile.deposit_code || '198308MZL14';
    if (serialEl) serialEl.textContent = profile.serial_no || '01479040198308';
    if (itemsEl) itemsEl.textContent = profile.deposit_item || 'GOLD (490Kilos)';
    if (dateEl) dateEl.textContent = profile.date_of_deposit ? '2nd May, 2019' : '2nd May, 2019';
    if (purposeEl) purposeEl.textContent = 'SAFE KEEPING';
    if (depEl) depEl.textContent = (profile.owner_name || 'ENGINEER STEVEN JOHNSON').toUpperCase();
    if (benEl) benEl.innerHTML = (profile.beneficiary_name || 'ANITA JOHNSON').toUpperCase() + '<br><small>(MALE GENDER / HEIR MANDATE)</small>';
    if (sigDepEl) sigDepEl.textContent = (profile.owner_name || 'ENGINEER STEVEN JOHNSON').toUpperCase();
    const scriptSigDepEl = document.getElementById('cert-render-sig-script-depositor');
    if (scriptSigDepEl) {
      const rawName = profile.owner_name || 'Steven Johnson';
      const cleanName = rawName.replace(/^(engineer|lord|capt\.?|dr\.?|mr\.?|mrs\.?|ms\.?)\s+/i, '');
      scriptSigDepEl.textContent = cleanName;
    }

    openModal('modal-cert-preview');
  }

  // --- CRUD Modal Actions ---
  function openCreateModal() {
    document.getElementById('create-profile-form').reset();
    openModal('modal-create-profile');
  }

  function handleCreateProfile(e) {
    e.preventDefault();
    const data = {
      owner_name: document.getElementById('create-owner-name').value,
      beneficiary_name: document.getElementById('create-beneficiary-name').value,
      username: document.getElementById('create-username').value,
      email: document.getElementById('create-email').value,
      password: document.getElementById('create-password').value,
      deposit_amount: document.getElementById('create-deposit-amount').value,
      deposit_item: document.getElementById('create-deposit-item').value,
      currency: document.getElementById('create-currency').value,
      profile_image_url: document.getElementById('create-avatar-url').value,
      context_details: document.getElementById('create-context-details').value,
      status: document.getElementById('create-status').value
    };

    window.PortalData.createProfile(data);
    closeAllModals();
    showToast(`Profile for ${data.beneficiary_name} created successfully!`, 'success');
    renderAdminDashboard();
  }

  function openEditModal(id) {
    const profile = window.PortalData.getProfileById(id);
    if (!profile) return;

    selectedProfileId = id;
    document.getElementById('edit-profile-id').value = id;
    document.getElementById('edit-owner-name').value = profile.owner_name || '';
    document.getElementById('edit-beneficiary-name').value = profile.beneficiary_name || '';
    document.getElementById('edit-username').value = profile.username || '';
    document.getElementById('edit-email').value = profile.email || '';
    document.getElementById('edit-deposit-amount').value = profile.deposit_amount || '';
    document.getElementById('edit-deposit-item').value = profile.deposit_item || '';
    document.getElementById('edit-currency').value = profile.currency || 'USD';
    document.getElementById('edit-avatar-url').value = profile.profile_image_url || '';
    document.getElementById('edit-context-details').value = profile.context_details || '';
    document.getElementById('edit-status').value = profile.status || 'Active';

    openModal('modal-edit-profile');
  }

  function handleEditProfile(e) {
    e.preventDefault();
    if (!selectedProfileId) return;

    const updates = {
      owner_name: document.getElementById('edit-owner-name').value,
      beneficiary_name: document.getElementById('edit-beneficiary-name').value,
      username: document.getElementById('edit-username').value,
      email: document.getElementById('edit-email').value,
      deposit_amount: document.getElementById('edit-deposit-amount').value,
      deposit_item: document.getElementById('edit-deposit-item').value,
      currency: document.getElementById('edit-currency').value,
      profile_image_url: document.getElementById('edit-avatar-url').value,
      context_details: document.getElementById('edit-context-details').value,
      status: document.getElementById('edit-status').value
    };

    const newPass = document.getElementById('edit-password').value;
    if (newPass) updates.password = newPass;

    window.PortalData.updateProfile(selectedProfileId, updates);
    closeAllModals();
    showToast('Profile updated successfully!', 'success');
    renderAdminDashboard();
  }

  // --- Dynamic Reassignment of Names Modal ---
  function openReassignModal(id) {
    const profile = window.PortalData.getProfileById(id);
    if (!profile) return;

    selectedProfileId = id;
    document.getElementById('reassign-profile-id').value = id;
    document.getElementById('reassign-current-owner').textContent = profile.owner_name;
    document.getElementById('reassign-current-beneficiary').textContent = profile.beneficiary_name;

    document.getElementById('reassign-new-owner').value = profile.beneficiary_name; // Default suggestion: promote beneficiary to owner
    document.getElementById('reassign-new-beneficiary').value = '';
    document.getElementById('reassign-note').value = 'High Court Probate granted. Account ownership transferred to beneficiary.';

    openModal('modal-reassign-names');
  }

  function handleReassignNames(e) {
    e.preventDefault();
    if (!selectedProfileId) return;

    const newOwner = document.getElementById('reassign-new-owner').value;
    const newBen = document.getElementById('reassign-new-beneficiary').value;
    const note = document.getElementById('reassign-note').value;

    window.PortalData.reassignNames(selectedProfileId, {
      new_owner_name: newOwner,
      new_beneficiary_name: newBen,
      reassignment_note: note
    });

    closeAllModals();
    showToast('Names reassigned successfully and logged to context!', 'success');
    renderAdminDashboard();
  }

  function deleteProfile(id) {
    const profile = window.PortalData.getProfileById(id);
    if (!profile) return;

    if (confirm(`Are you sure you want to delete profile for ${profile.beneficiary_name}?`)) {
      window.PortalData.deleteProfile(id);
      showToast('Profile deleted.', 'info');
      renderAdminDashboard();
    }
  }

  // Collection Notice Actions
  function openCollectionNoticeModal() {
    const noticeForm = document.getElementById('collection-notice-form');
    if (noticeForm) noticeForm.reset();

    // Default min date to 2 days from today
    const noticeDate = document.getElementById('notice-date');
    if (noticeDate) {
      const minD = new Date();
      minD.setDate(minD.getDate() + 2);
      noticeDate.min = minD.toISOString().split('T')[0];
      noticeDate.value = minD.toISOString().split('T')[0];
    }

    openModal('modal-collection-notice');
  }

  function handleCollectionNoticeSubmit(e) {
    e.preventDefault();
    if (!currentUser) return;

    const noticeData = {
      collectionDate: document.getElementById('notice-date')?.value,
      courierName: document.getElementById('notice-courier')?.value,
      claimantPhone: document.getElementById('notice-phone')?.value,
      idType: document.getElementById('notice-id-type')?.value,
      remarks: document.getElementById('notice-remarks')?.value
    };

    window.PortalData.submitCollectionNotice(currentUser.id, noticeData);
    closeAllModals();
    showToast('2-Day Collection Notice lodged with Solihull Vault Dispatch!', 'success');
    renderUserDashboard(currentUser.id);
  }

  // Modal helpers
  function openModal(id) {
    document.getElementById(id)?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeAllModals() {
    document.querySelectorAll('.portal-modal-backdrop').forEach(m => m.classList.remove('active'));
    document.body.style.overflow = '';
  }

  function showToast(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `portal-toast portal-toast--${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  window.PortalUI = {
    openCreateModal,
    openEditModal,
    openReassignModal,
    openCertModal,
    openCollectionNoticeModal,
    deleteProfile
  };

})(window, document);
