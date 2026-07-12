// Year
document.getElementById("yr").textContent = new Date().getFullYear();

// Mobile menu
const nav = document.querySelector(".nav");
const burger = document.querySelector(".burger");
burger?.addEventListener("click", () => nav.classList.toggle("open"));
nav.querySelectorAll(".nav-links a").forEach((a) =>
  a.addEventListener("click", () => nav.classList.remove("open"))
);

// Staggered scroll reveals
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        // stagger siblings within the same container
        const siblings = Array.from(el.parentElement.querySelectorAll(":scope > .reveal"));
        const idx = siblings.indexOf(el);
        el.style.transitionDelay = `${Math.max(0, idx) * 90}ms`;
        el.classList.add("in");
        io.unobserve(el);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
