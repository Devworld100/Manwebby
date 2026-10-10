/* ============================================
   MAN Commercial Protection - Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initHeroSlider();
  initStatsCounter();
  initTestimonialSlider();
  initScrollToTop();
  initStickyHeader();
  initSmoothScroll();
  initDropdownMobile();
});

/* --- Mobile Navigation --- */
function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const navList = document.querySelector('.nav__list') || document.querySelector('.nav');
  const overlay = document.querySelector('.nav-overlay');

  if (!toggle || !navList) return;

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    navList.classList.toggle('active');
    overlay?.classList.toggle('active');
    document.body.style.overflow = navList.classList.contains('active') ? 'hidden' : '';
  });

  overlay?.addEventListener('click', () => {
    toggle.classList.remove('active');
    navList.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  });
}

/* --- Dropdown on Mobile (click toggle on caret, allow direct link clicks) --- */
function initDropdownMobile() {
  const items = document.querySelectorAll('.nav__item');

  items.forEach(item => {
    const link = item.querySelector('.nav__link');
    const caret = item.querySelector('.caret');
    const dropdown = item.querySelector('.dropdown') || item.querySelector('.mega-menu');

    if (!dropdown || !link) return;

    if (caret) {
      caret.style.cursor = 'pointer';
      caret.style.padding = '6px 8px';
      caret.addEventListener('click', (e) => {
        if (window.innerWidth <= 1024) {
          e.preventDefault();
          e.stopPropagation();
          item.classList.toggle('dropdown-open');
        }
      });
    }
  });
}

/* --- Hero Slider --- */
function initHeroSlider() {
  const slider = document.querySelector('.hero__slider');
  if (!slider) return;

  const slides = slider.querySelectorAll('.hero__slide');
  const dots = document.querySelectorAll('.hero__dot');
  const prevBtn = document.querySelector('.hero__arrow--prev');
  const nextBtn = document.querySelector('.hero__arrow--next');

  if (slides.length <= 1) return;

  const SLIDE_INTERVAL = 4500; // Optimal 4.5s slide interval
  let currentSlide = 0;
  let autoPlayInterval;

  function goToSlide(index) {
    slides.forEach(s => {
      s.classList.remove('active');
      const v = s.querySelector('video');
      if (v) {
        v.pause();
      }
    });

    currentSlide = (index + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');

    const activeVideo = slides[currentSlide].querySelector('video');
    if (activeVideo) {
      activeVideo.muted = true;
      if (activeVideo.readyState === 0) {
        activeVideo.load();
      }
      activeVideo.currentTime = 0;
      const playPromise = activeVideo.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    }

    dots.forEach((d, i) => {
      d.classList.toggle('active', i === currentSlide);
    });
  }

  function nextSlide() {
    goToSlide(currentSlide + 1);
  }

  function prevSlide() {
    goToSlide(currentSlide - 1);
  }

  function startAutoPlay() {
    clearInterval(autoPlayInterval);
    autoPlayInterval = setInterval(nextSlide, SLIDE_INTERVAL);
  }

  function stopAutoPlay() {
    clearInterval(autoPlayInterval);
  }

  // Dot clicks
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      stopAutoPlay();
      goToSlide(i);
      startAutoPlay();
    });
  });

  // Arrow clicks
  prevBtn?.addEventListener('click', () => {
    stopAutoPlay();
    prevSlide();
    startAutoPlay();
  });

  nextBtn?.addEventListener('click', () => {
    stopAutoPlay();
    nextSlide();
    startAutoPlay();
  });

  // Touch/swipe support
  let touchStartX = 0;
  let touchEndX = 0;

  slider.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  slider.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      stopAutoPlay();
      if (diff > 0) nextSlide();
      else prevSlide();
      startAutoPlay();
    }
  }, { passive: true });

  // Initialize
  goToSlide(0);
  startAutoPlay();

  // Pause on hover over entire hero
  const heroSection = document.querySelector('.hero') || slider;
  heroSection.addEventListener('mouseenter', stopAutoPlay);
  heroSection.addEventListener('mouseleave', startAutoPlay);

  // Pause/resume when tab switches
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAutoPlay();
    } else {
      startAutoPlay();
    }
  });
}

/* --- Stats Counter Animation --- */
function initStatsCounter() {
  const counters = document.querySelectorAll('.stat-item__number');
  if (counters.length === 0) return;

  let animated = false;

  function animateCounters() {
    if (animated) return;

    const firstCounter = counters[0];
    const rect = firstCounter.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    if (rect.top < windowHeight * 0.85) {
      animated = true;

      counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target')) || 0;
        const suffix = counter.getAttribute('data-suffix') || '';
        const prefix = counter.getAttribute('data-prefix') || '';
        const duration = 2000;
        const start = 0;
        const startTime = performance.now();

        function updateCounter(currentTime) {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Ease out cubic
          const easeOut = 1 - Math.pow(1 - progress, 3);
          const current = Math.round(start + (target - start) * easeOut);

          counter.textContent = prefix + current.toLocaleString() + suffix;

          if (progress < 1) {
            requestAnimationFrame(updateCounter);
          }
        }

        requestAnimationFrame(updateCounter);
      });
    }
  }

  window.addEventListener('scroll', animateCounters, { passive: true });
  animateCounters(); // Check on load
}

/* --- Testimonial Slider --- */
function initTestimonialSlider() {
  const slides = document.querySelectorAll('.testimonial-slide');
  const dots = document.querySelectorAll('.testimonial-dot');

  if (slides.length === 0) return;

  let current = 0;
  let interval;

  function goTo(index) {
    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
    if (dots[current]) dots[current].classList.add('active');
  }

  function startAuto() {
    interval = setInterval(() => goTo(current + 1), 6000);
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      clearInterval(interval);
      goTo(i);
      startAuto();
    });
  });

  goTo(0);
  startAuto();
}

/* --- Scroll to Top --- */
function initScrollToTop() {
  const btn = document.querySelector('.scroll-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* --- Sticky Header --- */
function initStickyHeader() {
  const header = document.querySelector('.header');
  if (!header) return;

  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;

    if (currentScroll > 100) {
      header.style.boxShadow = 'var(--shadow-lg)';
    } else {
      header.style.boxShadow = 'var(--shadow-md)';
    }

    lastScroll = currentScroll;
  }, { passive: true });
}

/* --- Smooth Scroll for Anchor Links --- */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}
