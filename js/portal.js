/* ==========================================================================
   MAN Commercial Protection - Portal Controller
   Controls: Login, User Dashboard (Protected), Admin Portal (Restricted)
   ========================================================================== */

(function(window, document) {
  'use strict';

  let currentUser = null;
  let selectedProfileId = null;
  let isCreatingFromLogin = false;
  let createSigPad = null;
  let editSigPad = null;

  const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=180&auto=format&fit=crop&q=80';

  // Client-side image compression & optimization (Canvas max 600x600 JPEG 0.88)
  function compressImageFile(file, maxWidth = 600, maxHeight = 600, quality = 0.88) {
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

  function formatUploadSize(bytes) {
    if (!bytes || bytes <= 0) return '0 KB';
    const kb = bytes / 1024;
    if (kb >= 1024) return (kb / 1024).toFixed(1) + ' MB';
    return Math.round(kb) + ' KB';
  }

  function setupAvatarUpload(fileInputId, hiddenUrlId, previewImgId, clearBtnId, defaultUrl, statusElId, loadingElId) {
    const fileInput = document.getElementById(fileInputId);
    const hiddenUrl = document.getElementById(hiddenUrlId);
    const previewImg = document.getElementById(previewImgId);
    const clearBtn = document.getElementById(clearBtnId);
    const statusEl = statusElId ? document.getElementById(statusElId) : null;
    const loadingEl = loadingElId ? document.getElementById(loadingElId) : null;
    const uploadBox = fileInput?.closest('.avatar-upload-box');

    if (!fileInput) return;

    function setLoading(isLoading) {
      if (loadingEl) {
        if (isLoading) loadingEl.classList.add('is-active');
        else loadingEl.classList.remove('is-active');
      }
    }

    function setStatus(html, isSuccess = true) {
      if (!statusEl) return;
      if (!html) {
        statusEl.style.display = 'none';
        statusEl.innerHTML = '';
        return;
      }
      statusEl.style.display = 'inline-flex';
      statusEl.innerHTML = html;
      if (isSuccess) {
        statusEl.style.color = '#065f46';
        statusEl.style.background = '#ecfdf5';
        statusEl.style.borderColor = '#a7f3d0';
      } else {
        statusEl.style.color = '#b91c1c';
        statusEl.style.background = '#fef2f2';
        statusEl.style.borderColor = '#fecaca';
      }
    }

    async function handleFile(file) {
      if (!file) return;
      setLoading(true);
      try {
        // 1. Optimize image client-side for crisp resolution
        const dataUrl = await compressImageFile(file, 600, 600, 0.88);
        if (previewImg) previewImg.src = dataUrl;

        // 2. Upload to server storage endpoint (/api/upload)
        let finalUrl = dataUrl;
        let savedOnServer = false;
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: dataUrl, filename: file.name })
          });
          if (res.ok) {
            const result = await res.json();
            if (result && result.success && result.url) {
              finalUrl = result.url;
              savedOnServer = true;
            }
          }
        } catch (netErr) {
          console.warn('[Avatar Upload] Server upload network error, using client fallback:', netErr);
        }

        hiddenUrl.value = finalUrl;
        if (previewImg && savedOnServer) {
          previewImg.src = finalUrl;
        }

        const sizeLabel = formatUploadSize(file.size);
        const fileName = (file.name || 'image.jpg').substring(0, 24);
        const badgeMsg = savedOnServer
          ? `<i class="fas fa-check-circle"></i> Saved on server: <strong>${escapeHtml(fileName)}</strong> (${sizeLabel})`
          : `<i class="fas fa-check-circle"></i> Optimized: <strong>${escapeHtml(fileName)}</strong> (${sizeLabel})`;

        setStatus(badgeMsg, true);
        showToast(savedOnServer ? 'Image saved to server successfully!' : 'Image optimized successfully!', 'success');
      } catch (err) {
        setStatus('<i class="fas fa-circle-exclamation" style="color:#ef4444;"></i> ' + escapeHtml(err.message || 'Image processing failed'), false);
        showToast(err.message || 'Image upload failed', 'error');
      } finally {
        setLoading(false);
      }
    }

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      handleFile(file);
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.value = '';
        hiddenUrl.value = defaultUrl;
        if (previewImg) previewImg.src = defaultUrl;
        setStatus('');
        showToast('Avatar reset to default.', 'info');
      });
    }

    if (uploadBox) {
      // Clicking empty area of the box triggers file picker
      uploadBox.addEventListener('click', (e) => {
        if (e.target.closest('button, input, a, .avatar-btn-row')) return;
        fileInput.click();
      });

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

  // ==========================================================================
  // High-Precision HTML5 Canvas Signature Pad (Real Legal Signature Engine)
  // ==========================================================================
  class CanvasSignaturePad {
    constructor({ canvasId, containerId, statusId, errorId, hiddenInputId, clearBtnId, typeBtnId, getNameFn }) {
      this.canvasId = canvasId;
      this.canvas = document.getElementById(canvasId);
      this.container = document.getElementById(containerId);
      this.statusEl = statusId ? document.getElementById(statusId) : null;
      this.errorEl = errorId ? document.getElementById(errorId) : null;
      this.hiddenInput = hiddenInputId ? document.getElementById(hiddenInputId) : null;
      this.clearBtn = clearBtnId ? document.getElementById(clearBtnId) : null;
      this.typeBtn = typeBtnId ? document.getElementById(typeBtnId) : null;
      this.getNameFn = getNameFn;

      this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
      this.isDrawing = false;
      this.points = [];
      this.strokeCount = 0;
      this.isSigned = false;

      if (this.canvas) {
        this.initCanvas();
        this.initEvents();
      }
    }

    initCanvas() {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width > 50 ? rect.width : 560;
      const height = rect.height > 30 ? rect.height : 140;

      this.canvas.width = Math.round(width * dpr);
      this.canvas.height = Math.round(height * dpr);
      this.ctx = this.canvas.getContext('2d');
      if (this.ctx.resetTransform) {
        this.ctx.resetTransform();
      } else {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      this.ctx.scale(dpr, dpr);

      this.ctx.strokeStyle = '#0e387a'; // Executive blue ink
      this.ctx.lineWidth = 2.4;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
    }

    initEvents() {
      if (!this.canvas) return;
      this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
      this.canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
      this.canvas.addEventListener('pointerup', (e) => this.onPointerUp(e));
      this.canvas.addEventListener('pointercancel', (e) => this.onPointerUp(e));

      this.clearBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.clear();
      });

      this.typeBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.typeSignature();
      });

      // Window resize re-scaling check
      window.addEventListener('resize', () => {
        if (!this.isEmpty()) {
          const data = this.hiddenInput ? this.hiddenInput.value : '';
          this.initCanvas();
          if (data) this.loadSignature(data);
        } else {
          this.initCanvas();
        }
      });
    }

    getPos(e) {
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }

    onPointerDown(e) {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      if (this.canvas.width !== Math.round((rect.width || 560) * dpr)) {
        this.initCanvas();
      }

      this.isDrawing = true;
      try {
        this.canvas.setPointerCapture(e.pointerId);
      } catch (err) {}

      const pos = this.getPos(e);
      this.points = [pos];
      this.strokeCount++;
      this.clearError();
    }

    onPointerMove(e) {
      if (!this.isDrawing) return;
      const pos = this.getPos(e);
      this.points.push(pos);

      if (this.points.length > 2) {
        const p1 = this.points[this.points.length - 2];
        const p2 = this.points[this.points.length - 1];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
        this.ctx.stroke();
      } else {
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, 1.2, 0, Math.PI * 2);
        this.ctx.fillStyle = '#0e387a';
        this.ctx.fill();
      }
    }

    onPointerUp(e) {
      if (!this.isDrawing) return;
      this.isDrawing = false;
      try {
        this.canvas.releasePointerCapture(e.pointerId);
      } catch (err) {}

      if (this.strokeCount > 0) {
        this.isSigned = true;
        const dataUrl = this.canvas.toDataURL('image/png');
        if (this.hiddenInput) this.hiddenInput.value = dataUrl;
        this.updateStatus(true);
        this.clearError();
      }
    }

    typeSignature(customName) {
      this.clear();
      this.initCanvas();

      let name = customName;
      if (!name && typeof this.getNameFn === 'function') {
        name = this.getNameFn();
      }
      if (!name || !name.trim()) {
        name = prompt('Enter depositor or account owner legal name to adopt signature:') || '';
      }
      name = (name || '').trim();
      if (!name) return;

      const rect = this.canvas.getBoundingClientRect();
      const w = rect.width || 560;
      const h = rect.height || 140;

      this.ctx.save();
      this.ctx.font = 'italic 700 44px "Alex Brush", "Great Vibes", cursive';
      this.ctx.fillStyle = '#0e387a';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      this.ctx.translate(w / 2, h / 2 + 5);
      this.ctx.rotate(-2.5 * Math.PI / 180);
      this.ctx.fillText(name, 0, 0);

      // Calligraphic flourish underline
      const textWidth = Math.min(this.ctx.measureText(name).width, w - 60);
      const startX = -textWidth / 2 - 12;
      const endX = textWidth / 2 + 20;
      this.ctx.beginPath();
      this.ctx.moveTo(startX, 18);
      this.ctx.quadraticCurveTo(startX + 40, 26, 0, 22);
      this.ctx.quadraticCurveTo(endX - 30, 16, endX, 22);
      this.ctx.lineWidth = 2.0;
      this.ctx.strokeStyle = '#0e387a';
      this.ctx.stroke();

      this.ctx.restore();

      this.strokeCount = 10;
      this.isSigned = true;
      const dataUrl = this.canvas.toDataURL('image/png');
      if (this.hiddenInput) this.hiddenInput.value = dataUrl;
      this.updateStatus(true, 'Typed Signature Adopted');
      this.clearError();
    }

    clear() {
      if (!this.canvas) return;
      const dpr = window.devicePixelRatio || 1;
      this.ctx.clearRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr);
      this.points = [];
      this.strokeCount = 0;
      this.isSigned = false;
      if (this.hiddenInput) this.hiddenInput.value = '';
      this.updateStatus(false);
      this.clearError();
    }

    loadSignature(dataUrl) {
      this.clear();
      if (!dataUrl) return;
      if (this.hiddenInput) this.hiddenInput.value = dataUrl;
      this.isSigned = true;
      this.strokeCount = 10;
      this.updateStatus(true, 'Active Signature on File');

      const img = new Image();
      img.onload = () => {
        this.initCanvas();
        const rect = this.canvas.getBoundingClientRect();
        const w = rect.width || 560;
        const h = rect.height || 140;
        const scale = Math.min((w - 40) / img.width, (h - 20) / img.height, 1);
        const dw = img.width * scale;
        const dh = img.height * scale;
        const dx = (w - dw) / 2;
        const dy = (h - dh) / 2;
        this.ctx.drawImage(img, dx, dy, dw, dh);
      };
      img.src = dataUrl;
    }

    updateStatus(signed, text) {
      if (!this.statusEl) return;
      if (signed) {
        this.statusEl.className = 'sig-status-badge is-signed';
        this.statusEl.innerHTML = `<i class="fas fa-check-circle" style="color:#059669;"></i> ${text || 'Signature Captured'}`;
      } else {
        this.statusEl.className = 'sig-status-badge';
        this.statusEl.innerHTML = `<i class="fas fa-pen-nib"></i> Signature required`;
      }
    }

    clearError() {
      if (this.container) this.container.classList.remove('has-error');
      if (this.errorEl) this.errorEl.style.display = 'none';
    }

    showError(msg) {
      if (this.container) this.container.classList.add('has-error');
      if (this.errorEl) {
        if (msg) this.errorEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${msg}`;
        this.errorEl.style.display = 'flex';
      }
    }

    isEmpty() {
      const val = this.hiddenInput ? this.hiddenInput.value.trim() : '';
      return !this.isSigned || !val || this.strokeCount === 0;
    }

    validate() {
      if (this.isEmpty()) {
        this.showError('Depositor signature is mandatory to register and validate a custody vault mandate account.');
        return false;
      }
      this.clearError();
      return true;
    }

    getData() {
      return this.hiddenInput ? this.hiddenInput.value : '';
    }
  }

  // Clean up trailing '?' if arriving from native GET submission
  if (window.location.search === '?' || (window.location.search === '' && window.location.href.endsWith('?'))) {
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initPortal();
      bindEvents();
    });
  } else {
    initPortal();
    bindEvents();
  }

  function initPortal() {
    currentUser = window.PortalData.getSession();
    if (currentUser) {
      renderViewForUser(currentUser);
    } else {
      showLoginView();
    }
  }

  function bindEvents() {
    // 1. Bind Login form FIRST to ensure authentication always works regardless of sub-components
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
    }

    // 2. Logout buttons
    document.querySelectorAll('.btn-portal-logout').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.PortalData.logout();
        currentUser = null;
        showLoginView();
        showToast('Logged out successfully.', 'info');
      });
    });

    // 3. Admin Search & Filters
    const searchInput = document.getElementById('admin-search');
    const statusSelect = document.getElementById('admin-status-select');

    searchInput?.addEventListener('input', () => {
      renderAdminTable();
    });

    statusSelect?.addEventListener('change', () => {
      renderAdminTable();
    });

    // 4. Setup Avatar Uploaders (wrapped in try-catch)
    try {
      setupAvatarUpload('create-avatar-file', 'create-avatar-url', 'create-avatar-preview', 'btn-create-clear-avatar', DEFAULT_AVATAR, 'create-avatar-status', 'create-avatar-loading');
      setupAvatarUpload('edit-avatar-file', 'edit-avatar-url', 'edit-avatar-preview', 'btn-edit-clear-avatar', DEFAULT_AVATAR, 'edit-avatar-status', 'edit-avatar-loading');
    } catch (err) {
      console.warn('Avatar uploader setup failed:', err);
    }

    // 5. Setup Signature Pads (wrapped in try-catch)
    try {
      createSigPad = new CanvasSignaturePad({
        canvasId: 'create-signature-canvas',
        containerId: 'create-signature-container',
        statusId: 'create-sig-status',
        errorId: 'create-sig-error',
        hiddenInputId: 'create-signature-data',
        clearBtnId: 'btn-create-clear-sig',
        typeBtnId: 'btn-create-type-sig',
        getNameFn: () => document.getElementById('create-owner-name')?.value || document.getElementById('create-beneficiary-name')?.value || ''
      });

      editSigPad = new CanvasSignaturePad({
        canvasId: 'edit-signature-canvas',
        containerId: 'edit-signature-container',
        statusId: 'edit-sig-status',
        errorId: null,
        hiddenInputId: 'edit-signature-data',
        clearBtnId: 'btn-edit-clear-sig',
        typeBtnId: 'btn-edit-type-sig',
        getNameFn: () => document.getElementById('edit-owner-name')?.value || document.getElementById('edit-beneficiary-name')?.value || ''
      });
    } catch (err) {
      console.warn('Signature pad setup failed:', err);
    }

    // Redraw signature button in edit modal
    document.getElementById('btn-edit-redraw-sig')?.addEventListener('click', (e) => {
      e.preventDefault();
      const currentPreview = document.getElementById('edit-sig-current-preview');
      const interactiveWrap = document.getElementById('edit-sig-interactive-wrap');
      if (currentPreview) currentPreview.style.display = 'none';
      if (interactiveWrap) interactiveWrap.style.display = 'block';
      if (editSigPad) {
        editSigPad.clear();
        editSigPad.initCanvas();
      }
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
    if (e && e.stopPropagation) e.stopPropagation();

    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    const identifier = (usernameInput?.value || '').trim();
    const password = (passwordInput?.value || '').trim();
    const errBox = document.getElementById('login-error-alert');
    const submitBtn = document.getElementById('btn-login-submit') || document.querySelector('#login-form button[type="submit"]');

    if (errBox) {
      errBox.style.display = 'none';
      errBox.textContent = '';
    }

    if (!identifier || !password) {
      if (errBox) {
        errBox.textContent = 'Please enter your username or email address and password.';
        errBox.style.display = 'block';
      }
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
    }

    try {
      const res = await window.PortalData.authenticate(identifier, password);
      if (res.success) {
        currentUser = res.user;
        const displayName = res.user.role === 'admin'
          ? 'Administrator'
          : (res.user.beneficiary_name || res.user.owner_name || res.user.username || 'Client');
        showToast(`Welcome back, ${displayName}!`, 'success');
        window.syncPortalNavState?.();
        renderViewForUser(currentUser);
      } else {
        if (errBox) {
          errBox.textContent = res.message || 'Invalid username/email or password.';
          errBox.style.display = 'block';
        }
        showToast(res.message || 'Invalid credentials.', 'error');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (errBox) {
        errBox.textContent = 'A connection error occurred. Please try again.';
        errBox.style.display = 'block';
      }
      showToast('Authentication error. Please try again.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
      }
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
      renderUserDashboard(user.id || user.auth_user_id);
    }
  }

  // --- Protected User Dashboard Component ---
  function renderUserDashboard(profileId) {
    const profile = window.PortalData.getProfileById(profileId) || 
      (currentUser && (currentUser.id === profileId || currentUser.auth_user_id === profileId || currentUser.username) ? currentUser : null);
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

    // Render Legal Signature in User Dashboard
    const sigRenderEl = document.getElementById('user-dash-sig-render');
    const sigBadgeEl = document.getElementById('user-dash-sig-badge');
    if (sigRenderEl) {
      if (profile.signature && (profile.signature.startsWith('data:image') || profile.signature.startsWith('http') || profile.signature.startsWith('/'))) {
        sigRenderEl.innerHTML = `<img src="${profile.signature}" alt="Depositor Signature" style="max-height:46px; max-width:210px; object-fit:contain; filter:contrast(1.2);">`;
        if (sigBadgeEl) {
          sigBadgeEl.className = 'badge-sig-verified';
          sigBadgeEl.innerHTML = '<i class="fas fa-shield-check"></i> Digital Signature on File';
        }
      } else {
        sigRenderEl.innerHTML = `<span style="font-family:'Alex Brush','Great Vibes',cursive; font-size:1.8rem; color:#0e387a;">${escapeHtml(profile.owner_name || 'Verified Signatory')}</span>`;
        if (sigBadgeEl) {
          sigBadgeEl.className = 'badge-sig-verified';
          sigBadgeEl.innerHTML = '<i class="fas fa-check-circle"></i> Mandate Signatory Verified';
        }
      }
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
    const certSigImg = document.getElementById('cert-render-sig-img');
    const scriptSigDepEl = document.getElementById('cert-render-sig-script-depositor');
    const svgUnderline = document.getElementById('cert-render-sig-svg-underline');

    if (profile.signature && (profile.signature.startsWith('data:image') || profile.signature.startsWith('http') || profile.signature.startsWith('/'))) {
      if (certSigImg) {
        certSigImg.src = profile.signature;
        certSigImg.style.display = 'block';
      }
      if (scriptSigDepEl) scriptSigDepEl.style.display = 'none';
      if (svgUnderline) svgUnderline.style.display = 'none';
    } else {
      if (certSigImg) certSigImg.style.display = 'none';
      if (scriptSigDepEl) {
        scriptSigDepEl.style.display = 'inline-block';
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
      if (svgUnderline) svgUnderline.style.display = 'block';
    }

    openModal('modal-cert-preview');
  }

  // --- CRUD Modal Actions ---
  function openCreateModal(fromLogin = false) {
    isCreatingFromLogin = Boolean(fromLogin);
    const form = document.getElementById('create-profile-form');
    if (form) form.reset();

    // Reset Avatar Preview & status
    const previewImg = document.getElementById('create-avatar-preview');
    if (previewImg) previewImg.src = DEFAULT_AVATAR;
    const hiddenUrl = document.getElementById('create-avatar-url');
    if (hiddenUrl) hiddenUrl.value = DEFAULT_AVATAR;
    const fileInput = document.getElementById('create-avatar-file');
    if (fileInput) fileInput.value = '';
    const statusEl = document.getElementById('create-avatar-status');
    if (statusEl) {
      statusEl.style.display = 'none';
      statusEl.innerHTML = '';
    }
    const loadingEl = document.getElementById('create-avatar-loading');
    if (loadingEl) loadingEl.classList.remove('is-active');

    openModal('modal-create-profile');

    // Resize and prepare signature canvas once modal becomes visible
    setTimeout(() => {
      if (createSigPad) {
        createSigPad.clear();
        createSigPad.initCanvas();
      }
    }, 60);
  }

  async function handleCreateProfile(e) {
    e.preventDefault();

    // Real Mandatory Signature Validation
    if (createSigPad && !createSigPad.validate()) {
      showToast('Depositor signature is required to register a vault mandate account.', 'error');
      const sigContainer = document.getElementById('create-signature-container');
      if (sigContainer) sigContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving to Database...';
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
        signature: createSigPad ? createSigPad.getData() : (document.getElementById('create-signature-data')?.value || ''),
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
        showToast(`Welcome! Your vault mandate account for ${newProfile.beneficiary_name} has been created and verified in database.`, 'success');
      } else {
        // In Admin View: clear search and filter to ensure newly created profile is visible at the top!
        const searchInput = document.getElementById('admin-search');
        if (searchInput) searchInput.value = '';
        const statusSelect = document.getElementById('admin-status-select');
        if (statusSelect) statusSelect.value = 'ALL';

        renderAdminDashboard();
        showToast(`Profile for ${data.beneficiary_name} created and saved in database successfully!`, 'success');

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
      showToast(err.message || 'Error creating profile in database', 'error');
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
    const statusEl = document.getElementById('edit-avatar-status');
    if (statusEl) {
      if (avatarUrl && avatarUrl !== DEFAULT_AVATAR) {
        statusEl.style.display = 'inline-flex';
        statusEl.innerHTML = avatarUrl.startsWith('/assets/uploads')
          ? '<i class="fas fa-check-circle" style="color:#059669;"></i> Stored on server'
          : '<i class="fas fa-image" style="color:#059669;"></i> Active custom photo';
      } else {
        statusEl.style.display = 'none';
        statusEl.innerHTML = '';
      }
    }
    const loadingEl = document.getElementById('edit-avatar-loading');
    if (loadingEl) loadingEl.classList.remove('is-active');

    // Populate signature state for editing
    const sigData = profile.signature || '';
    const currentPreview = document.getElementById('edit-sig-current-preview');
    const interactiveWrap = document.getElementById('edit-sig-interactive-wrap');
    const previewSigImg = document.getElementById('edit-sig-preview-img');
    const hiddenSig = document.getElementById('edit-signature-data');
    if (hiddenSig) hiddenSig.value = sigData;

    if (sigData && (sigData.startsWith('data:image') || sigData.startsWith('http') || sigData.startsWith('/'))) {
      if (currentPreview) currentPreview.style.display = 'flex';
      if (interactiveWrap) interactiveWrap.style.display = 'none';
      if (previewSigImg) previewSigImg.src = sigData;
      editSigPad?.updateStatus(true, 'Active Signature on File');
    } else {
      if (currentPreview) currentPreview.style.display = 'none';
      if (interactiveWrap) interactiveWrap.style.display = 'block';
      setTimeout(() => {
        if (editSigPad) {
          editSigPad.clear();
          editSigPad.initCanvas();
        }
      }, 60);
    }

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
        signature: document.getElementById('edit-signature-data')?.value || '',
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
    handleLogin,
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
