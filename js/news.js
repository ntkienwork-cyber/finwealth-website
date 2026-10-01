// Finwealth — homepage news feed (fetches /api/news, a serverless function
// that aggregates RSS from a few trusted sources — see lib/fetchNews.js)

document.addEventListener("DOMContentLoaded", () => {
  const feedEl = document.getElementById("newsFeed");
  const noteEl = document.getElementById("updatedNote");
  if (!feedEl) return;

  fetch("/api/news")
    .then((r) => {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then((data) => {
      if (!data.items || data.items.length === 0) {
        feedEl.innerHTML = '<div class="news-loading">Chưa có tin tức nào.</div>';
        noteEl.textContent = "";
        return;
      }
      feedEl.innerHTML = data.items.map(renderNewsCard).join("");
      noteEl.innerHTML = `Cập nhật lúc ${formatTime(data.updatedAt)}<span class="dot">•</span>Nguồn: VnExpress, CafeF, VnEconomy`;
      feedEl.querySelectorAll(".news-card").forEach((el, i) => window.revealOnScroll(el, (i % 6) * 40));
    })
    .catch(() => {
      feedEl.innerHTML = `
        <div class="news-error">
          Chưa tải được tin tức. Tính năng này cần chạy qua server có hỗ trợ API
          (xem <code>node server.js</code> để chạy thử ở local, hoặc README.md để deploy lên Vercel/Netlify).
        </div>`;
      noteEl.textContent = "";
    });
});

function formatTime(iso) {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  return `${hh}:${mm} ${dd}/${mo}`;
}

function renderNewsCard(item) {
  const time = item.timestamp ? formatTime(new Date(item.timestamp).toISOString()) : "";
  return `
    <a class="news-card" href="${item.link}" target="_blank" rel="noopener">
      <div class="news-card-meta">
        <span class="news-source">${item.source}</span>
        <span class="news-time">${time}</span>
      </div>
      <h3>${item.title}</h3>
      <p>${item.summary}${item.summary && item.summary.length >= 200 ? "…" : ""}</p>
    </a>`;
}
