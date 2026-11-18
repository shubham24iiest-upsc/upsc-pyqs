// PYQ Astra AI research endpoint (Cloudflare Worker).
//
// POST /ask   Authorization: Bearer <Firebase ID token>
//   { query, preset?, ctx?, lang: "en"|"hi", history?: [{role:"user"|"assistant", content}] }
// → { answer, sources:[{title,url}], remaining, limit, cached }
//
// Keeps the site free to run:
//   - only signed-in students (Firebase ID token checked here, no SDK needed)
//   - DAILY_LIMIT AI searches per student per day (IST), and a site-wide DAILY_TOTAL cap
//   - answers to the same question + request + language are cached in KV and reused for everyone;
//     cached answers do not count against the limit
//
// Settings (wrangler.toml [vars] and secrets): see ../README.md.

import { SYSTEM, PRESETS, buildUser } from './prompt.js';

const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
const CACHE_DAYS = 30;

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const url = new URL(request.url);
    if (url.pathname === '/health') return json({ ok: true }, 200, cors);
    if (url.pathname !== '/ask' || request.method !== 'POST') return json({ error: 'not_found' }, 404, cors);
    if (!cors['Access-Control-Allow-Origin']) return json({ error: 'origin' }, 403, cors);

    // 1. who is asking
    let uid;
    try { uid = await verifyFirebaseToken((request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, ''), env.FIREBASE_PROJECT_ID); }
    catch (e) { return json({ error: 'auth', message: 'Please sign in again.' }, 401, cors); }

    // 2. what they asked
    let req;
    try { req = clean(await request.json()); }
    catch (e) { return json({ error: 'bad_request', message: String(e.message || e) }, 400, cors); }

    const limit = +env.DAILY_LIMIT || 20, total = +env.DAILY_TOTAL || 1500;
    const day = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);   // IST date
    const userKey = `n:${day}:${uid}`, allKey = `all:${day}`;
    const used = +(await env.AI_KV.get(userKey)) || 0;

    // 3. shared cache (fresh conversations only)
    const cacheKey = req.history.length ? null : 'c:' + (await sha256(JSON.stringify([env.MODEL || '', req.preset, req.preset ? '' : req.query.toLowerCase(), req.ctx, req.lang])));
    if (cacheKey) {
      const hit = await env.AI_KV.get(cacheKey, 'json');
      if (hit) return json({ ...hit, cached: true, remaining: Math.max(0, limit - used), limit }, 200, cors);
    }

    // 4. limits
    if (used >= limit) return json({ error: 'limit', message: 'Daily AI limit reached. It resets at midnight (IST).', remaining: 0, limit }, 429, cors);
    const all = +(await env.AI_KV.get(allKey)) || 0;
    if (all >= total) return json({ error: 'busy', message: 'AI search is very busy today. Please try again tomorrow.', remaining: Math.max(0, limit - used), limit }, 429, cors);

    // 5. ask the model
    let out;
    try {
      const query = req.preset ? PRESETS[req.preset] : req.query;
      const user = buildUser(query, req.ctx, req.lang);
      out = (env.PROVIDER || 'gemini') === 'anthropic' ? await askClaude(env, req.history, user) : await askGemini(env, req.history, user);
      if (!out.answer) throw new Error('empty answer');
    } catch (e) {
      console.error('AI error', e && e.message);
      return json({ error: 'upstream', message: 'The AI could not answer right now. Please try again.' }, 502, cors);
    }

    // 6. count it, cache it
    const ttl = 2 * 86400;
    await Promise.all([
      env.AI_KV.put(userKey, String(used + 1), { expirationTtl: ttl }),
      env.AI_KV.put(allKey, String(all + 1), { expirationTtl: ttl }),
      cacheKey ? env.AI_KV.put(cacheKey, JSON.stringify(out), { expirationTtl: CACHE_DAYS * 86400 }) : null,
    ]);
    return json({ ...out, cached: false, remaining: Math.max(0, limit - used - 1), limit }, 200, cors);
  },
};

/* ---------- request validation ---------- */
const str = (v, max) => (typeof v === 'string' ? v : v == null ? '' : String(v)).slice(0, max).trim();
function clean(b) {
  if (!b || typeof b !== 'object') throw new Error('body must be JSON');
  const preset = b.preset && PRESETS[b.preset] ? b.preset : '';
  const query = str(b.query, 600);
  if (!preset && !query) throw new Error('query is empty');
  let ctx = null;
  if (b.ctx && typeof b.ctx === 'object' && b.ctx.text) {
    const c = b.ctx;
    ctx = {
      kind: ['prelims', 'csat', 'mains'].includes(c.kind) ? c.kind : 'prelims',
      year: +c.year || null,
      subject: str(c.subject, 150), topic: str(c.topic, 200),
      text: str(c.text, 3000), passage: str(c.passage, 3000),
      options: Array.isArray(c.options) ? c.options.slice(0, 4).map(o => str(o, 500)) : [],
      answer: /^[abcdx]$/.test(c.answer || '') ? c.answer : '',
      marks: str(c.marks, 5),
    };
  }
  const history = (Array.isArray(b.history) ? b.history : []).slice(-4)
    .filter(h => h && (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string')
    .map(h => ({ role: h.role, content: h.content.slice(0, 3000) }));
  if (history.length && history[0].role !== 'user') history.shift();
  return { preset, query: preset ? '' : query, ctx, history, lang: b.lang === 'hi' ? 'hi' : 'en' };
}

/* ---------- providers ---------- */
async function askGemini(env, history, user) {
  const model = env.MODEL || 'gemini-2.5-flash';
  const body = {
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents: [...history.map(h => ({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.content }] })), { role: 'user', parts: [{ text: user }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: +env.MAX_OUTPUT_TOKENS || 1400 },
  };
  if (env.THINKING_BUDGET !== undefined && env.THINKING_BUDGET !== '') body.generationConfig.thinkingConfig = { thinkingBudget: +env.THINKING_BUDGET };
  if (env.GROUNDING === '1') body.tools = [{ google_search: {} }];
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY }, body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`gemini ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const d = await r.json(), c = (d.candidates || [])[0] || {};
  const answer = ((c.content && c.content.parts) || []).map(p => p.text || '').join('').trim();
  const sources = ((c.groundingMetadata && c.groundingMetadata.groundingChunks) || [])
    .map(g => g.web).filter(Boolean).slice(0, 5).map(w => ({ title: w.title || '', url: w.uri }));
  return { answer, sources };
}

async function askClaude(env, history, user) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: env.MODEL || 'claude-haiku-5-5', max_tokens: +env.MAX_OUTPUT_TOKENS || 1400, temperature: 0.4,
      system: SYSTEM, messages: [...history, { role: 'user', content: user }],
    }),
  });
  if (!r.ok) throw new Error(`anthropic ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const d = await r.json();
  return { answer: (d.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim(), sources: [] };
}

/* ---------- Firebase ID token check (RS256, Google's public keys) ---------- */
let JWKS = null, JWKS_EXP = 0;
async function googleKeys() {
  if (JWKS && Date.now() < JWKS_EXP) return JWKS;
  const r = await fetch(JWKS_URL);
  const { keys } = await r.json();
  const age = /max-age=(\d+)/.exec(r.headers.get('cache-control') || '');
  const out = {};
  for (const k of keys) out[k.kid] = await crypto.subtle.importKey('jwk', k, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  JWKS = out; JWKS_EXP = Date.now() + (age ? +age[1] : 3600) * 1000;
  return JWKS;
}
const b64u = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), c => c.charCodeAt(0));
async function verifyFirebaseToken(token, projectId) {
  if (!token || !projectId) throw new Error('no token');
  const [h, p, sig] = token.split('.');
  if (!sig) throw new Error('malformed');
  const header = JSON.parse(new TextDecoder().decode(b64u(h)));
  const claims = JSON.parse(new TextDecoder().decode(b64u(p)));
  if (header.alg !== 'RS256') throw new Error('alg');
  let key = (await googleKeys())[header.kid];
  if (!key) { JWKS = null; key = (await googleKeys())[header.kid]; }     // keys rotate
  if (!key) throw new Error('kid');
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64u(sig), new TextEncoder().encode(`${h}.${p}`));
  const now = Math.floor(Date.now() / 1000);
  if (!ok || claims.aud !== projectId || claims.iss !== `https://securetoken.google.com/${projectId}` ||
      !claims.sub || claims.exp < now || claims.iat > now + 300) throw new Error('invalid');
  return claims.sub;
}

/* ---------- utils ---------- */
async function sha256(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}
function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const h = { 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Max-Age': '86400', Vary: 'Origin' };
  if (allowed.includes(origin)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}
const json = (o, status, headers) => new Response(JSON.stringify(o), { status, headers: { ...headers, 'Content-Type': 'application/json' } });
