/* Microbrasserie Taïga — interactions (cinematic edition) */

(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;
  var isDesktop = window.innerWidth >= 980;

  /* ----------------------------------------------------------------
     0) Page-load curtain (injected first)
  ---------------------------------------------------------------- */
  if (!prefersReducedMotion) {
    var curtain = document.createElement('div');
    curtain.className = 'curtain';
    document.body.appendChild(curtain);
    setTimeout(function () { if (curtain.parentNode) curtain.parentNode.removeChild(curtain); }, 1600);
  }

  /* ----------------------------------------------------------------
     1) Scroll progress bar
  ---------------------------------------------------------------- */
  var progress = document.createElement('div');
  progress.className = 'scroll-progress';
  document.body.appendChild(progress);

  /* ----------------------------------------------------------------
     2) Smooth scroll (lenis-style lerp)
        - Hijacks wheel + keyboard + touch
        - Lerps current → target with rAF
        - Disabled on reduced-motion, touch, or small screens
  ---------------------------------------------------------------- */
  var smoothEnabled = !prefersReducedMotion && hasHover && isDesktop;

  if (smoothEnabled) {
    // Wrap body content into a smooth-scroll container.
    // CRITICAL: position:fixed elements (nav, mcta, curtain, progress) MUST live
    // outside the transformed wrapper, otherwise fixed positioning breaks.
    var smoothWrap = document.createElement('div');
    smoothWrap.id = 'smooth-content';
    var moved = [];
    Array.prototype.slice.call(document.body.children).forEach(function (ch) {
      if (ch === smoothWrap) return;
      if (ch.tagName === 'SCRIPT') return;
      if (ch.id === 'nav' || (ch.classList && (
        ch.classList.contains('curtain') ||
        ch.classList.contains('scroll-progress') ||
        ch.classList.contains('mcta') ||
        ch.classList.contains('nav')
      ))) return;
      moved.push(ch);
    });
    moved.forEach(function (n) { smoothWrap.appendChild(n); });
    document.body.appendChild(smoothWrap);
    document.documentElement.classList.add('has-smooth-scroll');

    var current = 0;
    var target = 0;
    var ease = 0.085;
    var maxScroll = 0;

    function setBodyHeight() {
      maxScroll = smoothWrap.scrollHeight;
      document.body.style.height = maxScroll + 'px';
    }
    setBodyHeight();

    var resizeObs = new ResizeObserver(setBodyHeight);
    resizeObs.observe(smoothWrap);
    window.addEventListener('resize', setBodyHeight);

    function loop() {
      target = window.scrollY || window.pageYOffset || 0;
      current += (target - current) * ease;
      if (Math.abs(target - current) < 0.05) current = target;
      smoothWrap.style.transform = 'translate3d(0,' + (-current) + 'px,0)';
      // Progress
      var max = (maxScroll - window.innerHeight) || 1;
      var pct = Math.min(100, Math.max(0, (current / max) * 100));
      progress.style.width = pct + '%';
      requestAnimationFrame(loop);
    }
    loop();

    // Anchor scrolls: just set window scroll; the lerp loop handles the smoothing.
    window.__smoothScrollTo = function (y) {
      window.scrollTo({ top: y, behavior: 'auto' });
    };
  } else {
    // Native scroll → still drive progress bar
    window.addEventListener('scroll', function () {
      var max = (document.documentElement.scrollHeight - window.innerHeight) || 1;
      var pct = Math.min(100, Math.max(0, (window.scrollY / max) * 100));
      progress.style.width = pct + '%';
    }, { passive: true });
  }

  /* ----------------------------------------------------------------
     Sticky nav background on scroll
  ---------------------------------------------------------------- */
  var nav = document.getElementById('nav');
  function onScroll() {
    if (window.scrollY > 60) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ----------------------------------------------------------------
     Reveal on scroll (IntersectionObserver) + section flags
  ---------------------------------------------------------------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var idx = Array.prototype.indexOf.call(el.parentNode ? el.parentNode.children : [], el);
          el.style.transitionDelay = Math.min(idx, 8) * 70 + 'ms';
          el.classList.add('in');
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  ['.about', '.beer'].forEach(function (sel) {
    var node = document.querySelector(sel);
    if (!node) return;
    if ('IntersectionObserver' in window) {
      var so = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            so.unobserve(entry.target);
          }
        });
      }, { threshold: 0.18 });
      so.observe(node);
    } else {
      node.classList.add('in');
    }
  });

  /* ----------------------------------------------------------------
     Smooth-scroll for in-page anchors
  ---------------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length > 1) {
        var target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          var top = target.getBoundingClientRect().top + window.scrollY - 70;
          if (smoothEnabled && window.__smoothScrollTo) {
            window.__smoothScrollTo(top);
          } else {
            window.scrollTo({ top: top, behavior: 'smooth' });
          }
        }
      }
    });
  });

  /* ----------------------------------------------------------------
     Hero parallax (depth between bg and content)
  ---------------------------------------------------------------- */
  var heroBg = document.querySelector('.hero-bg');
  var heroContent = document.querySelector('.hero-content');
  if (heroBg && !prefersReducedMotion) {
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (y < window.innerHeight) {
        heroBg.style.transform = 'scale(' + (1.08 + y / 3600) + ') translateY(' + y * 0.22 + 'px)';
        if (heroContent) heroContent.style.transform = 'translateY(' + y * 0.12 + 'px)';
      }
    }, { passive: true });
  }

  /* Tracel parallax */
  var tracelBg = document.querySelector('.tracel-bg');
  if (tracelBg && !prefersReducedMotion) {
    var tracelSection = document.querySelector('.tracel');
    window.addEventListener('scroll', function () {
      if (!tracelSection) return;
      var rect = tracelSection.getBoundingClientRect();
      var vh = window.innerHeight;
      if (rect.top < vh && rect.bottom > 0) {
        var progress = (vh - rect.top) / (vh + rect.height);
        var offset = (progress - 0.5) * 80;
        tracelBg.style.transform = 'scale(1.08) translateY(' + offset.toFixed(1) + 'px)';
      }
    }, { passive: true });
  }

  /* About image subtle Y parallax */
  var aboutImg = document.querySelector('.about-img');
  if (aboutImg && !prefersReducedMotion) {
    window.addEventListener('scroll', function () {
      var rect = aboutImg.getBoundingClientRect();
      var vh = window.innerHeight;
      if (rect.top < vh && rect.bottom > 0) {
        var img = aboutImg.querySelector('img');
        if (img) {
          var p = (vh - rect.top) / (vh + rect.height);
          var ty = (p - 0.5) * 40;
          img.style.transform = 'scale(1.06) translateY(' + ty.toFixed(1) + 'px)';
        }
      }
    }, { passive: true });
  }

  /* ----------------------------------------------------------------
     Hero title — word-by-word stagger reveal
  ---------------------------------------------------------------- */
  var heroTitle = document.querySelector('.hero-title');
  if (heroTitle && !prefersReducedMotion) {
    var html = heroTitle.innerHTML;
    var wrapped = html.replace(/(<em[^>]*>|<\/em>|<br[^>]*>)|([^<\s]+)/g, function (m, tag, word) {
      if (tag) return tag;
      if (word) return '<span class="word"><span class="word-inner">' + word + '</span></span>';
      return m;
    });
    heroTitle.innerHTML = wrapped;
    var words = heroTitle.querySelectorAll('.word-inner');
    words.forEach(function (w, i) {
      w.style.transitionDelay = (i * 90 + 600) + 'ms';
    });
    requestAnimationFrame(function () {
      heroTitle.classList.add('words-in');
    });
  }

  /* ----------------------------------------------------------------
     Hero supporting elements — staggered fade
  ---------------------------------------------------------------- */
  var heroSub = document.querySelector('.hero-sub');
  var heroEyebrow = document.querySelector('.hero-eyebrow');
  var heroCta = document.querySelector('.hero-cta');
  [heroEyebrow, heroSub, heroCta].forEach(function (el, i) {
    if (!el) return;
    el.classList.add('hero-fade');
    el.style.transitionDelay = (900 + i * 200) + 'ms';
    requestAnimationFrame(function () { el.classList.add('hero-fade-in'); });
  });

  /* ----------------------------------------------------------------
     Section heading mask reveals (h2 inside .section-head, .about-text, .tracel)
  ---------------------------------------------------------------- */
  function wrapMaskReveal(el) {
    if (!el || el.dataset.masked) return;
    el.dataset.masked = '1';
    // Wrap inner content in span.mask-inner; wrapping itself uses overflow:hidden
    var inner = document.createElement('span');
    inner.className = 'mask-inner';
    inner.style.display = 'inline-block';
    while (el.firstChild) inner.appendChild(el.firstChild);
    el.appendChild(inner);
    el.classList.add('mask-reveal');
  }
  // Apply to non-hero h2s
  document.querySelectorAll('.section-head h2, .about-text h2, .tracel-title, .c-info h2').forEach(wrapMaskReveal);

  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    var maskObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          maskObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.mask-reveal').forEach(function (el) { maskObserver.observe(el); });
  } else {
    document.querySelectorAll('.mask-reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* ----------------------------------------------------------------
     Image clip-path reveals (about image, beer image, gallery)
  ---------------------------------------------------------------- */
  var clipTargets = document.querySelectorAll('.about-img, .beer-card-img, .c-map');
  clipTargets.forEach(function (el) { el.classList.add('clip-reveal'); });
  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    var clipObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          clipObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    clipTargets.forEach(function (el) { clipObs.observe(el); });
  } else {
    clipTargets.forEach(function (el) { el.classList.add('in'); });
  }

  /* ----------------------------------------------------------------
     Card stagger reveals
  ---------------------------------------------------------------- */
  function staggerObserve(selector, batchDelay) {
    var els = document.querySelectorAll(selector);
    if (!els.length) return;
    if (!('IntersectionObserver' in window) || prefersReducedMotion) {
      els.forEach(function (el) { el.classList.add('stagger-in'); });
      return;
    }
    var seenGroups = new WeakSet();
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var parent = el.parentNode;
          // index within same parent for stagger
          var idx = Array.prototype.indexOf.call(parent.children, el);
          el.style.transitionDelay = (Math.min(idx, 10) * (batchDelay || 80)) + 'ms';
          el.classList.add('stagger-in');
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { obs.observe(el); });
  }
  staggerObserve('.tracel-feat', 90);
  staggerObserve('.pt', 50);
  staggerObserve('.r-card', 110);
  staggerObserve('.m-item', 70);

  /* ----------------------------------------------------------------
     Number counter
  ---------------------------------------------------------------- */
  function animateCounter(el, target, duration, suffix) {
    var start = performance.now();
    function tick(now) {
      var t = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      var current = Math.round(eased * target);
      el.textContent = current + (suffix || '');
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = target + (suffix || '');
    }
    requestAnimationFrame(tick);
  }

  var stats = document.querySelectorAll('.about-stats strong');
  if (stats.length && 'IntersectionObserver' in window && !prefersReducedMotion) {
    var statsObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var txt = el.textContent.trim();
          var num = parseInt(txt.replace(/[^0-9]/g, ''), 10);
          var suffix = txt.replace(/[0-9]/g, '');
          if (!isNaN(num) && num > 0) {
            animateCounter(el, num, 1400, suffix);
          }
          statsObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    stats.forEach(function (s) { statsObserver.observe(s); });
  }

  /* ----------------------------------------------------------------
     Magnetic buttons + click ripple
  ---------------------------------------------------------------- */
  if (!prefersReducedMotion && hasHover) {
    document.querySelectorAll('.btn, .nav-cta').forEach(function (btn) {
      var rect;
      btn.addEventListener('mouseenter', function () {
        rect = btn.getBoundingClientRect();
      });
      btn.addEventListener('mousemove', function (e) {
        if (!rect) rect = btn.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var dx = (e.clientX - cx) * 0.25;
        var dy = (e.clientY - cy) * 0.30;
        btn.style.transform = 'translate(' + dx.toFixed(1) + 'px, ' + dy.toFixed(1) + 'px)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
        rect = null;
      });
    });
  }

  // Ripple on all buttons + nav-cta (touch + click)
  document.querySelectorAll('.btn, .nav-cta, .mcta-btn, .c-map-cta').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      var rect = btn.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height);
      var ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      btn.appendChild(ripple);
      setTimeout(function () { if (ripple.parentNode) ripple.parentNode.removeChild(ripple); }, 720);
    });
  });

  /* ----------------------------------------------------------------
     Refined custom cursor — dot + outlined ring with lag
  ---------------------------------------------------------------- */
  if (!prefersReducedMotion && hasHover && isDesktop) {
    var dot = document.createElement('div');
    dot.className = 'cursor-dot';
    dot.setAttribute('aria-hidden', 'true');
    document.body.appendChild(dot);

    var ring = document.createElement('div');
    ring.className = 'cursor-ring';
    ring.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ring);

    var dx = -100, dy = -100;     // dot positions
    var rx = -100, ry = -100;     // ring positions
    var tx = -100, ty = -100;     // target

    document.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
    });
    document.addEventListener('mouseleave', function () {
      dot.classList.add('cursor-hide');
      ring.classList.add('cursor-hide');
    });
    document.addEventListener('mouseenter', function () {
      dot.classList.remove('cursor-hide');
      ring.classList.remove('cursor-hide');
    });

    function cursorLoop() {
      // Dot - tighter follow
      dx += (tx - dx) * 0.35;
      dy += (ty - dy) * 0.35;
      // Ring - looser follow (lag)
      rx += (tx - rx) * 0.16;
      ry += (ty - ry) * 0.16;

      dot.style.transform = 'translate(' + (dx - 3) + 'px,' + (dy - 3) + 'px)';
      ring.style.transform = 'translate(' + (rx - 18) + 'px,' + (ry - 18) + 'px)';
      requestAnimationFrame(cursorLoop);
    }
    cursorLoop();

    document.querySelectorAll('a, button, .pt, .m-item, .r-card, .tracel-feat, .faq-item summary, .beer-card-img').forEach(function (el) {
      el.addEventListener('mouseenter', function () { ring.classList.add('cursor-grow'); });
      el.addEventListener('mouseleave', function () { ring.classList.remove('cursor-grow'); });
    });
  }

  /* ----------------------------------------------------------------
     Marquee — duplicate for seamless loop + hover decel
  ---------------------------------------------------------------- */
  document.querySelectorAll('.marquee-track').forEach(function (track) {
    track.innerHTML = track.innerHTML + track.innerHTML;
  });

  // Smooth pause via transition
  var marquees = document.querySelectorAll('.marquee');
  marquees.forEach(function (m) {
    var track = m.querySelector('.marquee-track');
    if (!track || prefersReducedMotion) return;
    m.addEventListener('mouseenter', function () {
      track.style.animationPlayState = 'paused';
    });
    m.addEventListener('mouseleave', function () {
      track.style.animationPlayState = 'running';
    });
  });

  /* ----------------------------------------------------------------
     Gallery image hover — cursor-aware origin + brightness shift
  ---------------------------------------------------------------- */
  document.querySelectorAll('.m-item').forEach(function (item) {
    item.addEventListener('mousemove', function (e) {
      var rect = item.getBoundingClientRect();
      var x = ((e.clientX - rect.left) / rect.width) * 100;
      var y = ((e.clientY - rect.top) / rect.height) * 100;
      var img = item.querySelector('img');
      if (img) img.style.transformOrigin = x + '% ' + y + '%';
    });
  });

  /* ----------------------------------------------------------------
     3D tilt on beer can image (mouse-follow rotateX/Y) + idle float pause
  ---------------------------------------------------------------- */
  var beerImg = document.querySelector('.beer-card-img');
  if (beerImg && !prefersReducedMotion && hasHover) {
    var inner = beerImg.querySelector('img');
    if (inner) {
      var raf = null;
      beerImg.addEventListener('mousemove', function (e) {
        var rect = beerImg.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width;
        var py = (e.clientY - rect.top) / rect.height;
        var rotY = (px - 0.5) * 12;
        var rotX = (0.5 - py) * 10;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          inner.style.animation = 'none';
          inner.style.transform = 'perspective(1200px) rotateX(' + rotX.toFixed(2) + 'deg) rotateY(' + rotY.toFixed(2) + 'deg) scale(1.02)';
        });
      });
      beerImg.addEventListener('mouseleave', function () {
        inner.style.transform = '';
        inner.style.animation = '';
      });
    }
  }

  /* ----------------------------------------------------------------
     3D tilt on review/feature cards (subtle)
  ---------------------------------------------------------------- */
  if (!prefersReducedMotion && hasHover) {
    document.querySelectorAll('.r-card, .tracel-feat').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width;
        var py = (e.clientY - rect.top) / rect.height;
        var rotY = (px - 0.5) * 4;
        var rotX = (0.5 - py) * 4;
        card.style.transform = 'perspective(900px) translateY(-6px) rotateX(' + rotX.toFixed(2) + 'deg) rotateY(' + rotY.toFixed(2) + 'deg)';
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  }

  /* ----------------------------------------------------------------
     Sticky mobile CTA bar — show after scrolling past hero
  ---------------------------------------------------------------- */
  (function () {
    var bar = document.getElementById('mcta');
    if (!bar) return;
    var hero = document.querySelector('.hero');
    var triggerY = hero ? hero.offsetHeight * 0.7 : 400;
    var visible = false;
    function check() {
      var should = window.scrollY > triggerY;
      if (should && !visible) { bar.classList.add('visible'); visible = true; }
      else if (!should && visible) { bar.classList.remove('visible'); visible = false; }
    }
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', function () {
      triggerY = hero ? hero.offsetHeight * 0.7 : 400;
      check();
    });
    check();
  })();

  /* ----------------------------------------------------------------
     Background gradient sweep on scroll (very gentle)
  ---------------------------------------------------------------- */
  if (!prefersReducedMotion) {
    window.addEventListener('scroll', function () {
      var max = (document.documentElement.scrollHeight - window.innerHeight) || 1;
      var pct = Math.min(1, Math.max(0, window.scrollY / max));
      var sweep = (pct * 100).toFixed(1);
      document.body.style.setProperty('--bg-sweep', sweep + '%');
    }, { passive: true });
  }

})();
