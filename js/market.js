// Finwealth — custom VN-Index chart (16:9) + large-cap stock list.
// Renders its own SVG instead of embedding a third-party widget, so we
// control aspect ratio, colors and hover interaction. Data: /api/market
// (see lib/fetchMarket.js — sourced from FireAnt's public data API).

const CHART_W = 320;
const CHART_H = 180; // 320:180 = 16:9
const PAD_X = 4;
const PAD_TOP = 14;
const PAD_BOTTOM = 4;

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("marketBoard");
  if (!root) return;

  fetch("/api/market")
    .then((r) => {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then((data) => renderMarket(root, data))
    .catch(() => {
      root.innerHTML = '<div class="market-error">Chưa tải được dữ liệu thị trường.</div>';
    });
});

function fmtNumber(n, digits = 0) {
  return n.toLocaleString("vi-VN", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function fmtSigned(n, digits = 2) {
  const sign = n > 0 ? "+" : n < 0 ? "" : "";
  return sign + fmtNumber(n, digits);
}

function renderMarket(root, data) {
  const { index, stocks } = data;
  const up = index.change >= 0;
  const trendClass = up ? "up" : "down";
  const arrow = up ? "▲" : "▼";

  root.innerHTML = `
    <div class="market-head">
      <div class="market-head-symbol">${index.symbol}</div>
      <div class="market-head-value">${fmtNumber(index.current, 2)}</div>
      <div class="market-head-change ${trendClass}">${arrow} ${fmtSigned(index.change, 2)} (${fmtSigned(index.changePercent)}%)</div>
    </div>
    <div class="market-chart-wrap" id="marketChartWrap"></div>
    <ul class="market-stocks" id="marketStocks"></ul>
  `;

  renderChart(document.getElementById("marketChartWrap"), index.history, up);
  renderStocks(document.getElementById("marketStocks"), stocks);
}

function renderChart(container, history, up) {
  const values = history.map((d) => d.close);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const n = history.length;
  const innerW = CHART_W - PAD_X * 2;
  const innerH = CHART_H - PAD_TOP - PAD_BOTTOM;

  const points = history.map((d, i) => {
    const x = PAD_X + (i / (n - 1)) * innerW;
    const y = PAD_TOP + (1 - (d.close - min) / span) * innerH;
    return { x, y, date: d.date, close: d.close };
  });

  const lineColor = up ? "var(--market-up)" : "var(--market-down)";
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  const areaPath = `${linePath} L${points[n - 1].x.toFixed(2)},${CHART_H} L${points[0].x.toFixed(2)},${CHART_H} Z`;

  container.innerHTML = `
    <svg viewBox="0 0 ${CHART_W} ${CHART_H}" class="market-svg" preserveAspectRatio="none">
      <defs>
        <linearGradient id="marketFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${up ? "#0C3D30" : "#5A2323"}" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="${up ? "#0C3D30" : "#5A2323"}" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <path d="${areaPath}" fill="url(#marketFill)" />
      <path d="${linePath}" fill="none" stroke="${lineColor}" stroke-width="1.6" vector-effect="non-scaling-stroke" />
      <g id="marketHoverGroup" style="display:none">
        <line id="marketHoverLine" x1="0" y1="${PAD_TOP}" x2="0" y2="${CHART_H}" stroke="#B7BDC2" stroke-width="1" vector-effect="non-scaling-stroke" stroke-dasharray="2,2" />
        <circle id="marketHoverDot" r="3" fill="${lineColor}" />
      </g>
    </svg>
    <div class="market-tooltip" id="marketTooltip" hidden></div>
  `;

  const svg = container.querySelector(".market-svg");
  const hoverGroup = container.querySelector("#marketHoverGroup");
  const hoverLine = container.querySelector("#marketHoverLine");
  const hoverDot = container.querySelector("#marketHoverDot");
  const tooltip = container.querySelector("#marketTooltip");

  function pointerToIndex(clientX) {
    const rect = svg.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    return Math.round(ratio * (n - 1));
  }

  function showAt(i) {
    const p = points[i];
    hoverGroup.style.display = "block";
    hoverLine.setAttribute("x1", p.x);
    hoverLine.setAttribute("x2", p.x);
    hoverDot.setAttribute("cx", p.x);
    hoverDot.setAttribute("cy", p.y);

    const rect = svg.getBoundingClientRect();
    const pxX = (p.x / CHART_W) * rect.width;
    const pxY = (p.y / CHART_H) * rect.height;
    tooltip.hidden = false;
    tooltip.style.left = pxX + "px";
    tooltip.style.top = pxY + "px";
    const [y, m, d] = p.date.split("-");
    tooltip.textContent = `${d}/${m}: ${fmtNumber(p.close, 2)}`;
  }

  function hide() {
    hoverGroup.style.display = "none";
    tooltip.hidden = true;
  }

  svg.addEventListener("mousemove", (e) => showAt(pointerToIndex(e.clientX)));
  svg.addEventListener("mouseleave", hide);
  svg.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches[0]) showAt(pointerToIndex(e.touches[0].clientX));
    },
    { passive: true }
  );
  svg.addEventListener("touchend", hide);
}

function renderStocks(el, stocks) {
  el.innerHTML = stocks.map(stockRow).join("");
}

function stockRow(s) {
  const up = s.change >= 0;
  const trendClass = up ? "up" : "down";
  const arrow = up ? "▲" : "▼";
  return `
    <li class="market-stock-row">
      <div class="ms-symbol">${s.symbol}</div>
      <div class="ms-price">${fmtNumber(s.price, 0)}</div>
      <div class="ms-change ${trendClass}">${arrow} ${fmtSigned(s.change, 0)} <span>(${fmtSigned(s.changePercent)}%)</span></div>
    </li>`;
}
