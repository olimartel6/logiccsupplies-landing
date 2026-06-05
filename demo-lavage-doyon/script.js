/* Lavage Doyon — interactions */

(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
     Reveal on scroll (Intersection Observer)
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
          window.scrollTo({ top: top, behavior: 'smooth' });
        }
      }
    });
  });

  /* ----------------------------------------------------------------
     Hero parallax background
  ---------------------------------------------------------------- */
  var heroBg = document.querySelector('.hero-bg');
  var heroContent = document.querySelector('.hero-content');
  if (heroBg && !prefersReducedMotion) {
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (y < window.innerHeight) {
        heroBg.style.transform = 'scale(' + (1.08 + y / 3600) + ') translateY(' + y * 0.22 + 'px)';
        if (heroContent) heroContent.style.transform = 'translateY(' + y * 0.18 + 'px)';
      }
    }, { passive: true });
  }

  /* ----------------------------------------------------------------
     Hero title — word-by-word stagger reveal on load
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
      w.style.transitionDelay = (i * 90 + 200) + 'ms';
    });
    requestAnimationFrame(function () {
      heroTitle.classList.add('words-in');
    });
  }

  /* ----------------------------------------------------------------
     Hero CTAs — staggered slide-in
  ---------------------------------------------------------------- */
  var heroSub = document.querySelector('.hero-sub');
  var heroEyebrow = document.querySelector('.hero-eyebrow');
  var heroCta = document.querySelector('.hero-cta');
  [heroEyebrow, heroSub, heroCta].forEach(function (el, i) {
    if (!el) return;
    el.classList.add('hero-fade');
    el.style.transitionDelay = (350 + i * 180) + 'ms';
    requestAnimationFrame(function () { el.classList.add('hero-fade-in'); });
  });

  /* ----------------------------------------------------------------
     Number counter animation in stats
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
     3D tilt on service cards (mouse-follow)
  ---------------------------------------------------------------- */
  if (!prefersReducedMotion && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.svc').forEach(function (card) {
      var rect, animating = false;
      card.addEventListener('mouseenter', function () {
        rect = card.getBoundingClientRect();
      });
      card.addEventListener('mousemove', function (e) {
        if (!rect) rect = card.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var dx = (e.clientX - cx) / rect.width;
        var dy = (e.clientY - cy) / rect.height;
        var rotX = -dy * 6;
        var rotY = dx * 6;
        if (!animating) {
          animating = true;
          requestAnimationFrame(function () {
            card.style.transform = 'perspective(900px) rotateX(' + rotX.toFixed(2) + 'deg) rotateY(' + rotY.toFixed(2) + 'deg) translateY(-6px)';
            animating = false;
          });
        }
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
        rect = null;
      });
    });
  }

  /* ----------------------------------------------------------------
     Magnetic buttons (cursor attraction)
  ---------------------------------------------------------------- */
  if (!prefersReducedMotion && window.matchMedia('(hover: hover)').matches) {
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
        var dy = (e.clientY - cy) * 0.3;
        btn.style.transform = 'translate(' + dx.toFixed(1) + 'px, ' + dy.toFixed(1) + 'px)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
        rect = null;
      });
    });
  }

  /* ----------------------------------------------------------------
     Cursor follower (small dot follows mouse for premium feel)
  ---------------------------------------------------------------- */
  if (!prefersReducedMotion && window.matchMedia('(hover: hover)').matches && window.innerWidth >= 980) {
    var cursor = document.createElement('div');
    cursor.className = 'cursor-dot';
    cursor.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cursor);
    var cx = -100, cy = -100, tx = -100, ty = -100;
    document.addEventListener('mousemove', function (e) {
      tx = e.clientX;
      ty = e.clientY;
    });
    function loop() {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      cursor.style.transform = 'translate(' + (cx - 4) + 'px, ' + (cy - 4) + 'px)';
      requestAnimationFrame(loop);
    }
    loop();
    document.querySelectorAll('a, button, .svc, .gallery-item, .review').forEach(function (el) {
      el.addEventListener('mouseenter', function () { cursor.classList.add('cursor-grow'); });
      el.addEventListener('mouseleave', function () { cursor.classList.remove('cursor-grow'); });
    });
  }

  /* ----------------------------------------------------------------
     Marquee strip — pause on hover
  ---------------------------------------------------------------- */
  document.querySelectorAll('.marquee-track').forEach(function (track) {
    // Duplicate content for seamless loop
    track.innerHTML = track.innerHTML + track.innerHTML;
  });

  /* ----------------------------------------------------------------
     Gallery image hover — ripple cursor zoom
  ---------------------------------------------------------------- */
  document.querySelectorAll('.gallery-item').forEach(function (item) {
    item.addEventListener('mousemove', function (e) {
      var rect = item.getBoundingClientRect();
      var x = ((e.clientX - rect.left) / rect.width) * 100;
      var y = ((e.clientY - rect.top) / rect.height) * 100;
      var img = item.querySelector('img');
      if (img) img.style.transformOrigin = x + '% ' + y + '%';
    });
  });
})();
