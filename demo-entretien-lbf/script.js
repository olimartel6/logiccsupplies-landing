/* ============================================
   ENTRETIEN LBF — Interactions (perf-tuned)
   - Single rAF scroll dispatcher
   - Native scroll (no wheel-hijack lerp)
   - IO-gated parallax + hscroll
   - rAF-throttled mouse handlers
   ============================================ */

(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarse = window.matchMedia('(pointer: coarse)').matches;
  const isDesktop = window.innerWidth > 900 && !isCoarse;

  /* =====================================================================
     UNIFIED SCROLL DISPATCHER
     One rAF, one scroll listener — reads scrollY once per frame and
     writes to every scroll-driven target together. Avoids layout thrash.
     ===================================================================== */
  const scrollSubs = [];
  let scrollY = window.scrollY;
  let needsScrollFrame = false;

  function subscribeScroll(fn) { scrollSubs.push(fn); }

  function scrollTick() {
    needsScrollFrame = false;
    scrollY = window.scrollY;
    for (let i = 0; i < scrollSubs.length; i++) {
      try { scrollSubs[i](scrollY); } catch (_) {}
    }
  }
  function requestScrollFrame() {
    if (needsScrollFrame) return;
    needsScrollFrame = true;
    requestAnimationFrame(scrollTick);
  }
  window.addEventListener('scroll', requestScrollFrame, { passive: true });
  window.addEventListener('resize', requestScrollFrame, { passive: true });

  /* ---- LOAD STATE ---- */
  document.addEventListener('DOMContentLoaded', () => {
    requestAnimationFrame(() => document.body.classList.add('is-loaded'));
  });

  /* ---- NAV scrolled state + scroll progress ---- */
  const nav = document.getElementById('nav');
  const bar = document.getElementById('scrollProgress');
  subscribeScroll((y) => {
    if (nav) {
      if (y > 30) nav.classList.add('is-scrolled');
      else nav.classList.remove('is-scrolled');
    }
    if (bar) {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docH > 0 ? (y / docH) * 100 : 0;
      bar.style.width = pct.toFixed(2) + '%';
    }
  });

  /* ---- REVEAL on scroll ---- */
  const revealIo = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          revealIo.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );
  document.querySelectorAll('.reveal').forEach((el) => revealIo.observe(el));

  /* ---- CURSOR (desktop, fine pointer) ---- */
  if (isDesktop) {
    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');

    if (dot && ring) {
      let mx = window.innerWidth / 2, my = window.innerHeight / 2;
      let rx = mx, ry = my;
      let cursorActive = false;

      // mousemove stores values; rAF writes
      window.addEventListener('mousemove', (e) => {
        mx = e.clientX;
        my = e.clientY;
        if (!cursorActive) {
          cursorActive = true;
          requestAnimationFrame(cursorTick);
        }
      }, { passive: true });

      function cursorTick() {
        rx += (mx - rx) * 0.18;
        ry += (my - ry) * 0.18;
        // Use left/top because the CSS uses transform: translate(-50%, -50%) for centering.
        dot.style.left = mx + 'px';
        dot.style.top = my + 'px';
        ring.style.left = rx + 'px';
        ring.style.top = ry + 'px';
        if (Math.abs(mx - rx) < 0.5 && Math.abs(my - ry) < 0.5) {
          cursorActive = false;
          return;
        }
        requestAnimationFrame(cursorTick);
      }

      document
        .querySelectorAll('a, button, [data-magnet], .service, .contact-card, .travaux-item')
        .forEach((el) => {
          el.addEventListener('mouseenter', () => ring.classList.add('is-hover'));
          el.addEventListener('mouseleave', () => ring.classList.remove('is-hover'));
        });
    }
  }

  /* ---- MAGNETIC buttons (rAF-throttled) ---- */
  if (!isCoarse) {
    document.querySelectorAll('[data-magnet]').forEach((el) => {
      const strength = 0.28;
      let pending = false;
      let lastE = null;
      el.addEventListener('mousemove', (e) => {
        lastE = e;
        if (pending) return;
        pending = true;
        requestAnimationFrame(() => {
          pending = false;
          if (!lastE) return;
          const r = el.getBoundingClientRect();
          const dx = lastE.clientX - (r.left + r.width / 2);
          const dy = lastE.clientY - (r.top + r.height / 2);
          el.style.transform = `translate3d(${dx * strength}px, ${dy * strength}px, 0)`;
        });
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'translate3d(0, 0, 0)';
      });
    });
  }

  /* ---- FOOTER clock (Lévis local time) ---- */
  const clock = document.getElementById('footerClock');
  if (clock) {
    const update = () => {
      const now = new Date();
      const time = now.toLocaleTimeString('fr-CA', {
        timeZone: 'America/Toronto',
        hour: '2-digit',
        minute: '2-digit',
      });
      clock.textContent = `Lévis · ${time}`;
    };
    update();
    setInterval(update, 30000);
  }

  /* ---- SMOOTH anchor scroll (rely on CSS scroll-behavior) ---- */
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

  /* ---- PAGE-LOAD CURTAIN ---- */
  const curtain = document.getElementById('curtain');
  if (curtain && !reduced) {
    document.documentElement.classList.add('is-curtain');
    document.body.classList.remove('is-loaded');
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
        requestAnimationFrame(() => document.body.classList.add('is-loaded'));
        setTimeout(() => { curtain.remove(); }, 1300);
      }, 1100);
    });
  } else if (curtain) {
    curtain.remove();
  }

  /* ---- TEXT SCRAMBLE ---- */
  const chars = '!<>-_\\/[]{}—=+*^?#________';
  function scramble(el) {
    const finalText = el.dataset.scrambleText || el.textContent.trim();
    if (!el.dataset.scrambleText) el.dataset.scrambleText = finalText;
    el.classList.add('is-scrambling');
    const len = finalText.length;
    const queue = [];
    for (let i = 0; i < len; i++) {
      const start = Math.floor(Math.random() * 10);
      const end = start + Math.floor(Math.random() * 20) + 10;
      queue.push({ to: finalText[i], start, end, char: '' });
    }
    let frame = 0;
    function update() {
      let output = '';
      let complete = 0;
      for (let i = 0; i < queue.length; i++) {
        const q = queue[i];
        if (frame >= q.end) { complete++; output += q.to; }
        else if (frame >= q.start) {
          if (!q.char || Math.random() < 0.3) q.char = chars[Math.floor(Math.random() * chars.length)];
          output += q.char;
        } else output += '';
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

  /* ---- ANIMATED COUNTERS ---- */
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

  /* ---- CURSOR-FOLLOWING PREVIEW (gallery hover) ---- */
  const cursorPreview = document.getElementById('cursorPreview');
  const ringLabel = document.getElementById('cursorRingLabel');
  const ringEl = document.getElementById('cursorRing');
  if (cursorPreview && isDesktop && !reduced) {
    let px = 0, py = 0, tx = 0, ty = 0;
    let previewVisible = false;
    let previewActive = false;

    document.addEventListener('mousemove', (e) => {
      if (!previewVisible) return;
      tx = e.clientX; ty = e.clientY;
      if (!previewActive) {
        previewActive = true;
        requestAnimationFrame(followPreview);
      }
    }, { passive: true });

    function followPreview() {
      px += (tx - px) * 0.22;
      py += (ty - py) * 0.22;
      // Use left/top to avoid clobbering the CSS scale transform on .is-on.
      cursorPreview.style.left = px + 'px';
      cursorPreview.style.top = py + 'px';
      if (!previewVisible && Math.abs(tx - px) < 0.5 && Math.abs(ty - py) < 0.5) {
        previewActive = false;
        return;
      }
      if (previewVisible) {
        requestAnimationFrame(followPreview);
      } else {
        previewActive = false;
      }
    }

    document.querySelectorAll('[data-preview], .travaux-item, .hscroll-item').forEach((el) => {
      const url = el.dataset.preview || (el.querySelector('img') && el.querySelector('img').src);
      el.addEventListener('mouseenter', () => {
        if (url) cursorPreview.style.backgroundImage = `url("${url}")`;
        cursorPreview.classList.add('is-on');
        previewVisible = true;
        if (!previewActive) { previewActive = true; requestAnimationFrame(followPreview); }
        if (ringLabel && ringEl) {
          ringLabel.textContent = 'VOIR';
          ringEl.classList.add('is-label');
        }
      });
      el.addEventListener('mouseleave', () => {
        cursorPreview.classList.remove('is-on');
        previewVisible = false;
        if (ringEl) ringEl.classList.remove('is-label');
        if (ringLabel) ringLabel.textContent = '';
      });
    });

    document.querySelectorAll('.service').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        if (ringLabel && ringEl) { ringLabel.textContent = '→'; ringEl.classList.add('is-label'); }
      });
      el.addEventListener('mouseleave', () => {
        if (ringEl) ringEl.classList.remove('is-label');
      });
    });
  }

  /* ---- BACKGROUND TINT SHIFT ON SCROLL ---- */
  if (!reduced) {
    const tints = ['#f5f3ee', '#f0eee7', '#ecebe4', '#eeece5', '#f5f3ee'];
    let lastIdx = -1;
    subscribeScroll((y) => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      const pct = Math.min(1, Math.max(0, y / max));
      const idx = Math.min(tints.length - 1, Math.floor(pct * (tints.length - 1)));
      if (idx !== lastIdx) {
        document.body.style.backgroundColor = tints[idx];
        lastIdx = idx;
      }
    });
  }

  /* ---- PARALLAX (IO-gated, single rAF) ---- */
  if (!reduced && !isCoarse) {
    const parallaxEls = Array.from(document.querySelectorAll('.parallax'));
    const inView = new WeakSet();
    if (parallaxEls.length) {
      const pio = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) inView.add(e.target);
          else inView.delete(e.target);
        });
      }, { rootMargin: '200px 0px 200px 0px' });
      parallaxEls.forEach((el) => pio.observe(el));
    }

    const hero = document.querySelector('.hero');
    const heroContent = document.querySelector('.hero-content');
    const heroGrid = document.querySelector('.hero-grid');
    // Cache hero rect; refresh on resize
    let heroBottom = 0;
    function measureHero() {
      if (hero) heroBottom = hero.getBoundingClientRect().bottom + window.scrollY;
    }
    measureHero();
    window.addEventListener('resize', measureHero, { passive: true });

    subscribeScroll((y) => {
      // Hero parallax — only while still in/near view
      if (hero && y < heroBottom + 200) {
        if (heroContent) heroContent.style.transform = `translate3d(0, ${y * 0.12}px, 0)`;
        if (heroGrid) heroGrid.style.transform = `translate3d(0, ${y * 0.22}px, 0)`;
      }
      // Element parallax — only those in view
      for (let i = 0; i < parallaxEls.length; i++) {
        const el = parallaxEls[i];
        if (!inView.has(el)) continue;
        const rate = parseFloat(el.dataset.parallax || '0.1');
        const r = el.getBoundingClientRect();
        const center = r.top + r.height / 2 - window.innerHeight / 2;
        el.style.transform = `translate3d(0, ${center * rate * -1}px, 0)`;
      }
    });
  }

  /* ---- CLIP-PATH REVEAL ON SCROLL ---- */
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

  /* ---- 3D TILT + magnetic on service rows / gallery (rAF-throttled) ---- */
  if (isDesktop && !reduced) {
    document.querySelectorAll('.service').forEach((el) => {
      let pending = false, lastE = null;
      el.addEventListener('mousemove', (e) => {
        lastE = e;
        if (pending) return;
        pending = true;
        requestAnimationFrame(() => {
          pending = false;
          if (!lastE) return;
          const r = el.getBoundingClientRect();
          const dx = (lastE.clientX - (r.left + r.width / 2)) / r.width;
          const dy = (lastE.clientY - (r.top + r.height / 2)) / r.height;
          el.style.transform = `perspective(1200px) rotateY(${dx * 3}deg) rotateX(${dy * -2}deg) translateZ(0)`;
        });
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });

    document.querySelectorAll('.travaux-item, .hscroll-item').forEach((el) => {
      const strength = 0.1;
      let pending = false, lastE = null;
      el.addEventListener('mousemove', (e) => {
        lastE = e;
        if (pending) return;
        pending = true;
        requestAnimationFrame(() => {
          pending = false;
          if (!lastE) return;
          const r = el.getBoundingClientRect();
          const dx = lastE.clientX - (r.left + r.width / 2);
          const dy = lastE.clientY - (r.top + r.height / 2);
          el.style.transform = `translate3d(${dx * strength}px, ${dy * strength}px, 0)`;
        });
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---- FOOTER WORDMARK reveal ---- */
  const wordmark = document.querySelector('.footer-wordmark');
  if (wordmark) {
    const wIo = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); wIo.unobserve(e.target); }
      });
    }, { threshold: 0.2 });
    wIo.observe(wordmark);
  }

  /* ---- HERO SPOTLIGHT (mouse-tracked, gated by hover) ---- */
  const spotlight = document.getElementById('heroSpotlight');
  if (spotlight && isDesktop && !reduced) {
    const heroSec = document.getElementById('hero');
    if (heroSec) {
      let pending = false, lastE = null, isOn = false;
      heroSec.addEventListener('mouseenter', () => { isOn = true; spotlight.classList.add('is-on'); });
      heroSec.addEventListener('mouseleave', () => { isOn = false; spotlight.classList.remove('is-on'); });
      heroSec.addEventListener('mousemove', (e) => {
        if (!isOn) return;
        lastE = e;
        if (pending) return;
        pending = true;
        requestAnimationFrame(() => {
          pending = false;
          if (!lastE) return;
          spotlight.style.setProperty('--mx', lastE.clientX + 'px');
          spotlight.style.setProperty('--my', lastE.clientY + 'px');
        });
      });
    }
  }

  /* ---- HORIZONTAL SCROLL gallery (IO-gated, single rAF) ---- */
  if (isDesktop && !reduced) {
    const track = document.getElementById('hscrollTrack');
    const section = document.querySelector('.hscroll-section');
    if (track && section) {
      let trackW = 0, viewW = 0, sectionTop = 0, sectionH = 0;
      let isInView = false;
      function measure() {
        trackW = track.scrollWidth;
        viewW = window.innerWidth;
        const r = section.getBoundingClientRect();
        sectionTop = r.top + window.scrollY;
        sectionH = section.offsetHeight;
      }
      measure();
      window.addEventListener('resize', measure, { passive: true });

      const hio = new IntersectionObserver((entries) => {
        entries.forEach((e) => { isInView = e.isIntersecting; });
      }, { rootMargin: '50px 0px 50px 0px' });
      hio.observe(section);

      subscribeScroll((y) => {
        if (!isInView) return;
        const total = sectionH - window.innerHeight;
        if (total <= 0) return;
        const progress = Math.min(1, Math.max(0, (y - sectionTop) / total));
        const maxX = Math.max(0, trackW - viewW + 80);
        track.style.transform = `translate3d(${-progress * maxX}px, 0, 0)`;
      });
    }
  }

  // Initial dispatch so first paint reflects scroll-state subscribers
  requestScrollFrame();
})();
