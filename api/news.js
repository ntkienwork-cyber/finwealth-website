// Vercel serverless function — GET /api/news
// Deployed automatically by Vercel; no configuration needed.
const { fetchNews } = require("../lib/fetchNews");

module.exports = async (req, res) => {
  try {
    const data = await fetchNews();
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=1200");
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Không tải được tin tức", detail: String(err) });
  }
};
