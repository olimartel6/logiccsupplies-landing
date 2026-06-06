/* ============================================
   ENTRETIEN LBF — Minimal interactions
   Strict minimum to make the page load smoothly.
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
      // Quick fade-out, no complex choreography
      requestAnimationFrame(() => {
        curtain.classList.add('is-gone');
        setTimeout(() => { curtain.remove(); }, 800);
      });
    }
  }
  document.documentElement.classList.remove('is-curtain');

  /* ---- Mark body as loaded so CSS reveals trigger ---- */
  requestAnimationFrame(() => {
    document.body.classList.add('is-loaded');
  });

  /* ---- Sticky nav state ---- */
  const nav = document.getElementById('nav');
  if (nav) {
    let scrolled = false;
    window.addEventListener('scroll', () => {
      const isScrolled = window.scrollY > 30;
      if (isScrolled !== scrolled) {
        scrolled = isScrolled;
        nav.classList.toggle('is-scrolled', isScrolled);
      }
    }, { passive: true });
  }

  /* ---- Scroll progress bar ---- */
  const bar = document.getElementById('scrollProgress');
  if (bar) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const docH = document.documentElement.scrollHeight - window.innerHeight;
        const pct = docH > 0 ? (window.scrollY / docH) * 100 : 0;
        bar.style.width = pct.toFixed(2) + '%';
        ticking = false;
      });
    }, { passive: true });
  }

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

    document.querySelectorAll('.reveal, [data-reveal], .clip-reveal').forEach((el) => io.observe(el));
  } else {
    document.querySelectorAll('.reveal, [data-reveal], .clip-reveal').forEach((el) => el.classList.add('is-in'));
  }

  /* ---- Animated counters (lightweight) ---- */
  if ('IntersectionObserver' in window && !reduced) {
    const counterIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const txt = el.textContent.trim();
        const num = parseInt(txt.replace(/[^0-9]/g, ''), 10);
        const suffix = txt.replace(/[0-9]/g, '');
        if (isNaN(num) || num === 0) {
          counterIO.unobserve(el);
          return;
        }
        const start = performance.now();
        const dur = 1200;
        function tick(now) {
          const t = Math.min(1, (now - start) / dur);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = Math.round(num * eased) + suffix;
          if (t < 1) requestAnimationFrame(tick);
          else el.textContent = num + suffix;
        }
        requestAnimationFrame(tick);
        counterIO.unobserve(el);
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('[data-counter]').forEach((el) => counterIO.observe(el));
  }
})();
