// Reveal on scroll
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
);
document.querySelectorAll(".reveal").forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 70}ms`;
  io.observe(el);
});

// Mobile menu: smooth-scroll helper (nav links hidden on mobile, burger scrolls to services)
const burger = document.getElementById("burger");
if (burger) {
  burger.addEventListener("click", () => {
    document.getElementById("services").scrollIntoView({ behavior: "smooth" });
  });
}

// Current year
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();
