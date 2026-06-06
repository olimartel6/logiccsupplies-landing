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

/* =====================================================================
   AWWWARDS-TIER ANIMATION LAYER
   Additive — runs after the IIFE above. Vanilla, no libs.
   ===================================================================== */
(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarse = window.matchMedia('(pointer: coarse)').matches;
  const isDesktop = window.innerWidth > 900 && !isCoarse;

  /* ---- 1. PAGE-LOAD CURTAIN ---- */
  const curtain = document.getElementById('curtain');
  if (curtain && !reduced) {
    document.documentElement.classList.add('is-curtain');
    // Strip is-loaded that the first IIFE may have set, so the hero
    // entrance only fires once the curtain is wiping.
    document.body.classList.remove('is-loaded');
    // Watch for the original IIFE re-adding it and revert until curtain lifts.
    const stripObs = new MutationObserver(() => {
      if (document.documentElement.classList.contains('is-curtain')) {
        document.body.classList.remove('is-loaded');
      }
    });
    stripObs.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    requestAnimationFrame(() => {
      document.body.classList.add('curtain-reveal', 'curtain-glow');
      setTimeout(() => {
        curtain.classList.add('is-gone');
        document.documentElement.classList.remove('is-curtain');
        stripObs.disconnect();
        // Trigger hero load AFTER curtain reveals hero
        requestAnimationFrame(() => document.body.classList.add('is-loaded'));
        setTimeout(() => { curtain.remove(); }, 1300);
      }, 1100);
    });
  } else if (curtain) {
    curtain.remove();
  }

  /* ---- 4. SMOOTH (LENIS-STYLE) SCROLL ---- */
  if (isDesktop && !reduced) {
    let target = window.scrollY;
    let current = window.scrollY;
    const ease = 0.085;
    let rafId = null;
    let active = true;

    document.addEventListener('wheel', (e) => {
      if (!active) return;
      // Skip if inside an element that scrolls itself
      let n = e.target;
      while (n && n !== document.body) {
        const s = getComputedStyle(n);
        if ((s.overflowY === 'auto' || s.overflowY === 'scroll') && n.scrollHeight > n.clientHeight) return;
        n = n.parentNode;
      }
      e.preventDefault();
      target += e.deltaY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      target = Math.max(0, Math.min(max, target));
      if (!rafId) loop();
    }, { passive: false });

    // Resync on programmatic scroll (anchor clicks)
    window.addEventListener('scroll', () => {
      if (Math.abs(window.scrollY - current) > 80) {
        target = window.scrollY;
        current = window.scrollY;
      }
    }, { passive: true });

    function loop() {
      current += (target - current) * ease;
      if (Math.abs(target - current) < 0.4) {
        current = target;
        window.scrollTo(0, current);
        rafId = null;
        return;
      }
      window.scrollTo(0, current);
      rafId = requestAnimationFrame(loop);
    }
  }

  /* ---- 5. TEXT SCRAMBLE ---- */
  const chars = '!<>-_\\/[]{}—=+*^?#________';
  function scramble(el) {
    const finalText = el.dataset.scrambleText || el.textContent.trim();
    if (!el.dataset.scrambleText) el.dataset.scrambleText = finalText;
    el.classList.add('is-scrambling');
    const len = finalText.length;
    const queue = [];
    for (let i = 0; i < len; i++) {
      const from = '';
      const to = finalText[i];
      const start = Math.floor(Math.random() * 10);
      const end = start + Math.floor(Math.random() * 20) + 10;
      queue.push({ from, to, start, end, char: '' });
    }
    let frame = 0;
    const total = 36;
    function update() {
      let output = '';
      let complete = 0;
      for (let i = 0; i < queue.length; i++) {
        const q = queue[i];
        if (frame >= q.end) { complete++; output += q.to; }
        else if (frame >= q.start) {
          if (!q.char || Math.random() < 0.3) q.char = chars[Math.floor(Math.random() * chars.length)];
          output += q.char;
        } else output += q.from;
      }
      el.textContent = output;
      if (complete === queue.length) {
        el.classList.remove('is-scrambling');
        return;
      }
      frame++;
      requestAnimationFrame(update);
    }
    update();
  }
  if (!reduced) {
    const scrambleIo = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          scramble(e.target);
          scrambleIo.unobserve(e.target);
        }
      });
    }, { threshold: 0.6 });
    document.querySelectorAll('[data-scramble]').forEach((el) => scrambleIo.observe(el));
  }

  /* ---- 6. ANIMATED COUNTERS ---- */
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    if (isNaN(target)) return;
    const pad = parseInt(el.dataset.countPad || '0', 10);
    const suffix = el.dataset.countSuffix || '';
    const dur = 1600;
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / dur);
      const v = Math.round(target * easeOut(t));
      let txt = pad > 0 ? String(v).padStart(pad, '0') : String(v);
      el.textContent = txt + suffix;
      if (t < 1) requestAnimationFrame(tick);
      else {
        el.classList.add('count-done');
        setTimeout(() => el.classList.remove('count-done'), 1000);
      }
    }
    requestAnimationFrame(tick);
  }
  if (!reduced) {
    const countIo = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          animateCount(e.target);
          countIo.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('[data-count]').forEach((el) => countIo.observe(el));
  }

  /* ---- 7. CURSOR-FOLLOWING PREVIEW (gallery hover) ---- */
  const cursorPreview = document.getElementById('cursorPreview');
  const ringLabel = document.getElementById('cursorRingLabel');
  const ring = document.getElementById('cursorRing');
  if (cursorPreview && isDesktop && !reduced) {
    let px = 0, py = 0, tx = 0, ty = 0;
    document.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function follow() {
      px += (tx - px) * 0.22;
      py += (ty - py) * 0.22;
      cursorPreview.style.left = px + 'px';
      cursorPreview.style.top = py + 'px';
      requestAnimationFrame(follow);
    })();

    // Gallery items show preview
    document.querySelectorAll('[data-preview], .travaux-item, .hscroll-item').forEach((el) => {
      const url = el.dataset.preview || (el.querySelector('img') && el.querySelector('img').src);
      el.addEventListener('mouseenter', () => {
        if (url) cursorPreview.style.backgroundImage = `url("${url}")`;
        cursorPreview.classList.add('is-on');
        if (ringLabel && ring) {
          ringLabel.textContent = 'VOIR';
          ring.classList.add('is-label');
        }
      });
      el.addEventListener('mouseleave', () => {
        cursorPreview.classList.remove('is-on');
        if (ring) ring.classList.remove('is-label');
        if (ringLabel) ringLabel.textContent = '';
      });
    });

    // Service rows: arrow in ring
    document.querySelectorAll('.service').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        if (ringLabel && ring) { ringLabel.textContent = '→'; ring.classList.add('is-label'); }
      });
      el.addEventListener('mouseleave', () => {
        if (ring) ring.classList.remove('is-label');
      });
    });
  }

  /* ---- 9. BACKGROUND TINT SHIFT ON SCROLL ---- */
  if (!reduced) {
    const tints = ['#f5f3ee', '#f0eee7', '#ecebe4', '#eeece5', '#f5f3ee'];
    let lastIdx = -1;
    window.addEventListener('scroll', () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      const pct = Math.min(1, Math.max(0, window.scrollY / max));
      const idx = Math.min(tints.length - 1, Math.floor(pct * (tints.length - 1)));
      if (idx !== lastIdx) {
        document.body.style.backgroundColor = tints[idx];
        lastIdx = idx;
      }
    }, { passive: true });
  }

  /* ---- 10. PARALLAX ---- */
  if (!reduced && !isCoarse) {
    const parallaxEls = Array.from(document.querySelectorAll('.parallax'));
    const hero = document.querySelector('.hero');
    const heroContent = document.querySelector('.hero-content');
    const heroGrid = document.querySelector('.hero-grid');
    function onParallax() {
      const y = window.scrollY;
      parallaxEls.forEach((el) => {
        const rate = parseFloat(el.dataset.parallax || '0.1');
        const r = el.getBoundingClientRect();
        // Only animate when in viewport-ish
        if (r.bottom > -200 && r.top < window.innerHeight + 200) {
          const center = r.top + r.height / 2 - window.innerHeight / 2;
          el.style.transform = `translate3d(0, ${center * rate * -1}px, 0)`;
        }
      });
      if (hero) {
        if (heroContent) heroContent.style.transform = `translate3d(0, ${y * 0.12}px, 0)`;
        if (heroGrid) heroGrid.style.transform = `translate3d(0, ${y * 0.22}px, 0)`;
      }
    }
    window.addEventListener('scroll', onParallax, { passive: true });
    onParallax();
  }

  /* ---- 11. CLIP-PATH REVEAL ON SCROLL ---- */
  if (!reduced) {
    const clipIo = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          clipIo.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    document.querySelectorAll('.clip-reveal').forEach((el) => clipIo.observe(el));
  } else {
    document.querySelectorAll('.clip-reveal').forEach((el) => el.classList.add('is-in'));
  }

  /* ---- 13. MAGNETIC + 3D TILT on service rows ---- */
  if (isDesktop && !reduced) {
    document.querySelectorAll('.service').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        el.style.transform = `perspective(1200px) rotateY(${dx * 3}deg) rotateX(${dy * -2}deg) translateZ(0)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });

    // Magnetic pull on gallery items
    document.querySelectorAll('.travaux-item, .hscroll-item').forEach((el) => {
      const strength = 0.1;
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---- 14. FOOTER WORDMARK reveal ---- */
  const wordmark = document.querySelector('.footer-wordmark');
  if (wordmark) {
    const wIo = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); wIo.unobserve(e.target); }
      });
    }, { threshold: 0.2 });
    wIo.observe(wordmark);
  }

  /* ---- 15. HERO SPOTLIGHT (mouse-tracked) ---- */
  const spotlight = document.getElementById('heroSpotlight');
  if (spotlight && isDesktop && !reduced) {
    const heroSec = document.getElementById('hero');
    if (heroSec) {
      heroSec.addEventListener('mouseenter', () => spotlight.classList.add('is-on'));
      heroSec.addEventListener('mouseleave', () => spotlight.classList.remove('is-on'));
      heroSec.addEventListener('mousemove', (e) => {
        spotlight.style.setProperty('--mx', e.clientX + 'px');
        spotlight.style.setProperty('--my', e.clientY + 'px');
      });
    }
  }

  /* ---- 3. HORIZONTAL SCROLL gallery ---- */
  if (isDesktop && !reduced) {
    const track = document.getElementById('hscrollTrack');
    const section = document.querySelector('.hscroll-section');
    if (track && section) {
      let trackW = 0, viewW = 0;
      function measure() {
        trackW = track.scrollWidth;
        viewW = window.innerWidth;
      }
      measure();
      window.addEventListener('resize', measure);
      window.addEventListener('scroll', () => {
        const r = section.getBoundingClientRect();
        const total = section.offsetHeight - window.innerHeight;
        if (total <= 0) return;
        const progress = Math.min(1, Math.max(0, -r.top / total));
        const maxX = Math.max(0, trackW - viewW + 80);
        track.style.transform = `translate3d(${-progress * maxX}px, 0, 0)`;
      }, { passive: true });
    }
  }
})();
