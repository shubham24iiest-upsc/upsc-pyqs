// PYQ Astra sign-in + cloud progress (Firebase Auth with Google, Firestore).
// Progress still lives in localStorage ('pyq-prelims', 'pyq-progress'); when signed in,
// it is merged with the cloud copy on sign-in and uploaded after every change.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, deleteDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const cfg = window.PK_FIREBASE || {};
const KEYS = { prelims: 'pyq-prelims', mains: 'pyq-progress' };

if (cfg.apiKey) start();

function start(){
  const app = initializeApp(cfg);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  let user = null, cloud = null, ready = false, timer = null;
  const read = k => { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } };
  const rawSet = Storage.prototype.setItem;
  const write = (k, v) => { try { rawSet.call(localStorage, k, JSON.stringify(v)); } catch (e) {} };

  // Upload shortly after the page saves progress.
  Storage.prototype.setItem = function (k, v) {
    rawSet.call(this, k, v);
    if (this === localStorage && (k === KEYS.prelims || k === KEYS.mains) && user && ready) {
      clearTimeout(timer); timer = setTimeout(upload, 1200);
    }
  };
  addEventListener('pagehide', () => { if (timer) { clearTimeout(timer); upload(); } });

  function stats(){
    const pre = read(KEYS.prelims), mains = read(KEYS.mains);
    const base = {
      attempted: Object.keys(pre.ans || {}).length,
      bookmarked: Object.keys(pre.saved || {}).length,
      mainsDone: Object.keys(mains.done || {}).length,
      mainsSaved: Object.keys(mains.saved || {}).length,
    };
    // practice.html knows the answer key, so it can add correct/wrong/per-subject counts.
    if (typeof window.PK_STATS === 'function') { try { Object.assign(base, window.PK_STATS(pre)); } catch (e) {} }
    else if (cloud && cloud.stats) {   // keep the last detailed numbers from the practice page
      for (const f of ['correct', 'wrong', 'bySubject']) if (cloud.stats[f] !== undefined) base[f] = cloud.stats[f];
    }
    return base;
  }

  async function upload(){
    timer = null;
    if (!user) return;
    const data = { prelims: read(KEYS.prelims), mains: read(KEYS.mains), stats: stats(),
      name: user.displayName || '', updatedAt: serverTimestamp() };
    cloud = { ...(cloud || {}), ...data };
    try { await setDoc(doc(db, 'users', user.uid), data); } catch (e) { console.warn('PYQ Astra sync failed', e); }
  }

  // Union of two progress objects ({ans:{}, saved:{}, ...}); local answers win on conflict.
  function merge(a, b){
    const out = { ...b, ...a };
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (a[k] && b[k] && typeof a[k] === 'object' && typeof b[k] === 'object') out[k] = { ...b[k], ...a[k] };
    }
    return out;
  }

  async function onSignIn(){
    ready = false;
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      cloud = snap.exists() ? snap.data() : {};
    } catch (e) { cloud = {}; console.warn('PYQ Astra could not load progress', e); }
    let changed = false;
    for (const [f, k] of Object.entries(KEYS)) {
      const local = read(k), merged = merge(local, cloud[f] || {});
      if (JSON.stringify(merged) !== JSON.stringify(local)) { write(k, merged); changed = true; }
    }
    ready = true;
    await upload();
    // The page read the old local copy at load; reload once so it shows the merged progress.
    // (after the reload, local and cloud match, so this does not loop)
    if (changed) { location.reload(); return; }
    render();
  }

  /* ---------- UI ---------- */
  const css = `
.pk-btn{ height:40px; min-width:40px; padding:0 14px; border-radius:999px; border:1px solid var(--rule); background:var(--surface); color:var(--text);
  display:flex; align-items:center; justify-content:center; gap:8px; font-weight:600; font-size:14px; box-shadow:var(--shadow); white-space:nowrap; }
.pk-btn:hover{ border-color:var(--marigold); }
.pk-btn svg{ width:18px; height:18px; }
.pk-btn.pk-me{ padding:0; width:40px; overflow:hidden; }
.pk-btn.pk-me img{ width:100%; height:100%; object-fit:cover; }
.pk-btn.pk-me b{ font-size:15px; color:var(--marigold); }
@media (max-width:640px){ .pk-btn{ height:36px; min-width:36px; } .pk-btn.pk-me{ width:36px; } .pk-btn .pk-lbl{ display:none; } .pk-btn{ padding:0 9px; } }
/* phones: brand + buttons on one row, section nav full-width underneath */
@media (max-width:480px){
  .head-row{ flex-wrap:wrap; row-gap:12px; }
  .head-right{ display:contents; }
  .brand{ order:1; margin-right:auto; }
  .pk-btn{ order:2; height:34px; min-width:34px; width:34px; padding:0; }
  .pk-btn svg{ width:17px; height:17px; }
  .theme-toggle{ order:3; width:34px; height:34px; }
  .top-nav{ order:4; width:100%; }
  .top-nav a{ flex:1; text-align:center; padding:7px 6px; font-size:13px; }
}
.pk-back{ position:fixed; inset:0; z-index:100; background:rgba(15,14,20,.45); display:none; align-items:flex-start; justify-content:center; padding:72px 16px 16px; overflow:auto; }
.pk-back.open{ display:flex; }
.pk-card{ width:100%; max-width:440px; background:var(--surface); color:var(--text); border:1px solid var(--rule); border-radius:var(--radius,14px); box-shadow:var(--shadow); padding:22px; }
.pk-top{ display:flex; align-items:center; gap:12px; margin-bottom:18px; }
.pk-top img, .pk-top .pk-av{ width:44px; height:44px; border-radius:50%; flex:none; background:var(--marigold-soft); display:flex; align-items:center; justify-content:center; font-weight:700; color:var(--marigold); }
.pk-top div{ min-width:0; flex:1; }
.pk-top strong{ display:block; font-size:16px; }
.pk-top span{ display:block; color:var(--muted); font-size:13px; overflow:hidden; text-overflow:ellipsis; }
.pk-x{ width:32px; height:32px; border-radius:50%; color:var(--muted); font-size:20px; line-height:1; }
.pk-x:hover{ background:var(--surface-2); color:var(--text); }
.pk-hero{ background:var(--marigold-soft); border-radius:12px; padding:16px 18px; margin-bottom:12px; }
.pk-hero b{ font-family:var(--display); font-size:40px; line-height:1; color:var(--marigold); display:block; }
.pk-hero span{ color:var(--muted); font-size:14px; }
.pk-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:14px; }
.pk-grid div{ background:var(--surface-2); border-radius:10px; padding:10px 12px; }
.pk-grid b{ display:block; font-size:20px; }
.pk-grid span{ font-size:12px; color:var(--muted); }
.pk-grid .ok b{ color:var(--mint); } .pk-grid .no b{ color:var(--pink); }
.pk-h{ font-size:12px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:var(--faint); margin:14px 0 8px; }
.pk-sub{ display:grid; grid-template-columns:1fr auto; gap:3px 10px; font-size:13.5px; margin-bottom:8px; }
.pk-sub i{ grid-column:1 / -1; height:6px; border-radius:3px; background:var(--surface-2); overflow:hidden; }
.pk-sub i s{ display:block; height:100%; background:var(--marigold); }
.pk-sub em{ font-style:normal; color:var(--muted); }
.pk-foot{ display:flex; justify-content:space-between; align-items:center; gap:10px; margin-top:18px; padding-top:14px; border-top:1px solid var(--rule); font-size:13px; color:var(--faint); }
.pk-out{ padding:7px 14px; border-radius:999px; border:1px solid var(--rule); font-weight:600; font-size:13.5px; color:var(--text); }
.pk-del{ font-size:13px; color:var(--faint); text-decoration:underline; padding:4px 0; }
.pk-del:hover{ color:var(--pink); }
.pk-out:hover{ border-color:var(--pink); color:var(--pink); }
.pk-go{ display:inline-block; margin-top:4px; padding:9px 16px; border-radius:999px; background:var(--marigold); color:var(--on-accent); font-weight:600; font-size:14px; }
.pk-note{ color:var(--muted); font-size:13.5px; line-height:1.55; }
.pk-wall{ max-width:400px; text-align:center; padding:26px 26px 20px; }
.pk-wall h2{ font-family:var(--display); font-weight:600; font-size:24px; line-height:1.25; margin:12px 0 8px; clear:both; }
.pk-wall-ic{ width:56px; height:56px; margin:4px auto 0; border-radius:16px; background:var(--marigold); display:flex; align-items:center; justify-content:center; }
.pk-wall-ic svg{ width:30px; height:30px; }
.pk-list{ list-style:none; text-align:left; margin:16px auto 20px; max-width:280px; display:grid; gap:8px; font-size:14.5px; color:var(--text); }
.pk-list li{ padding-left:26px; position:relative; }
.pk-list li::before{ content:''; position:absolute; left:4px; top:7px; width:10px; height:6px; border-left:2px solid var(--mint); border-bottom:2px solid var(--mint); transform:rotate(-45deg); }
.pk-google{ width:100%; height:48px; border-radius:999px; background:var(--marigold); color:var(--on-accent); font-weight:600; font-size:15.5px; display:flex; align-items:center; justify-content:center; gap:10px; }
.pk-google svg{ width:20px; height:20px; background:#fff; border-radius:50%; padding:2px; box-sizing:content-box; }
.pk-google:hover{ filter:brightness(1.05); }
.pk-fine{ font-size:12.5px; color:var(--faint); margin-top:14px; }
.pk-fine a{ text-decoration:underline; }
/* small lock on gated actions for guests */
.pk-guest a[download]::after, .pk-guest a[href$=".pdf"]::after, .pk-guest.pk-practice #start::after{
  content:''; display:inline-block; width:11px; height:11px; margin-left:7px; vertical-align:-1px; background:currentColor; opacity:.75;
  -webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M7 10V7a5 5 0 0 1 10 0v3h1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1h1zm2 0h6V7a3 3 0 0 0-6 0v3z'/%3E%3C/svg%3E") center/contain no-repeat;
          mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M7 10V7a5 5 0 0 1 10 0v3h1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1h1zm2 0h6V7a3 3 0 0 0-6 0v3z'/%3E%3C/svg%3E") center/contain no-repeat; }
`;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  const G = '<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h6a5 5 0 0 1-2.2 3.4v2.8h3.6c2-1.9 3.2-4.7 3.2-8.2z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.4-2.7l-3.6-2.8c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2v2.9A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.7 14c-.2-.7-.4-1.3-.4-2s.1-1.4.4-2V7.1H2a11 11 0 0 0 0 9.8L5.7 14z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2 7.1L5.7 10c.9-2.7 3.4-4.6 6.3-4.6z"/></svg>';
  const STAR = '<svg viewBox="0 0 24 24"><path fill="#fff" d="M12 2c.9 6.6 1.5 7.2 9 9-7.5 1.8-8.1 2.4-9 9-.9-6.6-1.5-7.2-9-9 7.5-1.8 8.1-2.4 9-9z"/></svg>';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const initial = u => esc(((u.displayName || u.email || '?').trim()[0] || '?').toUpperCase());
  const avatar = (u, cls) => u.photoURL ? `<img src="${esc(u.photoURL)}" alt="" referrerpolicy="no-referrer"${cls ? ` class="${cls}"` : ''}>` : `<${cls ? 'span class="pk-av"' : 'b'}>${initial(u)}</${cls ? 'span' : 'b'}>`;

  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'pk-btn';
  const slot = document.querySelector('.head-right');
  if (slot) slot.insertBefore(btn, document.getElementById('themeToggle') || null);
  else { btn.style.cssText = 'position:fixed;top:16px;right:16px;z-index:50'; document.body.appendChild(btn); }

  const back = document.createElement('div');
  back.className = 'pk-back'; back.setAttribute('aria-hidden', 'true');
  back.innerHTML = '<div class="pk-card" role="dialog" aria-modal="true" aria-label="Your progress"></div>';
  document.body.appendChild(back);
  const card = back.firstChild;
  const close = () => { back.classList.remove('open'); back.setAttribute('aria-hidden', 'true'); };
  back.addEventListener('click', e => { if (e.target === back || e.target.closest('.pk-x')) close(); if (e.target.closest('.pk-out')) { close(); doSignOut(); }
    if (e.target.closest('.pk-del')) doDelete(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  function render(){
    if (!user) {
      btn.className = 'pk-btn';
      btn.innerHTML = `${G}<span class="pk-lbl">Sign in</span>`;
      btn.setAttribute('aria-label', 'Sign in with Google'); btn.title = 'Sign in with Google to save your progress';
      return;
    }
    btn.className = 'pk-btn pk-me';
    btn.innerHTML = avatar(user);
    btn.setAttribute('aria-label', 'Your progress'); btn.title = `${user.displayName || user.email} — your progress`;
  }

  function openPanel(){
    const s = stats();
    const hasKey = s.correct !== undefined;
    const acc = hasKey && (s.correct + s.wrong) ? Math.round(100 * s.correct / (s.correct + s.wrong)) : null;
    const subs = Object.entries(s.bySubject || {}).sort((a, b) => b[1].att - a[1].att).filter(x => x[1].att);
    card.innerHTML = `
      <div class="pk-top">${avatar(user, 'x')}<div><strong>${esc(user.displayName || 'Student')}</strong><span>${esc(user.email)}</span></div>
        <button class="pk-x" type="button" aria-label="Close">×</button></div>
      <div class="pk-hero"><b>${s.attempted}</b><span>Prelims question${s.attempted === 1 ? '' : 's'} practised</span></div>
      <div class="pk-grid">
        <div class="ok"><b>${hasKey ? s.correct : '–'}</b><span>Correct</span></div>
        <div class="no"><b>${hasKey ? s.wrong : '–'}</b><span>Wrong</span></div>
        <div><b>${acc === null ? '–' : acc + '%'}</b><span>Accuracy</span></div>
        <div><b>${s.bookmarked}</b><span>Bookmarked</span></div>
        <div><b>${s.mainsDone}</b><span>Mains done</span></div>
        <div><b>${s.mainsSaved}</b><span>Mains saved</span></div>
      </div>
      ${subs.length ? `<div class="pk-h">By subject</div>` + subs.map(([n, v]) => `
        <div class="pk-sub"><span>${esc(n)}</span><em>${v.att}/${v.total} · ${v.ok} correct</em><i><s style="width:${Math.min(100, Math.round(100 * v.att / (v.total || 1)))}%"></s></i></div>`).join('') : ''}
      ${!s.attempted ? `<p class="pk-note">You haven't answered any questions yet. Your answers will be saved to your account as you practise.</p><a class="pk-go" href="practice.html">Start practising</a>` : ''}
      <div class="pk-foot"><button class="pk-del" type="button">Delete my data</button><button class="pk-out" type="button">Sign out</button></div>`;
    back.classList.add('open'); back.setAttribute('aria-hidden', 'false');
    card.querySelector('.pk-x').focus();
  }

  async function doSignIn(){
    try { await signInWithPopup(auth, provider); }
    catch (e) {
      if (e && (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment')) {
        try { await signInWithRedirect(auth, provider); } catch (e2) { alert('Sign-in failed. Please try again.'); }
      } else if (e && e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
        console.warn(e); alert('Sign-in failed. Please try again.');
      }
    }
  }

  async function doDelete(){
    if (!confirm('Permanently delete all your saved progress from PYQ Astra? This cannot be undone.')) return;
    clearTimeout(timer); timer = null; ready = false;
    try { await deleteDoc(doc(db, 'users', user.uid)); }
    catch (e) { console.warn(e); alert('Could not delete your data. Please try again.'); ready = true; return; }
    close(); await doSignOut(true);
  }

  async function doSignOut(skipUpload){
    if (timer && !skipUpload) { clearTimeout(timer); await upload(); }
    user = null;
    await signOut(auth);
    // Progress is safe in the account; clear this browser so the next person starts fresh.
    for (const k of Object.values(KEYS)) { try { localStorage.removeItem(k); } catch (e) {} }
    try { localStorage.removeItem('pyq-test'); } catch (e) {}
    location.reload();
  }

  /* ---------- sign-up wall: browsing is open, downloading and solving need an account ---------- */
  let authKnown = false, bypass = false;
  const authReady = new Promise(res => { const off = onAuthStateChanged(auth, () => { authKnown = true; res(); off(); }); });
  const GATES = [
    { sel: 'a[href$=".pdf"], a[download]', why: 'download' },
    // Practice page only (it has the #fx test overlay); on Mains, #start just opens questions to read
    { sel: document.getElementById('fx') ? '#start, .opt:not([disabled])' : '.opt:not([disabled])', why: 'solve' },
    { sel: '#svDone, #svSave, #svBs, .sv-act', why: 'track' },
  ];
  const WHY = {
    download: ['Sign up free to download papers', 'Download every UPSC Prelims and Mains paper and answer key as a PDF.'],
    solve:    ['Sign up free to solve questions', 'Practise 1,300 Prelims questions with instant marking, explanations and a score card.'],
    track:    ['Sign up free to track your practice', 'Mark questions as practised, bookmark tough ones and see your progress on any device.'],
  };
  const gateOf = el => { for (const g of GATES) { const m = el.closest && el.closest(g.sel); if (m) return { el: m, why: g.why }; } return null; };
  const inTest = () => { const fx = document.getElementById('fx'); return fx && getComputedStyle(fx).display !== 'none' && !fx.hidden; };
  const inViewer = () => { const sv = document.getElementById('sv'); return sv && !sv.hidden && getComputedStyle(sv).display !== 'none'; };

  const wall = document.createElement('div');
  wall.className = 'pk-back'; wall.setAttribute('aria-hidden', 'true');
  wall.innerHTML = '<div class="pk-card pk-wall" role="dialog" aria-modal="true" aria-labelledby="pkWallH"></div>';
  document.body.appendChild(wall);
  let pending = null;
  const closeWall = () => { wall.classList.remove('open'); wall.setAttribute('aria-hidden', 'true'); pending = null; };
  function openWall(why, target){
    const [h, p] = WHY[why] || WHY.solve;
    pending = target || null;
    wall.firstChild.innerHTML = `
      <button class="pk-x" type="button" aria-label="Close" style="float:right">×</button>
      <div class="pk-wall-ic">${STAR}</div>
      <h2 id="pkWallH">${esc(h)}</h2>
      <p class="pk-note">${esc(p)}</p>
      <ul class="pk-list"><li>Free, no payment ever</li><li>One tap with your Google account</li><li>Your progress saved across phone and laptop</li></ul>
      <button class="pk-google" type="button">${G}<span>Continue with Google</span></button>
      <p class="pk-fine">You can keep browsing every question without an account. <a href="privacy.html">Privacy</a></p>`;
    wall.classList.add('open'); wall.setAttribute('aria-hidden', 'false');
    wall.querySelector('.pk-google').focus();
  }
  wall.addEventListener('click', async e => {
    if (e.target === wall || e.target.closest('.pk-x')) return closeWall();
    if (e.target.closest('.pk-google')) {
      const t = pending;
      // remember a download across the reload that a first sign-in may trigger
      if (t && t.href) { try { sessionStorage.setItem('pk-pending', JSON.stringify(t)); } catch (x) {} }
      await doSignIn();
      if (!user) return;
      wall.classList.remove('open'); wall.setAttribute('aria-hidden', 'true'); pending = null;
      try { sessionStorage.removeItem('pk-pending'); } catch (x) {}
      if (t && t.el && document.contains(t.el)) { bypass = true; try { t.el.click(); } finally { bypass = false; } }
      else if (t && t.href) replayDownload(t);
    }
  });
  addEventListener('keydown', e => { if (e.key === 'Escape' && wall.classList.contains('open')) closeWall(); });

  function replayDownload(t){
    const a = document.createElement('a'); a.href = t.href; if (t.download != null) a.download = t.download;
    document.body.appendChild(a); bypass = true; try { a.click(); } finally { bypass = false; a.remove(); }
  }

  addEventListener('click', e => {
    if (bypass || user) return;
    const g = gateOf(e.target); if (!g) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const a = g.el.tagName === 'A' ? g.el : null;
    const target = { el: g.el, href: a ? a.href : null, download: a ? a.getAttribute('download') : null };
    if (!authKnown) { authReady.then(() => { if (user) { bypass = true; try { g.el.click(); } finally { bypass = false; } } else openWall(g.why, target); }); return; }
    openWall(g.why, target);
  }, true);

  addEventListener('keydown', e => {
    if (user || e.ctrlKey || e.metaKey || e.altKey || /^(SELECT|INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
    const k = e.key.toLowerCase();
    if (inTest() && 'abcd'.includes(k) && k.length === 1) { e.preventDefault(); e.stopImmediatePropagation(); openWall('solve'); }
    else if (inViewer() && (k === 'p' || k === 's')) { e.preventDefault(); e.stopImmediatePropagation(); openWall('track'); }
  }, true);

  if (document.getElementById('fx')) document.documentElement.classList.add('pk-practice');
  authReady.then(() => {
    document.documentElement.classList.toggle('pk-guest', !user);
    let t = null; try { t = JSON.parse(sessionStorage.getItem('pk-pending') || 'null'); sessionStorage.removeItem('pk-pending'); } catch (x) {}
    if (user && t && t.href) replayDownload(t);
  });

  btn.addEventListener('click', () => user ? openPanel() : doSignIn());
  getRedirectResult(auth).catch(() => {});
  onAuthStateChanged(auth, u => {
    const was = user && user.uid;
    user = u; render(); document.documentElement.classList.toggle('pk-guest', !u);
    if (u && u.uid !== was) onSignIn();
    if (!u) { ready = false; cloud = null; }
  });
  render();
}
