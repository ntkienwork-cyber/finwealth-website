// Vercel serverless function — POST /api/delete-report
// Body (JSON): { password, file } — file is the report's blob URL (as shown in /api/reports)
const { deleteReport } = require("../lib/reportsStore.blob");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { password, file } = req.body || {};

  if (!process.env.ADMIN_PASSWORD) {
    res.status(500).json({ error: "Server chưa cấu hình ADMIN_PASSWORD — xem README.md." });
    return;
  }
  if (password !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: "Sai mật khẩu." });
    return;
  }
  if (!file) {
    res.status(400).json({ error: "Thiếu thông tin file cần xoá." });
    return;
  }

  try {
    const list = await deleteReport(file);
    res.status(200).json({ ok: true, reports: list });
  } catch (err) {
    res.status(500).json({ error: "Xoá thất bại", detail: String(err) });
  }
};
