/* ==========================================================================
   MAN Commercial Protection - Portal Controller
   Controls: Login, User Dashboard (Protected), Admin Portal (Restricted)
   ========================================================================== */

(function(window, document) {
  'use strict';

  let currentUser = null;
  let selectedProfileId = null;
  let isCreatingFromLogin = false;

  const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=180&auto=format&fit=crop&q=80';

  // Client-side image compression & optimization (Canvas max 400x400 JPEG 0.85)
  function compressImageFile(file, maxWidth = 400, maxHeight = 400, quality = 0.85) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) {
        return reject(new Error('Please select an image file (PNG, JPG, or WEBP).'));
      }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error('Failed to load image for processing.'));
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function setupAvatarUpload(fileInputId, hiddenUrlId, previewImgId, clearBtnId, defaultUrl) {
    const fileInput = document.getElementById(fileInputId);
    const hiddenUrl = document.getElementById(hiddenUrlId);
    const previewImg = document.getElementById(previewImgId);
    const clearBtn = document.getElementById(clearBtnId);
    const uploadBox = fileInput?.closest('.avatar-upload-box');

    if (!fileInput) return;

    async function handleFile(file) {
      if (!file) return;
      try {
        const dataUrl = await compressImageFile(file);
        hiddenUrl.value = dataUrl;
        if (previewImg) previewImg.src = dataUrl;
        showToast('Image uploaded and optimized successfully!', 'success');
      } catch (err) {
        showToast(err.message || 'Image upload failed', 'error');
      }
    }

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      handleFile(file);
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        fileInput.value = '';
        hiddenUrl.value = defaultUrl;
        if (previewImg) previewImg.src = defaultUrl;
        showToast('Avatar reset to default.', 'info');
      });
    }

    if (uploadBox) {
      ['dragenter', 'dragover'].forEach(eventName => {
        uploadBox.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          uploadBox.classList.add('drag-over');
        });
      });
      ['dragleave', 'drop'].forEach(eventName => {
        uploadBox.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          uploadBox.classList.remove('drag-over');
        });
      });
      uploadBox.addEventListener('drop', (e) => {
        e.preventDefault();
        const file = e.dataTransfer?.files?.[0];
        handleFile(file);
      });
    }
  }

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
    // Setup Avatar Uploaders (Create & Edit)
    setupAvatarUpload('create-avatar-file', 'create-avatar-url', 'create-avatar-preview', 'btn-create-clear-avatar', DEFAULT_AVATAR);
    setupAvatarUpload('edit-avatar-file', 'edit-avatar-url', 'edit-avatar-preview', 'btn-edit-clear-avatar', DEFAULT_AVATAR);

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
      const backBtn = document.getElementById('btn-back-to-admin');
      if (backBtn) backBtn.style.display = 'none';
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
      <tr data-profile-id="${p.id}">
        <td>
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <img src="${p.profile_image_url || DEFAULT_AVATAR}" onerror="this.src='${DEFAULT_AVATAR}'" style="width:38px; height:38px; border-radius:50%; object-fit:cover; border:1px solid #cbd5e1;" alt="${escapeHtml(p.beneficiary_name)}">
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
          <div style="display:flex; gap:0.35rem; justify-content:flex-end; align-items:center;">
            <button class="btn btn--sm btn--primary" onclick="window.PortalUI.previewDashboard('${p.id}')" title="Preview Beneficiary Dashboard View" style="padding:0.25rem 0.55rem; font-size:0.75rem; background:var(--portal-red); border-color:var(--portal-red);">
              <i class="fas fa-eye"></i> View
            </button>
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

  // --- Preview Beneficiary Dashboard for Admin ---
  function previewDashboard(profileId) {
    document.getElementById('view-admin-portal').style.display = 'none';
    document.getElementById('view-user-dashboard').style.display = 'block';
    renderUserDashboard(profileId);

    // Show Back to Admin button in user dashboard header
    let backBtn = document.getElementById('btn-back-to-admin');
    if (!backBtn) {
      const headerBtns = document.querySelector('#view-user-dashboard .user-dashboard-header div[style*="flex"]');
      if (headerBtns) {
        backBtn = document.createElement('button');
        backBtn.id = 'btn-back-to-admin';
        backBtn.className = 'btn btn--outline';
        backBtn.style.cssText = 'color:#ffffff; border-color:#38bdf8; background:rgba(56, 189, 248, 0.25); font-weight:800;';
        backBtn.innerHTML = '<i class="fas fa-arrow-left"></i> Back to Admin';
        backBtn.onclick = () => {
          document.getElementById('view-user-dashboard').style.display = 'none';
          document.getElementById('view-admin-portal').style.display = 'block';
          renderAdminDashboard();
        };
        headerBtns.prepend(backBtn);
      }
    }
    if (backBtn) backBtn.style.display = 'inline-flex';
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
    if (itemsEl) itemsEl.textContent = profile.deposit_item || 'Vault Custody Consignment';
    if (dateEl) {
      if (profile.date_of_deposit) {
        try {
          const d = new Date(profile.date_of_deposit);
          const day = d.getDate();
          const ord = (day === 1 || day === 21 || day === 31) ? 'st' : (day === 2 || day === 22) ? 'nd' : (day === 3 || day === 23) ? 'rd' : 'th';
          const month = d.toLocaleString('en-GB', { month: 'long' });
          const year = d.getFullYear();
          dateEl.textContent = `${day}${ord} ${month}, ${year}`;
        } catch (e) {
          dateEl.textContent = profile.date_of_deposit;
        }
      } else {
        dateEl.textContent = '2nd May, 2019';
      }
    }
    if (purposeEl) purposeEl.textContent = 'SAFE KEEPING';
    const ownerName = (profile.owner_name || 'Authorized Depositor').trim();
    const benName = (profile.beneficiary_name || 'Designated Beneficiary').trim();
    if (depEl) depEl.textContent = ownerName.toUpperCase();
    if (benEl) benEl.innerHTML = benName.toUpperCase() + '<br><small>(VERIFIED HEIR / BENEFICIARY MANDATE)</small>';
    if (sigDepEl) sigDepEl.textContent = ownerName.toUpperCase();
    const scriptSigDepEl = document.getElementById('cert-render-sig-script-depositor');
    if (scriptSigDepEl) {
      const cleanName = ownerName.replace(/^(engineer|lord|capt\.?|captain|dr\.?|mr\.?|mrs\.?|ms\.?|prof\.?)\s+/i, '');
      scriptSigDepEl.textContent = cleanName;
      if (cleanName.length > 24) {
        scriptSigDepEl.style.fontSize = '1.75rem';
      } else if (cleanName.length > 18) {
        scriptSigDepEl.style.fontSize = '2.05rem';
      } else {
        scriptSigDepEl.style.fontSize = '2.35rem';
      }
    }

    openModal('modal-cert-preview');
  }

  // --- CRUD Modal Actions ---
  function openCreateModal(fromLogin = false) {
    isCreatingFromLogin = Boolean(fromLogin);
    const form = document.getElementById('create-profile-form');
    if (form) form.reset();

    // Reset Avatar Preview
    const previewImg = document.getElementById('create-avatar-preview');
    if (previewImg) previewImg.src = DEFAULT_AVATAR;
    const hiddenUrl = document.getElementById('create-avatar-url');
    if (hiddenUrl) hiddenUrl.value = DEFAULT_AVATAR;
    const fileInput = document.getElementById('create-avatar-file');
    if (fileInput) fileInput.value = '';

    openModal('modal-create-profile');
  }

  async function handleCreateProfile(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    }

    try {
      const data = {
        owner_name: (document.getElementById('create-owner-name')?.value || '').trim(),
        beneficiary_name: (document.getElementById('create-beneficiary-name')?.value || '').trim(),
        username: (document.getElementById('create-username')?.value || '').trim(),
        email: (document.getElementById('create-email')?.value || '').trim(),
        password: document.getElementById('create-password')?.value || 'SecureKey2026!',
        deposit_amount: document.getElementById('create-deposit-amount')?.value || 0,
        deposit_item: (document.getElementById('create-deposit-item')?.value || 'Vault Deposit Item').trim(),
        currency: document.getElementById('create-currency')?.value || 'USD',
        profile_image_url: document.getElementById('create-avatar-url')?.value || DEFAULT_AVATAR,
        context_details: (document.getElementById('create-context-details')?.value || '').trim(),
        status: document.getElementById('create-status')?.value || 'Active'
      };

      const newProfile = await window.PortalData.createProfile(data);
      closeAllModals();

      if (isCreatingFromLogin || !currentUser || currentUser.role !== 'admin') {
        // Authenticate new user and render their dashboard immediately!
        currentUser = newProfile;
        window.PortalData.setSession(newProfile);
        window.syncPortalNavState?.();
        renderViewForUser(newProfile);
        showToast(`Welcome! Your vault mandate account for ${newProfile.beneficiary_name} has been created and verified.`, 'success');
      } else {
        // In Admin View: clear search and filter to ensure newly created profile is visible at the top!
        const searchInput = document.getElementById('admin-search');
        if (searchInput) searchInput.value = '';
        const statusSelect = document.getElementById('admin-status-select');
        if (statusSelect) statusSelect.value = 'ALL';

        renderAdminDashboard();
        showToast(`Profile for ${data.beneficiary_name} created successfully!`, 'success');

        // Smooth scroll and flash highlight newly created profile row
        setTimeout(() => {
          const row = document.querySelector(`tr[data-profile-id="${newProfile.id}"]`);
          if (row) {
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            row.classList.add('row-highlight-new');
            setTimeout(() => row.classList.remove('row-highlight-new'), 3500);
          }
        }, 100);
      }
    } catch (err) {
      showToast(err.message || 'Error creating profile', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
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

    // Set edit avatar preview
    const avatarUrl = profile.profile_image_url || DEFAULT_AVATAR;
    document.getElementById('edit-avatar-url').value = avatarUrl;
    const previewImg = document.getElementById('edit-avatar-preview');
    if (previewImg) previewImg.src = avatarUrl;
    const fileInput = document.getElementById('edit-avatar-file');
    if (fileInput) fileInput.value = '';

    document.getElementById('edit-context-details').value = profile.context_details || '';
    document.getElementById('edit-status').value = profile.status || 'Active';

    openModal('modal-edit-profile');
  }

  async function handleEditProfile(e) {
    e.preventDefault();
    if (!selectedProfileId) return;

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    }

    try {
      const updates = {
        owner_name: document.getElementById('edit-owner-name').value.trim(),
        beneficiary_name: document.getElementById('edit-beneficiary-name').value.trim(),
        username: document.getElementById('edit-username').value.trim(),
        email: document.getElementById('edit-email').value.trim(),
        deposit_amount: document.getElementById('edit-deposit-amount').value,
        deposit_item: document.getElementById('edit-deposit-item').value.trim(),
        currency: document.getElementById('edit-currency').value,
        profile_image_url: document.getElementById('edit-avatar-url').value || DEFAULT_AVATAR,
        context_details: document.getElementById('edit-context-details').value.trim(),
        status: document.getElementById('edit-status').value
      };

      const newPass = document.getElementById('edit-password').value;
      if (newPass) updates.password = newPass;

      await window.PortalData.updateProfile(selectedProfileId, updates);
      closeAllModals();
      showToast('Profile updated successfully!', 'success');
      renderAdminDashboard();
    } catch (err) {
      showToast(err.message || 'Error updating profile', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
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

  function refreshCurrentView() {
    if (!currentUser) return;
    if (currentUser.role === 'admin') {
      renderAdminDashboard();
    } else {
      renderUserDashboard(currentUser.id);
    }
  }

  window.PortalUI = {
    previewDashboard,
    openCreateModal,
    openEditModal,
    openReassignModal,
    openCertModal,
    openCollectionNoticeModal,
    deleteProfile,
    refreshCurrentView
  };

})(window, document);
