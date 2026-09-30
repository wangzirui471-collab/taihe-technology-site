import "./fov-demo.js";

const menuToggle = document.querySelector("[data-menu-toggle]");
const siteNavigation = document.querySelector("[data-site-nav]");

function closeNavigation() {
  if (!menuToggle || !siteNavigation) return;
  menuToggle.setAttribute("aria-expanded", "false");
  siteNavigation.classList.remove("is-open");
}

if (menuToggle && siteNavigation) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    siteNavigation.classList.toggle("is-open", !isOpen);
  });

  siteNavigation.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) {
      closeNavigation();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeNavigation();
  });
}

for (const year of document.querySelectorAll("[data-current-year]")) {
  year.textContent = String(new Date().getFullYear());
}

