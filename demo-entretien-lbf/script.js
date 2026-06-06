/* ============================================
   ENTRETIEN LBF — Interactions
   ============================================ */

(function () {
  'use strict';

  /* ---- LOAD STATE ---- */
  document.addEventListener('DOMContentLoaded', () => {
    requestAnimationFrame(() => document.body.classList.add('is-loaded'));
  });

  /* ---- NAV scrolled state ---- */
  const nav = document.getElementById('nav');
  const onScroll = () => {
    if (window.scrollY > 30) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');

    // scroll progress bar
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docH > 0 ? (window.scrollY / docH) * 100 : 0;
    const bar = document.getElementById('scrollProgress');
    if (bar) bar.style.width = pct + '%';
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- REVEAL on scroll ---- */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  /* ---- CURSOR (desktop, fine pointer) ---- */
  const isCoarse = window.matchMedia('(pointer: coarse)').matches;
  if (!isCoarse && window.innerWidth > 900) {
    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');

    let mx = window.innerWidth / 2,
      my = window.innerHeight / 2;
    let rx = mx,
      ry = my;

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.left = mx + 'px';
      dot.style.top = my + 'px';
    });

    const tick = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.left = rx + 'px';
      ring.style.top = ry + 'px';
      requestAnimationFrame(tick);
    };
    tick();

    document
      .querySelectorAll('a, button, [data-magnet], .service, .contact-card, .travaux-item')
      .forEach((el) => {
        el.addEventListener('mouseenter', () => ring.classList.add('is-hover'));
        el.addEventListener('mouseleave', () => ring.classList.remove('is-hover'));
      });
  }

  /* ---- MAGNETIC buttons ---- */
  if (!isCoarse) {
    document.querySelectorAll('[data-magnet]').forEach((el) => {
      const strength = 0.28;
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'translate(0, 0)';
      });
    });
  }

  /* ---- FOOTER clock (Lévis local time) ---- */
  const clock = document.getElementById('footerClock');
  if (clock) {
    const update = () => {
      const now = new Date();
      const tz = 'America/Toronto';
      const time = now.toLocaleTimeString('fr-CA', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
      });
      clock.textContent = `Lévis · ${time}`;
    };
    update();
    setInterval(update, 30000);
  }

  /* ---- SMOOTH anchor scroll (manual, slightly slower) ---- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#' || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 60;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();
