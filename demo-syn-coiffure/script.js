document.getElementById("yr").textContent = new Date().getFullYear();

const nav = document.querySelector(".nav");
document.querySelector(".burger")?.addEventListener("click", () => nav.classList.toggle("open"));
nav.querySelectorAll(".nav-links a").forEach((a) =>
  a.addEventListener("click", () => nav.classList.remove("open"))
);

const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const siblings = Array.from(el.parentElement.querySelectorAll(":scope > .reveal"));
        el.style.transitionDelay = `${Math.max(0, siblings.indexOf(el)) * 85}ms`;
        el.classList.add("in");
        io.unobserve(el);
      }
    });
  },
  { threshold: 0.1, rootMargin: "0px 0px -8% 0px" }
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
