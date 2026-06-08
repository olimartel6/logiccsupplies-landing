/* ============================================
   FA FINITION — Minimal interactions
   Lightweight only: IO-driven, no scroll loops.
   Pattern: demo-oregard-esthetique
   ============================================ */

(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Remove curtain immediately ---- */
  const curtain = document.getElementById('curtain');
  if (curtain) {
    if (reduced) {
      curtain.remove();
    } else {
      requestAnimationFrame(() => {
        curtain.classList.add('is-gone');
        setTimeout(() => { curtain.remove(); }, 800);
      });
    }
  }
  document.documentElement.classList.remove('is-curtain');
  document.body.classList.remove('is-curtain');

  /* ---- Mark body as loaded so CSS reveals trigger ---- */
  requestAnimationFrame(() => {
    document.body.classList.add('is-loaded');
  });

  /* ---- Sticky nav + sticky CTA bar + progress bar (single passive scroll listener) ---- */
  const nav = document.getElementById('nav');
  const ctaBar = document.getElementById('mobileCtaBar');
  const hero = document.getElementById('hero');
  const bar = document.getElementById('scrollProgress');
  let scrolled = false;
  let ctaShown = false;
  let ticking = false;

  function onScroll() {
    const y = window.scrollY;
    const isScrolled = y > 30;
    if (nav && isScrolled !== scrolled) {
      scrolled = isScrolled;
      nav.classList.toggle('is-scrolled', isScrolled);
    }
    if (ctaBar && hero) {
      const heroBottom = hero.offsetHeight - 120;
      const shouldShow = y > heroBottom;
      if (shouldShow !== ctaShown) {
        ctaShown = shouldShow;
        ctaBar.classList.toggle('is-visible', shouldShow);
      }
    }
    if (bar && !ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        const docH = document.documentElement.scrollHeight - window.innerHeight;
        const pct = docH > 0 ? (y / docH) * 100 : 0;
        bar.style.width = pct.toFixed(2) + '%';
        ticking = false;
      });
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- Smooth scroll on anchor links ---- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length > 1) {
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          const top = target.getBoundingClientRect().top + window.scrollY - 70;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }
    });
  });

  /* ---- Reveal on scroll (single IntersectionObserver) ---- */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal, [data-reveal], .clip-reveal, .footer-wordmark').forEach((el) => io.observe(el));
  } else {
    document.querySelectorAll('.reveal, [data-reveal], .clip-reveal, .footer-wordmark').forEach((el) => el.classList.add('is-in'));
  }

  /* ---- Animated counters (data-count attribute, one-shot rAF) ---- */
  if ('IntersectionObserver' in window && !reduced) {
    const counterIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-count'), 10);
        const suffix = el.getAttribute('data-count-suffix') || '';
        if (isNaN(target)) {
          counterIO.unobserve(el);
          return;
        }
        const start = performance.now();
        const dur = 1200;
        function tick(now) {
          const t = Math.min(1, (now - start) / dur);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = Math.round(target * eased) + suffix;
          if (t < 1) {
            requestAnimationFrame(tick);
          } else {
            el.textContent = target + suffix;
            el.classList.add('count-done');
          }
        }
        requestAnimationFrame(tick);
        counterIO.unobserve(el);
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('[data-count]').forEach((el) => counterIO.observe(el));
  }

  /* ---- Footer clock (updates every minute) ---- */
  const clock = document.getElementById('footerClock');
  if (clock) {
    function safeUpdate() {
      try {
        const d = new Date();
        const opts = { hour: '2-digit', minute: '2-digit', timeZone: 'America/Toronto' };
        clock.textContent = 'Saguenay · ' + d.toLocaleTimeString('fr-CA', opts);
      } catch (e) {}
    }
    safeUpdate();
    setInterval(safeUpdate, 60000);
  }
})();
