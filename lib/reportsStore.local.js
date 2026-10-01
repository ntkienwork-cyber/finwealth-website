// Finwealth — local filesystem-based reports store, used only by server.js
// for local preview. Production (Vercel) uses lib/reportsStore.blob.js instead.
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const MANIFEST_FILE = path.join(ROOT, "data", "reports.json");
const REPORTS_DIR = path.join(ROOT, "reports");

function readManifest() {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST_FILE, "utf-8"));
  } catch (err) {
    return [];
  }
}

function writeManifest(list) {
  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(list, null, 2));
}

function slugify(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

function addReport({ date, title, summary, fileBuffer }) {
  const fileName = `${date}-${slugify(title) || "bao-cao"}.pdf`;
  fs.writeFileSync(path.join(REPORTS_DIR, fileName), fileBuffer);

  const relativePath = `reports/${fileName}`;
  const list = readManifest().filter((r) => r.file !== relativePath);
  list.push({ date, title, summary, file: relativePath });
  list.sort((a, b) => b.date.localeCompare(a.date));
  writeManifest(list);
  return list;
}

function deleteReport(file) {
  const list = readManifest();
  const remaining = list.filter((r) => r.file !== file);
  const filePath = path.join(ROOT, file);
  if (filePath.startsWith(REPORTS_DIR)) {
    fs.unlink(filePath, () => {});
  }
  writeManifest(remaining);
  return remaining;
}

module.exports = { readManifest, writeManifest, addReport, deleteReport };
