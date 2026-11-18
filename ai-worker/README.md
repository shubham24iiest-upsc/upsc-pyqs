# PYQ Astra AI Worker

The small server behind **Ask AI** and **Research with AI**. It keeps the API key secret, checks that
the student is signed in (Firebase ID token), applies daily limits and caches answers so the same
question is only paid for once.

It runs on Cloudflare Workers' free plan (100,000 requests a day, 1,000 KV writes a day).
Each fresh AI answer uses 2 or 3 KV writes, which is why `DAILY_TOTAL` defaults to 450.

## One-time setup (about 10 minutes)

1. **Get an AI key**
   - Gemini (default): https://aistudio.google.com/apikey → *Create API key*.
   - Claude: https://console.anthropic.com → *API keys*. Then set `PROVIDER = "anthropic"` and
     `MODEL = "claude-haiku-5-5"` in `wrangler.toml`.
2. **Install and log in** (needs Node.js): `cd ai-worker && npx wrangler login`
3. **Create the cache/limits store**: `npx wrangler kv namespace create AI_KV` and paste the `id` it
   prints into `wrangler.toml`.
4. **Add the key as a secret** (never commit it):
   `npx wrangler secret put GEMINI_API_KEY` (or `ANTHROPIC_API_KEY`).
5. **Deploy**: `npx wrangler deploy`. It prints a URL like `https://pyqastra-ai.<you>.workers.dev`.
6. **Switch it on in the site**: put that URL in `ai-config.js` (`endpoint: "https://..."`) and
   publish the site as usual.
7. **Firestore rules**: publish the updated `firestore.rules` (Firebase console → Firestore →
   Rules, or `firebase deploy --only firestore:rules`) so notebook notes can sync.

Check it is up: open `https://pyqastra-ai.<you>.workers.dev/health` → `{"ok":true}`.

## Settings (`wrangler.toml`)

| Setting | Default | What it does |
|---|---|---|
| `DAILY_LIMIT` | 20 | AI searches per student per day (IST). Cached answers don't count. |
| `DAILY_TOTAL` | 450 | Site-wide cap per day, a safety net for cost and the KV free tier. |
| `PROVIDER` / `MODEL` | gemini / gemini-2.5-flash | Which AI writes the answers. |
| `GROUNDING` | 0 | `1` adds Google Search sources to Gemini answers (useful for current affairs; uses a smaller free quota). |
| `ALLOWED_ORIGINS` | pyqastra.com | Sites allowed to call the Worker. |

To change what the AI is told, edit `src/prompt.js` (and the demo copy at the top of the AI section in `../astra.js`).
