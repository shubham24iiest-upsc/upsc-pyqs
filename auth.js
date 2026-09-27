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
`;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  const G = '<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h6a5 5 0 0 1-2.2 3.4v2.8h3.6c2-1.9 3.2-4.7 3.2-8.2z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.4-2.7l-3.6-2.8c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2v2.9A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.7 14c-.2-.7-.4-1.3-.4-2s.1-1.4.4-2V7.1H2a11 11 0 0 0 0 9.8L5.7 14z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2 7.1L5.7 10c.9-2.7 3.4-4.6 6.3-4.6z"/></svg>';
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

  btn.addEventListener('click', () => user ? openPanel() : doSignIn());
  getRedirectResult(auth).catch(() => {});
  onAuthStateChanged(auth, u => {
    const was = user && user.uid;
    user = u; render();
    if (u && u.uid !== was) onSignIn();
    if (!u) { ready = false; cloud = null; }
  });
  render();
}
