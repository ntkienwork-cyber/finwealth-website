// Finwealth — aggregates daily market news from a few trusted Vietnamese
// financial news outlets via their public RSS feeds. Only a short excerpt
// + link back to the original article is shown (no full-text reproduction),
// with the source name always displayed for attribution.
//
// To add/remove a source, edit SOURCES below.

const SOURCES = [
  { name: "VnExpress", url: "https://vnexpress.net/rss/kinh-doanh.rss" },
  { name: "CafeF", url: "https://cafef.vn/thi-truong-chung-khoan.rss" },
  { name: "VnEconomy", url: "https://vneconomy.vn/chung-khoan.rss" },
];

const ITEMS_PER_SOURCE = 8;
const MAX_ITEMS = 24;
const SUMMARY_LENGTH = 200;

function stripCdata(value) {
  if (!value) return "";
  return value.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
}

function stripHtml(value) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? stripCdata(match[1]) : "";
}

async function fetchSource(source) {
  const res = await fetch(source.url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; FinwealthNewsBot/1.0)" },
  });
  if (!res.ok) throw new Error(`${source.name} trả về HTTP ${res.status}`);
  const xml = await res.text();
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/g) || [];

  return itemBlocks.slice(0, ITEMS_PER_SOURCE).map((block) => {
    const title = extractTag(block, "title");
    const link = extractTag(block, "link");
    const pubDate = extractTag(block, "pubDate");
    const summary = stripHtml(extractTag(block, "description")).slice(0, SUMMARY_LENGTH);
    const timestamp = new Date(pubDate).getTime();
    return {
      source: source.name,
      title,
      link,
      pubDate,
      summary,
      timestamp: Number.isFinite(timestamp) ? timestamp : 0,
    };
  });
}

async function fetchNews() {
  const settled = await Promise.allSettled(SOURCES.map(fetchSource));
  let items = [];
  const errors = [];

  settled.forEach((result, i) => {
    if (result.status === "fulfilled") {
      items = items.concat(result.value);
    } else {
      errors.push({ source: SOURCES[i].name, error: String(result.reason) });
    }
  });

  items.sort((a, b) => b.timestamp - a.timestamp);

  return {
    updatedAt: new Date().toISOString(),
    items: items.slice(0, MAX_ITEMS),
    errors,
  };
}

module.exports = { fetchNews, SOURCES };
