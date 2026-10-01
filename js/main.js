// Finwealth — shared site behaviour (nav, footer year, latest reports teaser, contact form)

document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", () => {
      mainNav.classList.toggle("is-open");
    });
    mainNav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => mainNav.classList.remove("is-open"))
    );
  }

  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      alert(
        "Cảm ơn bạn! Form liên hệ đang ở chế độ demo — cần kết nối tới email/CRM trước khi dùng thật (xem README.md)."
      );
      contactForm.reset();
    });
  }

  initScrollReveal();
  initHeroParticles();

  const latestReportsEl = document.getElementById("latestReports");
  if (latestReportsEl) {
    fetch("/api/reports")
      .then((r) => r.json())
      .then((reports) => {
        const sorted = [...reports].sort((a, b) => b.date.localeCompare(a.date));
        latestReportsEl.innerHTML = sorted
          .slice(0, 3)
          .map((r) => renderReportRow(r))
          .join("");
      })
      .catch(() => {
        latestReportsEl.innerHTML =
          '<div class="reports-empty">Chưa tải được báo cáo. Vui lòng chạy website qua một máy chủ local (xem README.md).</div>';
      });
  }
});

let revealObserver = null;
function getRevealObserver() {
  if (!revealObserver) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
  }
  return revealObserver;
}

// Fades an element in as it scrolls into view. Call this on elements
// rendered after page load too (news cards, report rows, etc.).
window.revealOnScroll = function revealOnScroll(el, delay) {
  if (!el) return;
  el.classList.add("reveal");
  if (delay) el.style.transitionDelay = delay + "ms";
  getRevealObserver().observe(el);
};

function initScrollReveal() {
  const selectors = ".pillar-card, .service-card, .section-head, .zalo-card, .contact-form, .board-panel";
  document.querySelectorAll(selectors).forEach((el, i) => {
    window.revealOnScroll(el, (i % 4) * 60);
  });
}

// Rising gold particles inside .page-hero — evokes ascent/growth (ties into
// the "ascending pillars" brand mark). Skipped for reduced-motion users.
function initHeroParticles() {
  const heroes = document.querySelectorAll(".page-hero");
  if (!heroes.length) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  heroes.forEach((hero) => {
    const wrap = document.createElement("div");
    wrap.className = "hero-particles";
    wrap.setAttribute("aria-hidden", "true");
    const count = 12;
    for (let i = 0; i < count; i++) {
      const span = document.createElement("span");
      const size = 2 + Math.random() * 3;
      span.style.left = Math.random() * 100 + "%";
      span.style.width = size + "px";
      span.style.height = size + "px";
      span.style.animationDuration = 7 + Math.random() * 7 + "s";
      span.style.animationDelay = -(Math.random() * 10) + "s";
      wrap.appendChild(span);
    }
    hero.prepend(wrap);
  });
}

function formatDate(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function renderReportRow(r) {
  return `
    <div class="report-row">
      <div class="date">${formatDate(r.date)}</div>
      <div>
        <div class="title">${r.title}</div>
        <div class="summary">${r.summary || ""}</div>
      </div>
      <a class="dl" href="${r.file}" target="_blank" rel="noopener">Tải PDF</a>
    </div>`;
}
