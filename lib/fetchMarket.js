// Finwealth — VN-Index history + large-cap stock quotes, sourced from
// FireAnt's public data API (the same one their embeddable widgets use).
// Used to render our own chart/table instead of embedding FireAnt's iframe,
// so we control layout, aspect ratio and styling.

const INDEX_SYMBOL = "HOSTC"; // FireAnt's internal code for the VN-Index (HOSE composite)
const INDEX_LABEL = "VN-INDEX";
const STOCK_SYMBOLS = ["VCB", "VIC", "HPG", "FPT", "VNM", "VHM"];
const HISTORY_MONTHS = 6;

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; FinwealthMarketBot/1.0)",
  Referer: "https://www.fireant.vn/",
};

function formatDate(d) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

async function fetchHistory() {
  const end = new Date();
  const start = new Date(end);
  start.setMonth(start.getMonth() - HISTORY_MONTHS);

  const url = `https://www.fireant.vn/api/Data/Markets/HistoricalQuotes?symbol=${INDEX_SYMBOL}&startDate=${formatDate(
    start
  )}&endDate=${formatDate(end)}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HistoricalQuotes trả về HTTP ${res.status}`);
  const raw = await res.json();
  return raw
    .map((d) => ({ date: d.Date.slice(0, 10), close: d.Close }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function fetchQuotes() {
  const url = `https://www.fireant.vn/api/Data/Markets/Quotes?symbols=${STOCK_SYMBOLS.join(",")}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`Quotes trả về HTTP ${res.status}`);
  return res.json();
}

async function fetchMarket() {
  const [history, quotes] = await Promise.all([fetchHistory(), fetchQuotes()]);

  if (history.length < 2) throw new Error("Không đủ dữ liệu lịch sử VN-Index");

  const last = history[history.length - 1];
  const prev = history[history.length - 2];
  const change = last.close - prev.close;
  const changePercent = (change / prev.close) * 100;

  const bySymbol = {};
  quotes.forEach((q) => (bySymbol[q.Symbol] = q));
  const stocks = STOCK_SYMBOLS.map((sym) => {
    const q = bySymbol[sym];
    if (!q) return null;
    return {
      symbol: sym,
      name: q.Name,
      price: q.PriceCurrent,
      change: q.PriceChange,
      changePercent: q.PricePercentChange * 100,
    };
  }).filter(Boolean);

  return {
    updatedAt: new Date().toISOString(),
    index: {
      symbol: INDEX_LABEL,
      current: last.close,
      change,
      changePercent,
      history,
    },
    stocks,
  };
}

module.exports = { fetchMarket };
