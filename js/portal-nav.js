/* ==========================================================================
   MAN Commercial Protection - Global Nav Session Sync
   Synchronizes the TopNav and TopBar auth state across all website pages.
   ========================================================================== */

(function(window, document) {
  'use strict';

  const SESSION_KEY = 'mcp_portal_active_session_v2';

  function getActiveSession() {
    try {
      const s = sessionStorage.getItem(SESSION_KEY);
      if (s) return JSON.parse(s);
    } catch (e) {}
    return null;
  }

  function syncNavAuthState() {
    const user = getActiveSession();

    // 1. TopNav Link Update (e.g. "Login" -> "Dashboard / Admin Console")
    const navLinks = document.querySelectorAll('.nav__link[href*="login"]');
    navLinks.forEach(link => {
      if (user) {
        if (user.role === 'admin') {
          link.innerHTML = '<i class="fas fa-user-shield" style="margin-right:4px; color:#c8a951;"></i> Admin Console';
        } else {
          link.innerHTML = `<i class="fas fa-user-circle" style="margin-right:4px; color:#c8a951;"></i> ${escapeHtml(user.beneficiary_name || user.owner_name)} <span style="font-size:0.68rem; background:#c8a951; color:#0f1923; padding:1px 5px; border-radius:3px; font-weight:800; vertical-align:middle; margin-left:3px;">ACTIVE</span>`;
        }
        link.style.color = '#c8a951';
        link.style.fontWeight = '700';
      } else {
        link.innerHTML = 'Login';
        link.style.color = '';
        link.style.fontWeight = '';
      }
    });

    // 2. TopBar Button Update
    const topbarBtns = document.querySelectorAll('.topbar__login-btn');
    topbarBtns.forEach(btn => {
      if (btn.id === 'global-nav-logout') return; // skip logout btn

      if (user) {
        const displayName = user.role === 'admin' ? 'ADMIN CONSOLE' : (user.beneficiary_name || user.owner_name || 'DASHBOARD').toUpperCase();
        btn.innerHTML = `<i class="fas ${user.role === 'admin' ? 'fa-user-shield' : 'fa-user-check'}"></i> ${escapeHtml(displayName)}`;
        btn.style.background = '#c8a951';
        btn.style.color = '#0f1923';
        btn.style.fontWeight = '800';

        // Add adjacent quick logout button if not already present
        if (!document.getElementById('global-nav-logout') && btn.parentNode) {
          const logoutBtn = document.createElement('a');
          logoutBtn.id = 'global-nav-logout';
          logoutBtn.className = 'topbar__login-btn';
          logoutBtn.href = '#';
          logoutBtn.title = 'Logout from portal';
          logoutBtn.style.borderColor = '#cb0019';
          logoutBtn.style.color = '#ffffff';
          logoutBtn.style.background = '#cb0019';
          logoutBtn.style.marginLeft = '5px';
          logoutBtn.innerHTML = '<i class="fas fa-power-off"></i>';
          logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            try { sessionStorage.removeItem(SESSION_KEY); } catch(err){}
            window.location.href = 'login.html';
          });
          btn.parentNode.appendChild(logoutBtn);
        }
      } else {
        btn.innerHTML = '<i class="fas fa-lock"></i> LOGIN';
        btn.style.background = 'transparent';
        btn.style.color = '#c8a951';
        btn.style.fontWeight = '700';
        const logoutBtn = document.getElementById('global-nav-logout');
        if (logoutBtn) logoutBtn.remove();
      }
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  window.syncPortalNavState = syncNavAuthState;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncNavAuthState);
  } else {
    syncNavAuthState();
  }

  /* Keep the public navigation aligned with the site's real information
     architecture.  The detail screen is shared so every menu item has a
     complete destination rather than an empty hash link. */
  const detailLinks = {
    'about.html#history': 'details.html?page=history',
    'about.html#leadership': 'details.html?page=ceo-message',
    'about.html#accreditations': 'details.html?page=accreditations',
    'about.html#esg': 'details.html?page=esg',
    'services.html#event': 'details.html?page=event-security',
    'services.html#concierge': 'details.html?page=concierge-security',
    'services.html#cctv': 'details.html?page=cctv-monitoring',
    'services.html#systems': 'details.html?page=systems-solutions',
    'services.html#keyholding': 'details.html?page=keyholding-alarm-response',
    'services.html#manned': 'details.html?page=manned-guarding',
    'sectors.html#corporate': 'details.html?page=corporate-concierge',
    'sectors.html#retail': 'details.html?page=retail',
    'sectors.html#manufacturing': 'details.html?page=manufacturing',
    'sectors.html#public': 'details.html?page=public-sector',
    'sectors.html#logistics': 'details.html?page=logistics-distribution',
    'clients.html#testimonials': 'details.html?page=client-testimonials',
    'clients.html#sunseeker': 'details.html?page=client-partnerships',
    'clients.html#cfo': 'details.html?page=client-partnerships',
    'news.html#blog': 'details.html?page=security-insights',
    'training.html#academy': 'details.html?page=training-courses',
    'training.html#sia': 'details.html?page=training-courses',
    'training.html#first-aid': 'details.html?page=training-courses',
    'training.html#booking': 'details.html?page=training-courses'
  };

  function connectDetailLinks() {
    document.querySelectorAll('a[href]').forEach(link => {
      const destination = detailLinks[link.getAttribute('href')];
      if (destination) link.setAttribute('href', destination);

      if (link.getAttribute('href') === '#') {
        const label = (link.textContent || '').replace(/›/g, '').trim().toLowerCase();
        if (label.includes('book a course') || label === 'training' || label.includes('training courses')) {
          link.setAttribute('href', 'details.html?page=training-courses');
        } else if (label === 'clients') {
          link.setAttribute('href', 'clients.html');
        } else if (label === 'news') {
          link.setAttribute('href', 'news.html');
        } else if (label.includes('privacy') || label.includes('terms')) {
          link.setAttribute('href', 'details.html?page=policies');
        } else if (label.includes('event security')) {
          link.setAttribute('href', 'details.html?page=event-security');
        } else if (label.includes('keyholding')) {
          link.setAttribute('href', 'details.html?page=keyholding-alarm-response');
        } else if (label.includes('concierge')) {
          link.setAttribute('href', 'details.html?page=concierge-security');
        } else if (label.includes('manned')) {
          link.setAttribute('href', 'details.html?page=manned-guarding');
        } else if (label.includes('cctv')) {
          link.setAttribute('href', 'details.html?page=cctv-monitoring');
        }
      }
    });

    // Keep public service pages focused on MAN security services.
    document.querySelectorAll('.card, .feature-item').forEach(node => {
      if (/vault|beneficiary|certificate of deposit|demurrage/i.test(node.textContent)) node.remove();
    });

    buildEditorialMenus();
  }

  function editorialLink(href, label) {
    return `<a class="mega-menu__link" href="${href}">${label}</a>`;
  }

  function buildEditorialMenus() {
    const aboutItem = Array.from(document.querySelectorAll('.nav__item')).find(item => item.querySelector('.nav__link[href="about.html"]'));
    const aboutList = aboutItem?.querySelector('.dropdown');
    if (aboutItem && aboutList && !aboutItem.querySelector('.mega-menu--about')) {
      aboutItem.classList.add('has-mega');
      const aboutMenu = document.createElement('div');
      aboutMenu.className = 'mega-menu mega-menu--about';
      aboutMenu.innerHTML = `
        <div class="mega-menu__group"><h3 class="mega-menu__heading">About MAN</h3>
          ${editorialLink('details.html?page=ceo-message', 'Welcome From Our Chief Executive Officer, Iain McCallister')}
          ${editorialLink('details.html?page=history', 'History')}
          ${editorialLink('details.html?page=accreditations', 'Accreditations & Certifications')}
          ${editorialLink('details.html?page=policies', 'Policies')}
          ${editorialLink('careers.html', 'Careers')}</div>
        <div class="mega-menu__group"><h3 class="mega-menu__heading">Media</h3>
          ${editorialLink('news.html', 'Gallery')}
          ${editorialLink('news.html', 'In The Press')}
          ${editorialLink('news.html', 'Video Gallery')}</div>
        <div class="mega-menu__group"><h3 class="mega-menu__heading">The Company</h3>
          ${editorialLink('details.html?page=company-awards', 'Employee Of The Month')}
          ${editorialLink('details.html?page=company-awards', 'Outstanding Act Awards')}
          ${editorialLink('details.html?page=ethics-values', 'Ethics And Values')}
          ${editorialLink('details.html?page=esg', 'Environmental, Social And Governance (ESG)')}
          ${editorialLink('details.html?page=employee-stories', 'Employee Testimonials')}</div>`;
      aboutList.replaceWith(aboutMenu);
    }

    const sectorItem = Array.from(document.querySelectorAll('.nav__item')).find(item => item.querySelector('.nav__link[href="sectors.html"]'));
    const sectorList = sectorItem?.querySelector('.dropdown');
    if (sectorItem && sectorList && !sectorItem.querySelector('.mega-menu--sectors')) {
      sectorItem.classList.add('has-mega');
      const sectorMenu = document.createElement('div');
      sectorMenu.className = 'mega-menu mega-menu--sectors';
      sectorMenu.innerHTML = [
        ['Corporate & Concierge', 'corporate-concierge'],
        ['Retail', 'retail'],
        ['Manufacturing Sector', 'manufacturing'],
        ['Public Sector', 'public-sector'],
        ['Logistics & Distribution', 'logistics-distribution']
      ].map(([label, id]) => `<div class="mega-menu__group"><h3 class="mega-menu__heading">${label}</h3>${editorialLink(`details.html?page=${id}`, `Explore ${label}`)}</div>`).join('');
      sectorList.replaceWith(sectorMenu);
    }

    document.querySelectorAll('.nav__item').forEach(item => {
      if (item.querySelector('.mega-menu')) {
        item.classList.add('has-mega');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', connectDetailLinks);
  } else {
    connectDetailLinks();
  }

})(window, document);
