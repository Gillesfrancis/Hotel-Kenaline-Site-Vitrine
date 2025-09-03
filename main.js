/* scripts/main.js
   Mobile-first JS: nav toggle, smooth scroll, lazy-loading, gallery slider,
   WhatsApp prefill + booking UI, simple form handling, header shrink, small animations.
*/
(function () {
  "use strict";

  /* CONFIG */
  const cfg = window.__SITE_CONFIG || {
    phone: "REPLACE_WITH_PHONE",
    wa_base: "https://wa.me/REPLACE_WITH_PHONE?text=",
    hotel_name: "Kenaline La Grâce",
  };

  /* Utilities */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* Header shrink on scroll */
  const header = $("#header");
  let lastScroll = 0;
  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY;
      if (y > 60) header.classList.add("scrolled");
      else header.classList.remove("scrolled");
      lastScroll = y;
    },
    { passive: true }
  );

  /* Nav toggle for mobile */
  const navToggle = $("#nav-toggle");
  const navList = $("#nav-list");
  if (navToggle) {
    navToggle.addEventListener("click", () => {
      const expanded = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", !expanded);
      navList.style.display = expanded ? "" : "block";
    });
  }

  /* Smooth scroll for anchor links & active state */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href || href === "#") return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        // close mobile nav
        if (
          navToggle &&
          window.getComputedStyle(navToggle).display !== "none"
        ) {
          navList.style.display = "none";
          navToggle.setAttribute("aria-expanded", "false");
        }
      }
    });
  });

  /* Lazy-loading images and videos using IntersectionObserver */
  const lazyImages = $$("img.lazy");
  const lazyVideos = $$("video.lazy-vid");
  const ioOptions = { root: null, rootMargin: "200px", threshold: 0.01 };
  const imgObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      const src = img.dataset.src;
      if (src) {
        img.src = src;
        img.removeAttribute("data-src");
        img.classList.remove("lazy");
      }
      obs.unobserve(img);
    });
  }, ioOptions);
  lazyImages.forEach((img) => imgObserver.observe(img));

  const vidObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const v = entry.target;
      // replace children sources if provided via data attributes (already in markup)
      // do not autoplay to save mobile data
      v.preload = "metadata";
      obs.unobserve(v);
    });
  }, ioOptions);
  lazyVideos.forEach((v) => vidObserver.observe(v));

  /* Simple gallery slider (no external lib) */
  function initGallery() {
    const wrapper = document.querySelector(".swiper-wrapper");
    const slides = wrapper ? Array.from(wrapper.children) : [];
    if (!wrapper || slides.length === 0) return;
    const prev = document.querySelector(".swiper-btn.prev");
    const next = document.querySelector(".swiper-btn.next");
    let idx = 0;

    function update() {
      const width = slides[0].getBoundingClientRect().width + 8;
      wrapper.style.transform = `translateX(-${idx * width}px)`;
    }

    prev &&
      prev.addEventListener("click", () => {
        idx = Math.max(0, idx - 1);
        update();
      });
    next &&
      next.addEventListener("click", () => {
        idx = Math.min(slides.length - 1, idx + 1);
        update();
      });

    window.addEventListener("resize", update);
    // touch support (swipe)
    let startX = 0,
      deltaX = 0;
    wrapper.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
    });
    wrapper.addEventListener("touchmove", (e) => {
      deltaX = e.touches[0].clientX - startX;
    });
    wrapper.addEventListener("touchend", () => {
      if (Math.abs(deltaX) > 50) {
        idx =
          deltaX > 0
            ? Math.max(0, idx - 1)
            : Math.min(slides.length - 1, idx + 1);
        update();
      }
      deltaX = 0;
    });
    update();
  }
  initGallery();

  /* Simple star animation based on rating (for demo) */
  (function stars() {
    const stars = document.querySelector(".stars");
    if (!stars) return;
    const score = parseFloat(stars.dataset.score || 4.6);
    const pct = (Math.max(0, Math.min(5, score)) / 5) * 100;
    // Use gradient width to visually represent stars (CSS trick)
    stars.style.background = `linear-gradient(90deg, #FFD166 ${pct}%, rgba(0,0,0,0.06) ${pct}%)`;
  })();

  /* CONTACT FORM (client-side only) */
  const contactForm = $("#contactForm");
  const contactMsg = $("#contactFormMsg");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      // simple validation
      const name = contactForm.name.value.trim();
      const email = contactForm.email.value.trim();
      const message = contactForm.message.value.trim();
      if (!name || !email || !message) {
        contactMsg.textContent = "Veuillez remplir tous les champs.";
        return;
      }
      contactMsg.textContent =
        "Message envoyé (demo). Nous vous répondrons sur votre email.";
      contactForm.reset();
    });
  }

  /* BOOK via WhatsApp prefill */
  // Booking inputs UI (simple prompt-based fallback)
  function openWhatsAppBooking(preselectedRoom) {
    // Try to get values from a (potential) booking UI. If none, use prompt fallback.
    const start = prompt("Date début (ex: 2025-09-10)", "");
    const end = prompt("Date fin (ex: 2025-09-12)", "");
    const nights = start && end ? "" : "";
    const adults = prompt("Nombre d'adultes", "1");
    const children = prompt("Nombre d'enfants", "0");
    const name = prompt("Votre nom", "");
    const specifics = prompt("Besoins spécifiques (optionnel)", "");

    const room = preselectedRoom || "Non spécifié";
    const message = `Bonjour ${
      cfg.hotel_name
    }, je souhaite réserver la chambre ${room} du ${
      start || "[DATE_DÉBUT]"
    } au ${end || "[DATE_FIN]"} pour ${adults || "[NB_ADULTES]"} adultes et ${
      children || "[NB_ENFANTS]"
    } enfants. Mon nom : ${name || "[Nom]"}. Besoin spécifique : ${
      specifics || "Aucun"
    }.`;

    // Encode and open
    const encoded = encodeURIComponent(message);
    const waUrl =
      cfg.wa_base
        .replace("REPLACE_WITH_PHONE", cfg.phone)
        .replace("REPLACE_WITH_PHONE", cfg.phone) + encoded;
    window.open(waUrl, "_blank", "noopener");
  }

  // Wire up all book buttons
  $$(".btn-book").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const room = btn.dataset.room || btn.closest(".room-card").dataset.type;
      openWhatsAppBooking(room);
    });
  });

  // Hero & header book buttons
  const heroBook = $("#heroBookBtn");
  const stickyBook = $("#stickyBookBtn");
  const mobileCTABtn = $("#mobileWhatsAppCTABtn");
  [heroBook, stickyBook, mobileCTABtn].forEach((el) => {
    if (!el) return;
    el.addEventListener("click", (ev) => {
      ev.preventDefault();
      openWhatsAppBooking();
    });
  });

  /* Dismiss alert */
  const dismissAlert = $("#dismissAlert");
  if (dismissAlert) {
    dismissAlert.addEventListener("click", () => {
      document.querySelector(".alert-bar").style.display = "none";
    });
  }

  /* small accessibility & polish */
  // Fill year
  document.getElementById("year").textContent = new Date().getFullYear();

  // Prefetch hero video on idle
  if ("requestIdleCallback" in window) {
    requestIdleCallback(() => {
      const v = document.getElementById("heroVideo");
      if (v && v.preload !== "auto") v.preload = "auto";
    });
  }

  // No global leaks: everything inside IIFE
})();
