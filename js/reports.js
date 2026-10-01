// Finwealth — reports archive page: search + month filter

let ALL_REPORTS = [];

document.addEventListener("DOMContentLoaded", () => {
  const listEl = document.getElementById("reportsList");
  const emptyEl = document.getElementById("reportsEmpty");
  const searchInput = document.getElementById("searchInput");
  const monthFilter = document.getElementById("monthFilter");

  fetch("/api/reports")
    .then((r) => r.json())
    .then((reports) => {
      ALL_REPORTS = [...reports].sort((a, b) => b.date.localeCompare(a.date));
      populateMonthFilter(ALL_REPORTS, monthFilter);
      render();
    })
    .catch(() => {
      listEl.innerHTML = "";
      emptyEl.hidden = false;
      emptyEl.textContent =
        "Chưa tải được danh sách báo cáo. Trang này cần chạy qua server có hỗ trợ API (node server.js ở local, hoặc Vercel/Netlify khi deploy) — xem README.md.";
    });

  function render() {
    const q = (searchInput.value || "").toLowerCase().trim();
    const month = monthFilter.value;
    const filtered = ALL_REPORTS.filter((r) => {
      const matchesQuery = !q || r.title.toLowerCase().includes(q);
      const matchesMonth = !month || r.date.startsWith(month);
      return matchesQuery && matchesMonth;
    });

    if (filtered.length === 0) {
      listEl.innerHTML = "";
      emptyEl.hidden = false;
      emptyEl.textContent = "Không tìm thấy báo cáo phù hợp.";
    } else {
      emptyEl.hidden = true;
      listEl.innerHTML = filtered.map(renderReportRow).join("");
      listEl.querySelectorAll(".report-row").forEach((el, i) => window.revealOnScroll(el, (i % 6) * 40));
    }
  }

  searchInput.addEventListener("input", render);
  monthFilter.addEventListener("change", render);
});

function populateMonthFilter(reports, selectEl) {
  const months = [...new Set(reports.map((r) => r.date.slice(0, 7)))].sort().reverse();
  months.forEach((m) => {
    const [y, mo] = m.split("-");
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = `Tháng ${mo}/${y}`;
    selectEl.appendChild(opt);
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
