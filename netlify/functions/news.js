// Netlify Function — GET /.netlify/functions/news
// If deploying to Netlify instead of Vercel, also add this redirect to
// netlify.toml so the frontend's /api/news calls reach this function:
//   [[redirects]]
//     from = "/api/news"
//     to = "/.netlify/functions/news"
//     status = 200
const { fetchNews } = require("../../lib/fetchNews");

exports.handler = async () => {
  try {
    const data = await fetchNews();
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "s-maxage=600, stale-while-revalidate=1200",
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Không tải được tin tức", detail: String(err) }),
    };
  }
};
