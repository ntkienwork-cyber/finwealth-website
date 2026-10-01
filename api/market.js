// Vercel serverless function — GET /api/market
const { fetchMarket } = require("../lib/fetchMarket");

module.exports = async (req, res) => {
  try {
    const data = await fetchMarket();
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=900");
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Không tải được dữ liệu thị trường", detail: String(err) });
  }
};
