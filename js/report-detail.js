// Finwealth — report detail page: renders one day's report (news + outlook + live feed)
// from the same /api/reports data the archive list (js/reports.js) uses.

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const date = params.get("d");
  const errorEl = document.getElementById("reportError");
  const bodyEl = document.getElementById("reportBody");

  if (!date) {
    showError("Thiếu ngày báo cáo trong liên kết.");
    return;
  }

  fetch("/api/reports")
    .then((r) => r.json())
    .then((reports) => {
      const report = reports.find((r) => r.date === date);
      if (!report) {
        showError("Không tìm thấy báo cáo cho ngày này.");
        return;
      }
      render(report);
    })
    .catch(() => showError("Không tải được báo cáo. Vui lòng thử lại sau."));

  function showError(message) {
    document.getElementById("reportTitle").textContent = "Không tìm thấy báo cáo";
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function render(r) {
    document.title = `${r.title} — Finwealth`;
    document.getElementById("reportDateLabel").textContent = `Báo cáo ngày ${formatDate(r.date)}`;
    document.getElementById("reportTitle").textContent = r.title;
    document.getElementById("reportSummary").textContent = r.summary || "";
    bodyEl.hidden = false;

    const companyNews = r.companyNews || [];
    const marketOutlook = r.marketOutlook || [];
    const liveUpdates = r.liveUpdates || [];

    if (companyNews.length) {
      document.getElementById("tin-tuc").hidden = false;
      document.getElementById("jumpNews").hidden = false;
      document.getElementById("companyNewsGrid").innerHTML = companyNews
        .map((item, i) => renderNewsItem(item, i + 1))
        .join("");
    }

    if (marketOutlook.length) {
      document.getElementById("nhan-dinh").hidden = false;
      document.getElementById("jumpOutlook").hidden = false;
      document.getElementById("marketOutlook").innerHTML = marketOutlook
        .map((p) => `<p>${renderInline(p)}</p>`)
        .join("");
    } else {
      document.getElementById("nhan-dinh").hidden = true;
    }

    if (liveUpdates.length) {
      document.getElementById("cap-nhat").hidden = false;
      document.getElementById("jumpLive").hidden = false;
      document.getElementById("liveFeed").innerHTML = liveUpdates
        .map((item) => `<li>${renderInline(item)}</li>`)
        .join("");
    }

    if (r.file) {
      const pdfLink = document.createElement("a");
      pdfLink.href = r.file;
      pdfLink.target = "_blank";
      pdfLink.rel = "noopener";
      pdfLink.className = "jump-pill";
      pdfLink.textContent = "Tải PDF đầy đủ";
      document.getElementById("shareBtn").insertAdjacentElement("beforebegin", pdfLink);
    }

    document.querySelectorAll(".company-news-item, .market-outlook p, .live-feed li").forEach((el, i) => {
      window.revealOnScroll(el, (i % 8) * 30);
    });

    document.getElementById("shareBtn").addEventListener("click", async () => {
      const btn = document.getElementById("shareBtn");
      const original = btn.textContent;
      const flash = (label) => {
        btn.textContent = label;
        setTimeout(() => (btn.textContent = original), 2000);
      };

      try {
        await navigator.clipboard.writeText(window.location.href);
        flash("Đã sao chép liên kết!");
      } catch (err) {
        if (copyViaHiddenTextarea(window.location.href)) {
          flash("Đã sao chép liên kết!");
        } else {
          flash("Không sao chép được — xem URL trên thanh địa chỉ");
        }
      }
    });
  }
});

function copyViaHiddenTextarea(text) {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch (err) {
    return false;
  }
}

function renderNewsItem(item, index) {
  return `
    <div class="company-news-item">
      <span class="ticker-badge">${escapeHtml(item.ticker || "")}</span>
      <div>
        <span class="news-index">Tin ${index}</span>
        <p>${escapeHtml(item.text || "")}</p>
      </div>
    </div>`;
}

// Supports simple **bold** markup for emphasis within free-text fields.
function renderInline(text) {
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, '<strong class="hl">$1</strong>');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatDate(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
