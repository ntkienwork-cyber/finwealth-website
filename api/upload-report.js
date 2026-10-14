// Vercel serverless function — POST /api/upload-report
// Body (JSON): { password, date, title, summary, fileBase64?, companyNews?, marketOutlook?, liveUpdates? }
// fileBase64 (optional) is the PDF content encoded as base64 (no data: prefix).
// companyNews: [{ ticker, text }], marketOutlook: [paragraph, ...], liveUpdates: [item, ...]
// Protected by ADMIN_PASSWORD env var — set this in Vercel project settings
// before going live (Settings -> Environment Variables).
const { addReport } = require("../lib/reportsStore.blob");

const MAX_BYTES = 4 * 1024 * 1024; // keep comfortably under Vercel's 4.5MB body limit

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { password, date, title, summary, fileBase64, companyNews, marketOutlook, liveUpdates } = req.body || {};

  if (!process.env.ADMIN_PASSWORD) {
    res.status(500).json({ error: "Server chưa cấu hình ADMIN_PASSWORD — xem README.md." });
    return;
  }
  if (password !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: "Sai mật khẩu." });
    return;
  }
  if (!date || !title) {
    res.status(400).json({ error: "Thiếu ngày hoặc tiêu đề." });
    return;
  }

  let fileBuffer = null;
  if (fileBase64) {
    fileBuffer = Buffer.from(fileBase64, "base64");
    if (fileBuffer.length > MAX_BYTES) {
      res.status(413).json({ error: `File quá lớn (tối đa ${MAX_BYTES / 1024 / 1024}MB).` });
      return;
    }
  }

  try {
    const list = await addReport({
      date,
      title,
      summary: summary || "",
      fileBuffer,
      companyNews: companyNews || [],
      marketOutlook: marketOutlook || [],
      liveUpdates: liveUpdates || [],
    });
    res.status(200).json({ ok: true, reports: list });
  } catch (err) {
    res.status(500).json({ error: "Upload thất bại", detail: String(err) });
  }
};
