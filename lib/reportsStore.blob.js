// Finwealth — reports manifest + PDF storage on Vercel Blob (production).
// Local dev uses server.js's own filesystem-based implementation instead.
//
// Why the manifest is never overwritten in place: Vercel Blob serves public
// blobs through a CDN, which can keep serving a cached response for the same
// URL for up to a minute (the SDK's `useCache:false` option does not prevent
// this — it only affects the SDK's own metadata path). Read-modify-write on a
// single fixed pathname under that caching can silently undo a change made
// moments earlier (e.g. resurrect a report someone just deleted). Instead,
// every write creates a NEW timestamped file, and reads always `list()` and
// pick the latest — list() reflects the store's real state immediately,
// unlike a cached content fetch. Older manifest versions are cleaned up
// right after each write.
const { put, del, list } = require("@vercel/blob");

const MANIFEST_PREFIX = "data/reports-";

async function readManifest() {
  try {
    const { blobs } = await list({ prefix: MANIFEST_PREFIX });
    if (!blobs || blobs.length === 0) return [];
    const latest = blobs.reduce((a, b) => (a.uploadedAt > b.uploadedAt ? a : b));
    const res = await fetch(latest.url, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    return [];
  }
}

async function writeManifest(list_) {
  const pathname = `${MANIFEST_PREFIX}${Date.now()}.json`;
  await put(pathname, JSON.stringify(list_, null, 2), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json",
  });

  // Clean up older manifest versions so blobs don't accumulate forever.
  try {
    const { blobs } = await list({ prefix: MANIFEST_PREFIX });
    const stale = blobs.filter((b) => b.pathname !== pathname).map((b) => b.url);
    if (stale.length) await del(stale);
  } catch (err) {
    // Non-fatal: a leftover old manifest version doesn't break reads,
    // readManifest() always picks the most recently uploaded one.
  }
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

async function addReport({ date, title, summary, fileBuffer }) {
  const pathname = `reports/${date}-${slugify(title) || "bao-cao"}.pdf`;
  const blob = await put(pathname, fileBuffer, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/pdf",
  });

  const current = await readManifest();
  const filtered = current.filter((r) => r.file !== blob.url);
  filtered.push({ date, title, summary, file: blob.url });
  filtered.sort((a, b) => b.date.localeCompare(a.date));
  await writeManifest(filtered);
  return filtered;
}

async function deleteReport(fileUrl) {
  const current = await readManifest();
  const remaining = current.filter((r) => r.file !== fileUrl);
  await del(fileUrl).catch(() => {});
  await writeManifest(remaining);
  return remaining;
}

module.exports = { readManifest, writeManifest, addReport, deleteReport };
