// Vercel serverless function — GET /api/reports
const { readManifest } = require("../lib/reportsStore.blob");

module.exports = async (req, res) => {
  try {
    const list = await readManifest();
    // No caching: this list changes whenever Team Insight uploads/deletes a
    // report via /admin.html, and readers should see that immediately.
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(list);
  } catch (err) {
    res.status(500).json({ error: "Không tải được danh sách báo cáo", detail: String(err) });
  }
};
