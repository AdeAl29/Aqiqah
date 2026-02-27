const header = document.querySelector(".header");
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const navAnchors = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
const backToTop = document.getElementById("backToTop");

// Basic event tracker (works with GTM dataLayer if present).
const trackEvent = (eventName, data = {}) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: eventName, ...data });
};

document.querySelectorAll("[data-track]").forEach((el) => {
  el.addEventListener("click", () => {
    trackEvent("cta_click", { cta_id: el.dataset.track });
  });
});

// Navbar style + back to top visibility on scroll.
const handleScrollUI = () => {
  header.classList.toggle("scrolled", window.scrollY > 18);
  backToTop?.classList.toggle("show", window.scrollY > 480);
};

window.addEventListener("scroll", handleScrollUI);
handleScrollUI();

// Mobile menu toggle.
if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    menuToggle.classList.toggle("active", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

// Smooth scroll navigation.
navAnchors.forEach((anchor) => {
  anchor.addEventListener("click", (event) => {
    event.preventDefault();
    const targetId = anchor.getAttribute("href");
    const targetEl = targetId ? document.querySelector(targetId) : null;

    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
      trackEvent("nav_click", { target: targetId });
    }

    navLinks?.classList.remove("open");
    menuToggle?.classList.remove("active");
    menuToggle?.setAttribute("aria-expanded", "false");
  });
});

// Active nav link by visible section.
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const sectionId = entry.target.getAttribute("id");
      navAnchors.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${sectionId}`);
      });
    });
  },
  { threshold: 0.55, rootMargin: "-20% 0px -20% 0px" }
);

navAnchors.forEach((link) => {
  const section = document.querySelector(link.getAttribute("href"));
  if (section) sectionObserver.observe(section);
});

// Stagger reveal delay for card-based blocks.
const staggerItems = document.querySelectorAll(
  ".feature-card, .pricing-card, .process-step, .testimonial-card, .photo-gallery-slide, .faq-item"
);
staggerItems.forEach((el, index) => {
  const delay = (index % 4) * 90;
  el.style.setProperty("--delay", `${delay}ms`);
});

// Fade/slide reveal on scroll.
const revealElements = document.querySelectorAll(".reveal");
const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("show");
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.14 }
);
revealElements.forEach((el) => revealObserver.observe(el));

// Generic slider with auto-play + dots + swipe.
const sliderBlocks = document.querySelectorAll("[data-slider]");

sliderBlocks.forEach((sliderBlock) => {
  const sliderTrack = sliderBlock.querySelector("[data-slider-track]");
  const dotsContainer = sliderBlock.querySelector("[data-slider-dots]");
  if (!sliderTrack || !dotsContainer) return;

  const slides = Array.from(sliderTrack.children);
  if (slides.length === 0) return;

  const sliderLabel = sliderBlock.dataset.sliderLabel || "slide";
  const speedFromData = Number.parseInt(sliderBlock.dataset.sliderSpeed || "2500", 10);
  const autoPlayMs = Number.isFinite(speedFromData) && speedFromData > 1200 ? speedFromData : 2500;
  let currentIndex = 0;
  let autoplayTimer;
  let touchStartX = 0;
  let touchEndX = 0;

  dotsContainer.innerHTML = "";

  const updateDots = () => {
    dotsContainer.querySelectorAll(".slider-dot").forEach((dot, idx) => {
      dot.classList.toggle("active", idx === currentIndex);
    });
  };

  const goToSlide = (index) => {
    currentIndex = (index + slides.length) % slides.length;
    sliderTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
    updateDots();
  };

  const startAutoplay = () => {
    window.clearInterval(autoplayTimer);
    if (slides.length < 2) return;
    autoplayTimer = window.setInterval(() => {
      goToSlide(currentIndex + 1);
    }, autoPlayMs);
  };

  const restartAutoplay = () => {
    window.clearInterval(autoplayTimer);
    startAutoplay();
  };

  slides.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.className = "slider-dot";
    dot.type = "button";
    dot.setAttribute("aria-label", `Lihat ${sliderLabel} ${index + 1}`);
    dot.addEventListener("click", () => {
      goToSlide(index);
      restartAutoplay();
    });
    dotsContainer.appendChild(dot);
  });

  sliderTrack.addEventListener(
    "touchstart",
    (event) => {
      touchStartX = event.changedTouches[0].clientX;
    },
    { passive: true }
  );

  sliderTrack.addEventListener(
    "touchend",
    (event) => {
      touchEndX = event.changedTouches[0].clientX;
      const deltaX = touchEndX - touchStartX;
      if (Math.abs(deltaX) > 44) {
        goToSlide(deltaX < 0 ? currentIndex + 1 : currentIndex - 1);
        restartAutoplay();
      }
    },
    { passive: true }
  );

  goToSlide(0);
  startAutoplay();
});

// Back to top.
backToTop?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
  trackEvent("back_to_top_click");
});

// Mini lead form -> open WhatsApp with filled values.
const quickLeadForm = document.getElementById("quickLeadForm");
quickLeadForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(quickLeadForm);
  const nama = String(formData.get("nama") || "").trim();
  const tanggal = String(formData.get("tanggal") || "").trim();
  const paket = String(formData.get("paket") || "").trim();

  const message = [
    "Assalamu'alaikum, saya ingin konsultasi Aqiqah dan Qurban.",
    `Nama: ${nama}`,
    `Tanggal Pelaksanaan: ${tanggal}`,
    `Pilihan Layanan: ${paket}`
  ].join("\n");

  const waUrl = `https://wa.me/6282192570822?text=${encodeURIComponent(message)}`;
  trackEvent("lead_form_submit", { nama, tanggal, paket });
  window.open(waUrl, "_blank", "noopener");
});

// Scroll depth tracking.
const depthMarks = [25, 50, 75, 100];
const sentDepths = new Set();
window.addEventListener("scroll", () => {
  const scrollTop = window.scrollY;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (maxScroll <= 0) return;
  const depth = Math.round((scrollTop / maxScroll) * 100);

  depthMarks.forEach((mark) => {
    if (depth >= mark && !sentDepths.has(mark)) {
      sentDepths.add(mark);
      trackEvent("scroll_depth", { depth_percent: mark });
    }
  });
});

