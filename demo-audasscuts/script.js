(function () {
  "use strict";

  const prefersReduce = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // ---------- Nav scrolled state ----------
  const nav = document.querySelector(".nav");
  if (nav) {
    const onScroll = () => {
      if (window.scrollY > 24) nav.classList.add("scrolled");
      else nav.classList.remove("scrolled");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // ---------- Custom cursor (desktop only) ----------
  const cursor = document.querySelector(".cursor");
  const dot = document.querySelector(".cursor-dot");
  const ring = document.querySelector(".cursor-ring");
  const hoverable = "a, button, [data-magnetic], .grid-item, .service-row";

  if (cursor && dot && ring && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let dx = mx, dy = my;
    let rx = mx, ry = my;

    window.addEventListener("mousemove", (e) => {
      mx = e.clientX;
      my = e.clientY;
    });

    const loop = () => {
      // Dot follows nearly instantly
      dx += (mx - dx) * 0.6;
      dy += (my - dy) * 0.6;
      // Ring lags behind
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      dot.style.transform = `translate(${dx}px, ${dy}px) translate(-50%, -50%)`;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    document.querySelectorAll(hoverable).forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
    });
  }

  // ---------- Magnetic buttons ----------
  if (!prefersReduce) {
    const magnetics = document.querySelectorAll("[data-magnetic]");
    magnetics.forEach((el) => {
      const isPrimary =
        el.classList.contains("btn-pill--xl") ||
        (el.classList.contains("btn-pill--lg") && el.classList.contains("btn-pill--dark"));
      const strength = isPrimary ? 0.42 : 0.28;
      el.addEventListener("mousemove", (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "translate(0, 0)";
      });
    });
  }

  // ---------- Reveal on scroll ----------
  const reveals = document.querySelectorAll(".reveal-up, .reveal-mask");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  // ---------- Smooth scroll for anchor links ----------
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length > 1) {
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          window.scrollTo({
            top: target.getBoundingClientRect().top + window.scrollY - 40,
            behavior: "smooth",
          });
        }
      }
    });
  });

  /* =========================================================
     AWWWARDS-TIER LAYER — additive only
     ========================================================= */

  const isTouch = !window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const isDesktop = window.matchMedia("(min-width: 881px)").matches;

  // ---------- 1. Page-load curtain ----------
  const curtain = document.getElementById("curtain");
  const curtainCounter = document.getElementById("curtainCounter");
  const body = document.body;

  if (curtain && !prefersReduce) {
    // Mobile = faster timing (mobile users bail quicker)
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const tickRate = isMobile ? 60 : 90;
    const tailDelay = isMobile ? 200 : 320;
    const loadDelay = isMobile ? 700 : 1100;
    const readyDelay = isMobile ? 1100 : 1600;
    const hardFallback = isMobile ? 2400 : 3500;

    let pct = 0;
    const tick = () => {
      pct += Math.random() * 14 + 4;
      if (pct > 99) pct = 99;
      if (curtainCounter) curtainCounter.textContent = String(Math.floor(pct)).padStart(2, "0");
      if (pct < 99) setTimeout(tick, tickRate);
    };
    tick();

    const finishCurtain = () => {
      if (curtainCounter) curtainCounter.textContent = "100";
      setTimeout(() => {
        curtain.classList.add("is-out");
        body.classList.remove("is-loading");
        setTimeout(() => curtain.remove(), 1400);
      }, tailDelay);
    };

    if (document.readyState === "complete") {
      setTimeout(finishCurtain, readyDelay);
    } else {
      window.addEventListener("load", () => setTimeout(finishCurtain, loadDelay));
      // Hard fallback
      setTimeout(finishCurtain, hardFallback);
    }
  } else if (curtain) {
    curtain.remove();
    body.classList.remove("is-loading");
  }

  // ---------- 4. Text scramble on section headings ----------
  if (!prefersReduce) {
    const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&@$/*";
    const scrambleEl = (el) => {
      const targetNodes = [];
      // Walk children to preserve italic/inline spans
      el.querySelectorAll("span").forEach((s) => {
        targetNodes.push({ node: s, text: s.textContent });
      });
      // If no spans, scramble the element itself
      if (targetNodes.length === 0) {
        targetNodes.push({ node: el, text: el.textContent });
      }
      const duration = 620;
      const start = performance.now();
      const originals = targetNodes.map((t) => t.text);

      const step = (now) => {
        const p = Math.min(1, (now - start) / duration);
        targetNodes.forEach((t, i) => {
          const original = originals[i];
          const reveal = Math.floor(original.length * p);
          let out = "";
          for (let k = 0; k < original.length; k++) {
            if (k < reveal || original[k] === " " || original[k] === "\n") {
              out += original[k];
            } else {
              out += CHARS[Math.floor(Math.random() * CHARS.length)];
            }
          }
          t.node.textContent = out;
        });
        if (p < 1) {
          requestAnimationFrame(step);
        } else {
          targetNodes.forEach((t, i) => (t.node.textContent = originals[i]));
        }
      };
      requestAnimationFrame(step);
    };

    const headings = document.querySelectorAll(
      ".approche .title-condensed, .services .title-condensed, .galerie .title-condensed"
    );
    if ("IntersectionObserver" in window) {
      const sio = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              scrambleEl(entry.target);
              sio.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.35 }
      );
      headings.forEach((h) => sio.observe(h));
    }
  }

  // ---------- 5. Smooth background color shift ----------
  if (!prefersReduce) {
    const bgStops = [
      { stop: 0, color: "#f5f3ee" },
      { stop: 0.35, color: "#f1eee5" },
      { stop: 0.6, color: "#f7ece6" },
      { stop: 0.85, color: "#f1eee5" },
      { stop: 1, color: "#f5f3ee" },
    ];
    const hex2rgb = (h) => {
      const n = parseInt(h.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };
    const lerpColor = (a, b, t) =>
      a.map((v, i) => Math.round(v + (b[i] - v) * t));
    const stopsRGB = bgStops.map((s) => ({ stop: s.stop, rgb: hex2rgb(s.color) }));
    let bgTicking = false;
    const updateBg = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      let a = stopsRGB[0];
      let b = stopsRGB[stopsRGB.length - 1];
      for (let i = 0; i < stopsRGB.length - 1; i++) {
        if (p >= stopsRGB[i].stop && p <= stopsRGB[i + 1].stop) {
          a = stopsRGB[i];
          b = stopsRGB[i + 1];
          break;
        }
      }
      const local = (p - a.stop) / Math.max(0.0001, b.stop - a.stop);
      const c = lerpColor(a.rgb, b.rgb, local);
      body.style.setProperty("--bg-current", `rgb(${c[0]}, ${c[1]}, ${c[2]})`);
      bgTicking = false;
    };
    window.addEventListener(
      "scroll",
      () => {
        if (!bgTicking) {
          requestAnimationFrame(updateBg);
          bgTicking = true;
        }
      },
      { passive: true }
    );
    updateBg();
  }

  // ---------- 6. Animated counters ----------
  if (!prefersReduce) {
    const trustNums = document.querySelectorAll(".trust-num");
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    const animateCounter = (el) => {
      const raw = el.textContent.trim();
      const m = raw.match(/^(\d+)(\+?)$/);
      if (!m) return;
      const target = parseInt(m[1], 10);
      const hasPlus = m[2] === "+";
      const duration = 1600;
      const start = performance.now();
      el.textContent = "0";
      const step = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const v = Math.round(easeOutCubic(t) * target);
        el.textContent = String(v);
        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          if (hasPlus) {
            el.innerHTML = String(target) + '<span class="counter-plus">+</span>';
            setTimeout(() => el.classList.add("counter-done"), 30);
          }
          el.classList.add("counter-flash");
          setTimeout(() => el.classList.remove("counter-flash"), 700);
        }
      };
      requestAnimationFrame(step);
    };
    if ("IntersectionObserver" in window) {
      const cio = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animateCounter(entry.target);
              cio.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );
      trustNums.forEach((n) => cio.observe(n));
    }
  }

  // ---------- 7. Service hover image preview ----------
  if (!isTouch && !prefersReduce) {
    const preview = document.createElement("div");
    preview.className = "service-preview";
    const previewImg = document.createElement("img");
    preview.appendChild(previewImg);
    document.body.appendChild(preview);

    const serviceImages = [
      "assets/post_DY2K74vTJbn.jpg",
      "assets/post_DXadp5iiS6i.jpg",
      "assets/post_DW19keSj7Dt.jpg",
      "assets/post_DWcTbhaj2Yc.jpg",
      "assets/carousel_1.jpg",
    ];
    const rows = document.querySelectorAll(".service-row");
    let px = window.innerWidth / 2;
    let py = window.innerHeight / 2;
    let tx = px;
    let ty = py;
    let raf = null;

    const loop = () => {
      px += (tx - px) * 0.18;
      py += (ty - py) * 0.18;
      preview.style.transform = `translate(${px}px, ${py}px) translate(-50%, -50%) scale(${preview.classList.contains("is-visible") ? 1 : 0.92})`;
      raf = requestAnimationFrame(loop);
    };

    rows.forEach((row, idx) => {
      row.addEventListener("mouseenter", () => {
        previewImg.src = serviceImages[idx % serviceImages.length];
        preview.classList.add("is-visible");
        if (!raf) raf = requestAnimationFrame(loop);
      });
      row.addEventListener("mouseleave", () => {
        preview.classList.remove("is-visible");
      });
      row.addEventListener("mousemove", (e) => {
        tx = e.clientX;
        ty = e.clientY;
      });
    });
  }

  // ---------- 10. Footer mega reveal ----------
  const footerMega = document.querySelector(".footer-mega");
  if (footerMega && "IntersectionObserver" in window) {
    const fio = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            fio.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25 }
    );
    fio.observe(footerMega);
  }

  // ---------- 11. Magnetic on gallery images ----------
  if (!isTouch && !prefersReduce) {
    document.querySelectorAll(".grid-item").forEach((el) => {
      const strength = 0.1;
      el.addEventListener("mousemove", (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "translate(0, 0)";
      });
    });
  }

  // ---------- 12. Cursor labels over gallery / services ----------
  const cursorEl = document.querySelector(".cursor");
  const cursorLabel = document.getElementById("cursorLabel");
  if (cursorEl && cursorLabel && !isTouch) {
    const setLabel = (text) => {
      cursorLabel.textContent = text;
      cursorEl.classList.add("is-label");
    };
    const clearLabel = () => {
      cursorEl.classList.remove("is-label");
    };
    document.querySelectorAll(".grid-item").forEach((el) => {
      el.addEventListener("mouseenter", () => setLabel("Voir"));
      el.addEventListener("mouseleave", clearLabel);
    });
    document.querySelectorAll(".service-row").forEach((el) => {
      el.addEventListener("mouseenter", () => setLabel("→"));
      el.addEventListener("mouseleave", clearLabel);
    });
  }

  // ---------- 13. Section lift ----------
  const lifts = document.querySelectorAll(".section-lift");
  if ("IntersectionObserver" in window && lifts.length) {
    const lio = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            lio.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" }
    );
    lifts.forEach((s) => lio.observe(s));
  } else {
    lifts.forEach((s) => s.classList.add("is-in"));
  }

  // ---------- Mobile sticky CTA bar ----------
  const mobileCta = document.getElementById("mobileCta");
  const heroEl = document.querySelector(".hero");
  if (mobileCta && heroEl) {
    let ctaVisible = false;
    let ctaTicking = false;
    const contactSection = document.getElementById("contact");
    const updateCta = () => {
      const heroBottom = heroEl.getBoundingClientRect().bottom;
      // Hide when contact section is in view (already showing CTA there)
      const contactTop = contactSection ? contactSection.getBoundingClientRect().top : Infinity;
      const shouldShow = heroBottom < 80 && contactTop > window.innerHeight * 0.5;
      if (shouldShow !== ctaVisible) {
        ctaVisible = shouldShow;
        mobileCta.classList.toggle("is-visible", shouldShow);
      }
      ctaTicking = false;
    };
    window.addEventListener(
      "scroll",
      () => {
        if (!ctaTicking) {
          requestAnimationFrame(updateCta);
          ctaTicking = true;
        }
      },
      { passive: true }
    );
    updateCta();
  }

  // ---------- 14. Hero mouse spotlight ----------
  const hero = document.querySelector(".hero");
  if (hero && !isTouch && !prefersReduce) {
    hero.classList.add("is-spot-active");
    hero.addEventListener("mousemove", (e) => {
      const rect = hero.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      hero.style.setProperty("--mx", x + "%");
      hero.style.setProperty("--my", y + "%");
    });
  }

  // ---------- 3. Horizontal scroll gallery (desktop only) ----------
  const galerie = document.querySelector(".galerie");
  const gridEl = galerie ? galerie.querySelector(".grid") : null;

  if (galerie && gridEl && isDesktop && !prefersReduce) {
    // Wrap gallery in horizontal-scroll structure
    const items = Array.from(gridEl.querySelectorAll(".grid-item"));
    // Limit to 6 items for horizontal flow
    const horizontalItems = items.slice(0, 6);

    const wrapper = document.createElement("div");
    wrapper.className = "grid-horizontal";

    const sticky = document.createElement("div");
    sticky.className = "grid-sticky";

    const track = document.createElement("div");
    track.className = "grid-track";

    const count = document.createElement("div");
    count.className = "grid-count";
    count.textContent = "01 / " + String(horizontalItems.length).padStart(2, "0");

    const progress = document.createElement("div");
    progress.className = "grid-progress";
    const progressBar = document.createElement("div");
    progressBar.className = "grid-progress-bar";
    progress.appendChild(progressBar);

    horizontalItems.forEach((item) => {
      track.appendChild(item);
    });

    sticky.appendChild(count);
    sticky.appendChild(track);
    sticky.appendChild(progress);
    wrapper.appendChild(sticky);

    // Remove leftover grid + replace
    gridEl.parentNode.insertBefore(wrapper, gridEl);
    gridEl.remove();
    galerie.classList.add("is-enhanced");

    // Drive horizontal transform from scroll position
    let lastP = -1;
    const updateGallery = () => {
      const rect = wrapper.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = wrapper.offsetHeight - vh;
      const scrolled = -rect.top;
      const p = Math.min(1, Math.max(0, scrolled / total));
      if (Math.abs(p - lastP) < 0.001) return;
      lastP = p;

      const trackWidth = track.scrollWidth;
      const viewWidth = window.innerWidth;
      const maxShift = trackWidth - viewWidth + 80;
      const shift = -p * Math.max(0, maxShift);
      track.style.transform = `translate3d(${shift}px, 0, 0)`;

      progressBar.style.width = (p * 100).toFixed(2) + "%";

      const idx = Math.min(
        horizontalItems.length,
        Math.floor(p * horizontalItems.length) + 1
      );
      count.textContent =
        String(idx).padStart(2, "0") +
        " / " +
        String(horizontalItems.length).padStart(2, "0");
    };

    let galTicking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (!galTicking) {
          requestAnimationFrame(() => {
            updateGallery();
            galTicking = false;
          });
          galTicking = true;
        }
      },
      { passive: true }
    );
    updateGallery();
  } else if (galerie) {
    // Mobile / reduced-motion: keep original grid + add parallax
    if (!prefersReduce && !isTouch) {
      const imgs = galerie.querySelectorAll(".grid-img img");
      imgs.forEach((img, i) => {
        img.classList.add("parallax-img");
        const speed = 0.04 + (i % 4) * 0.025;
        const onScroll = () => {
          const rect = img.getBoundingClientRect();
          const center = rect.top + rect.height / 2 - window.innerHeight / 2;
          const shift = -center * speed;
          const scale = 1 + Math.min(0.05, Math.max(0, (1 - Math.abs(center) / window.innerHeight) * 0.05));
          img.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
      });
    }
  }
})();
