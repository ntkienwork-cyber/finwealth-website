// Local development server — mirrors what Vercel does in production:
// serves the static site AND handles the /api/* routes using local
// filesystem storage (see lib/reportsStore.local.js). Run with:  node server.js
// This file is NOT used in production — Vercel uses api/*.js (backed by
// Vercel Blob storage, see lib/reportsStore.blob.js) instead.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { fetchNews } = require("./lib/fetchNews");
const { fetchMarket } = require("./lib/fetchMarket");
const reportsStore = require("./lib/reportsStore.local");

const PORT = process.env.PORT || 8080;
const ROOT = __dirname;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "finwealth-admin-2026";

if (!process.env.ADMIN_PASSWORD) {
  console.log(`[dev] Chưa đặt biến ADMIN_PASSWORD — dùng mật khẩu mặc định cho local: "${ADMIN_PASSWORD}"`);
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
};

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, statusCode, obj) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(obj));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === "/api/news") {
    try {
      const data = await fetchNews();
      sendJson(res, 200, data);
    } catch (err) {
      sendJson(res, 500, { error: "Không tải được tin tức", detail: String(err) });
    }
    return;
  }

  if (url.pathname === "/api/market") {
    try {
      const data = await fetchMarket();
      sendJson(res, 200, data);
    } catch (err) {
      sendJson(res, 500, { error: "Không tải được dữ liệu thị trường", detail: String(err) });
    }
    return;
  }

  if (url.pathname === "/api/reports" && req.method === "GET") {
    sendJson(res, 200, reportsStore.readManifest());
    return;
  }

  if (url.pathname === "/api/upload-report" && req.method === "POST") {
    try {
      const { password, date, title, summary, fileBase64 } = await readJsonBody(req);
      if (password !== ADMIN_PASSWORD) {
        sendJson(res, 401, { error: "Sai mật khẩu." });
        return;
      }
      if (!date || !title || !fileBase64) {
        sendJson(res, 400, { error: "Thiếu ngày, tiêu đề hoặc file PDF." });
        return;
      }
      const fileBuffer = Buffer.from(fileBase64, "base64");
      const list = reportsStore.addReport({ date, title, summary: summary || "", fileBuffer });
      sendJson(res, 200, { ok: true, reports: list });
    } catch (err) {
      sendJson(res, 500, { error: "Upload thất bại", detail: String(err) });
    }
    return;
  }

  if (url.pathname === "/api/delete-report" && req.method === "POST") {
    try {
      const { password, file } = await readJsonBody(req);
      if (password !== ADMIN_PASSWORD) {
        sendJson(res, 401, { error: "Sai mật khẩu." });
        return;
      }
      const list = reportsStore.deleteReport(file);
      sendJson(res, 200, { ok: true, reports: list });
    } catch (err) {
      sendJson(res, 500, { error: "Xoá thất bại", detail: String(err) });
    }
    return;
  }

  let filePath = path.join(ROOT, decodeURIComponent(url.pathname));
  if (url.pathname === "/") filePath = path.join(ROOT, "index.html");

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("404 Not Found: " + url.pathname);
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`Finwealth local dev server: http://localhost:${PORT}`);
});
