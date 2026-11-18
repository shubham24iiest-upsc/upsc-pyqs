// AI research settings for PYQ Astra (read by astra.js).
// endpoint: the URL of the Cloudflare Worker in ai-worker/ once it is deployed, e.g.
//   "https://pyqastra-ai.<your-account>.workers.dev". Leave it empty to hide the AI search bar;
//   the revision notebook works either way.
window.PK_AI = Object.assign({
  endpoint: "",
}, window.PK_AI || {});
