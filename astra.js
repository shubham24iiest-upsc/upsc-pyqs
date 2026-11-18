/* PYQ Astra: AI research search bar + revision notebook.
   - "Ask AI" in the header (or Ctrl/⌘ K) opens a research panel; every answered question gets a
     "Research with AI" button that opens the panel with that question attached.
   - Any answer, or a note of your own, can be saved to the revision notebook under a subject and topic
     (the site's own Prelims / CSAT / Mains tags, from data/notebook-taxonomy.js).
   - Notes live in localStorage ('pyq-notebook'); auth.js syncs them to the student's account
     (Firestore users/{uid}/notes/{id}) when they are signed in.
   - AI answers come from the Worker in ai-worker/ (window.PK_AI.endpoint, set in ai-config.js).
     With no endpoint the AI parts stay hidden and the notebook still works.
   Load after i18n.js, ai-config.js and data/notebook-taxonomy.js. */
(function () {
  if (window.PK_ASTRA) return;
  const CFG = window.PK_AI || {};
  const AI_ON = !!(CFG.endpoint || CFG.demo);
  const HI = window.PYQ_LANG === 'hi';
  const NB_KEY = 'pyq-notebook';
  const TAX = window.PK_TAXONOMY || [];
  const MAX_HISTORY = 4;

  /* ---------- small helpers ---------- */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const trS = s => (window.PYQ_I18N && HI) ? window.PYQ_I18N.t(s) : s;      // subject / topic names
  const H = {
    'Ask AI': 'AI से पूछें', 'Notebook': 'नोटबुक', 'Revision notebook': 'रिवीज़न नोटबुक',
    'Research with AI': 'AI से रिसर्च करें', 'Research': 'रिसर्च',
    'Ask anything about UPSC: a concept, a question, a current issue…': 'UPSC से जुड़ा कुछ भी पूछें: कोई अवधारणा, प्रश्न या समसामयिक मुद्दा…',
    'Ask a follow-up…': 'आगे का प्रश्न पूछें…', 'Ask': 'पूछें', 'Researching…': 'रिसर्च हो रही है…',
    'Save to notebook': 'नोटबुक में सहेजें', 'Saved': 'सहेजा गया', 'Copy': 'कॉपी', 'Copied': 'कॉपी हुआ',
    'Subject': 'विषय', 'Topic': 'टॉपिक', 'Title': 'शीर्षक', 'Save': 'सहेजें', 'Cancel': 'रद्द करें',
    'General': 'सामान्य', '+ New topic…': '+ नया टॉपिक…', '+ New subject…': '+ नया विषय…',
    'New topic name': 'नए टॉपिक का नाम', 'New subject name': 'नए विषय का नाम',
    'All notes': 'सभी नोट्स', 'New note': 'नया नोट', 'Search notes': 'नोट्स खोजें', 'Export': 'एक्सपोर्ट',
    'Edit': 'बदलें', 'Delete': 'हटाएँ', 'Ask AI about this': 'इस पर AI से पूछें', 'Show more': 'और दिखाएँ', 'Show less': 'कम दिखाएँ',
    'My note': 'मेरा नोट', 'AI answer': 'AI उत्तर', 'Open notebook': 'नोटबुक खोलें', 'Close': 'बंद करें',
    'Sources': 'स्रोत', 'Attached question': 'जुड़ा हुआ प्रश्न', 'Remove': 'हटाएँ',
    'Write your note… (Markdown works: **bold**, - bullets, ## headings)': 'अपना नोट लिखें… (**बोल्ड**, - बुलेट, ## शीर्षक चलते हैं)',
    'Tap again to delete': 'हटाने के लिए फिर दबाएँ',
    'Notes are saved in this browser only. Sign in to keep them on every device.': 'नोट्स अभी केवल इस ब्राउज़र में हैं। हर डिवाइस पर रखने के लिए साइन इन करें।',
    'Sign in': 'साइन इन', 'Synced to your account': 'आपके अकाउंट में सिंक',
    'AI answers can be wrong. Check facts against NCERTs and official sources before you revise from them.': 'AI के उत्तर गलत हो सकते हैं। रिवीज़न से पहले NCERT और आधिकारिक स्रोतों से तथ्य जाँच लें।',
    'Your notebook is empty': 'आपकी नोटबुक खाली है',
    'Save AI answers or write your own notes. They are organised here by subject and topic.': 'AI उत्तर सहेजें या अपने नोट्स लिखें। वे यहाँ विषय और टॉपिक के अनुसार रखे जाते हैं।',
    'No notes match your search.': 'आपकी खोज से कोई नोट नहीं मिला।', 'notes': 'नोट्स', 'note': 'नोट',
    'Explain this question': 'यह प्रश्न समझाइए', 'Concept and related facts': 'अवधारणा और संबंधित तथ्य', 'Mains angle': 'मेन्स दृष्टिकोण',
    'Answer outline': 'उत्तर की रूपरेखा', 'Keywords and examples': 'मुख्य शब्द और उदाहरण', 'Try asking': 'ऐसे पूछें',
    'AI search is not switched on yet.': 'AI सर्च अभी चालू नहीं है।', 'Something went wrong. Please try again.': 'कुछ गड़बड़ हुई। कृपया फिर कोशिश करें।',
    'Daily AI limit reached. It resets at midnight (IST).': 'आज की AI सीमा पूरी हो गई। यह आधी रात (IST) को फिर शुरू होगी।',
    'Saved to': 'सहेजा गया:', 'My subjects': 'मेरे विषय', 'Untitled note': 'बिना शीर्षक का नोट', 'Back': 'वापस', 'New chat': 'नई बातचीत',
  };
  const t = s => (HI && H[s]) || s;
  const fmtDate = ms => { try { return new Date(ms).toLocaleDateString(HI ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return ''; } };
  const uid = () => 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const lsGet = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const auth = () => window.PK_AUTH || null;
  const signedIn = () => !!(CFG.demo || (auth() && auth().user()));

  /* ---------- Markdown (escaped first, then a small safe subset) ---------- */
  function inline(s) {
    return s
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (m, a, u) => `<a href="${u.replace(/"/g, '&quot;')}" target="_blank" rel="noopener noreferrer">${a}</a>`);
  }
  function md(src) {
    const lines = esc(src || '').replace(/\r/g, '').split('\n');
    let out = '', list = null, para = [];
    const flushP = () => { if (para.length) { out += `<p>${inline(para.join(' '))}</p>`; para = []; } };
    const flushL = () => { if (list) { out += `</${list}>`; list = null; } };
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i], tr = l.trim();
      // pipe table: header row followed by |---| row
      if (/^\|.*\|$/.test(tr) && i + 1 < lines.length && /^\|?\s*:?-{2,}/.test(lines[i + 1].trim())) {
        flushP(); flushL();
        const cells = r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => inline(c.trim()));
        out += '<div class="ax-tw"><table><thead><tr>' + cells(tr).map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>';
        i += 2;
        while (i < lines.length && /^\|.*\|$/.test(lines[i].trim())) { out += '<tr>' + cells(lines[i]).map(c => `<td>${c}</td>`).join('') + '</tr>'; i++; }
        i--; out += '</tbody></table></div>'; continue;
      }
      let m;
      if (!tr) { flushP(); flushL(); continue; }
      if ((m = tr.match(/^(#{1,4})\s+(.*)$/))) { flushP(); flushL(); out += `<h4>${inline(m[2].replace(/\*\*/g, ''))}</h4>`; continue; }
      if ((m = tr.match(/^[-*•]\s+(.*)$/))) { flushP(); if (list !== 'ul') { flushL(); out += '<ul>'; list = 'ul'; } out += `<li>${inline(m[1])}</li>`; continue; }
      if ((m = tr.match(/^\d+[.)]\s+(.*)$/))) { flushP(); if (list !== 'ol') { flushL(); out += '<ol>'; list = 'ol'; } out += `<li>${inline(m[1])}</li>`; continue; }
      flushL(); para.push(tr);
    }
    flushP(); flushL();
    return out;
  }
  const plain = s => String(s || '').replace(/[#*`>|]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\s+/g, ' ').trim();

  /* ---------- taxonomy ---------- */
  const SUBJECTS = [];
  TAX.forEach(g => g.subjects.forEach(s => SUBJECTS.push({ group: g.name, name: s.name, topics: s.topics })));
  const subjectOf = name => SUBJECTS.find(s => s.name === name);

  /* ---------- notebook store ---------- */
  let NB = lsGet(NB_KEY, { notes: {} }); if (!NB.notes) NB = { notes: {} };
  const reloadNB = () => { NB = lsGet(NB_KEY, { notes: {} }); if (!NB.notes) NB.notes = {}; };
  function nbCommit(ids) {
    lsSet(NB_KEY, NB);
    dispatchEvent(new CustomEvent('pk-notes-change', { detail: { ids } }));
    refreshNotebook();
  }
  const live = () => Object.values(NB.notes).filter(n => !n.deleted);
  function putNote(n) {
    const now = Date.now();
    const note = Object.assign({ id: uid(), created: now, src: 'me' }, n, { updated: now });
    note.title = (note.title || '').trim().slice(0, 200) || t('Untitled note');
    note.subject = (note.subject || '').trim().slice(0, 80) || 'Miscellaneous';
    note.topic = (note.topic || '').trim().slice(0, 120);
    note.body = String(note.body || '').slice(0, 20000);
    NB.notes[note.id] = note; nbCommit([note.id]);
    try { localStorage.setItem('pyq-nb-last', JSON.stringify({ subject: note.subject, topic: note.topic })); } catch (e) {}
    return note;
  }
  function deleteNote(id) {
    if (!NB.notes[id]) return;
    NB.notes[id] = { id, deleted: true, updated: Date.now() };   // tombstone so other devices drop it too
    nbCommit([id]);
  }
  // auth.js calls these to sync with the account
  window.PK_NOTEBOOK = {
    key: NB_KEY,
    all: () => (reloadNB(), NB.notes),
    // remote: {id: note}. Newer `updated` wins. Returns the ids where the local copy is newer (to upload).
    merge(remote) {
      reloadNB();
      const up = [];
      for (const [id, r] of Object.entries(remote || {})) {
        const l = NB.notes[id];
        if (!l || (r.updated || 0) > (l.updated || 0)) NB.notes[id] = r;
        else if ((l.updated || 0) > (r.updated || 0)) up.push(id);
      }
      for (const id of Object.keys(NB.notes)) if (!remote || !remote[id]) up.push(id);
      lsSet(NB_KEY, NB); refreshNotebook();
      return up;
    },
  };
  addEventListener('pk-notes-sync', () => { reloadNB(); refreshNotebook(); });
  addEventListener('storage', e => { if (e.key === NB_KEY) { reloadNB(); refreshNotebook(); } });

  /* ---------- styles ---------- */
  const css = `
.ax-hb{ height:40px; min-width:40px; padding:0 14px; border-radius:999px; border:1px solid var(--rule); background:var(--surface); color:var(--text);
  display:flex; align-items:center; justify-content:center; gap:7px; font:inherit; font-weight:600; font-size:14px; box-shadow:var(--shadow); white-space:nowrap; cursor:pointer; flex:none; }
.ax-hb:hover{ border-color:var(--marigold); }
.ax-hb svg{ width:18px; height:18px; flex:none; }
.ax-hb.ax-ai{ background:linear-gradient(135deg,var(--marigold),var(--pink)); color:#fff; border-color:transparent; }
.ax-hb.ax-ai:hover{ filter:brightness(1.06); }
.ax-hb .ax-kbd{ font-size:11px; font-weight:600; opacity:.8; border:1px solid rgba(255,255,255,.5); border-radius:6px; padding:1px 5px; }
.ax-hb.ax-nbb{ padding:0; width:40px; }
@media (max-width:900px){ .ax-hb .ax-kbd{ display:none; } }
@media (max-width:640px){ .ax-hb{ height:36px; min-width:36px; padding:0 9px; } .ax-hb .ax-lbl{ display:none; } .ax-hb.ax-nbb{ width:36px; } }
@media (max-width:480px){ .ax-hb{ order:2; height:34px; min-width:34px; width:34px; padding:0; } .ax-hb svg{ width:17px; height:17px; } }

.ax-back{ position:fixed; inset:0; z-index:120; background:rgba(15,14,20,.45); display:none; }
.ax-back.open{ display:block; }
.ax-panel{ position:fixed; top:0; right:0; bottom:0; width:min(560px,100%); background:var(--ink); color:var(--text); border-left:1px solid var(--rule);
  box-shadow:-20px 0 60px -30px rgba(0,0,0,.4); display:flex; flex-direction:column; z-index:121; transform:translateX(100%); transition:transform .22s ease; visibility:hidden; }
.ax-panel.open{ transform:none; visibility:visible; }
.ax-ph{ display:flex; align-items:center; gap:10px; padding:14px 16px; border-bottom:1px solid var(--rule); background:var(--surface); }
.ax-ph h2{ font-family:var(--display,inherit); font-size:18px; font-weight:600; margin:0; flex:1; display:flex; align-items:center; gap:8px; }
.ax-ph h2 i{ width:28px; height:28px; border-radius:9px; background:linear-gradient(135deg,var(--marigold),var(--pink)); display:flex; align-items:center; justify-content:center; }
.ax-ph h2 i svg{ width:16px; height:16px; color:#fff; }
.ax-ib{ width:34px; height:34px; border-radius:50%; border:0; background:none; color:var(--muted); font-size:20px; line-height:1; cursor:pointer; display:flex; align-items:center; justify-content:center; }
.ax-ib:hover{ background:var(--surface-2); color:var(--text); }
.ax-ib svg{ width:18px; height:18px; }
.ax-sm{ border:1px solid var(--rule); background:var(--surface); color:var(--muted); font:inherit; font-size:13px; font-weight:600; padding:6px 12px; border-radius:999px; cursor:pointer; }
.ax-sm:hover{ border-color:var(--marigold); color:var(--marigold); }
.ax-body{ flex:1; overflow:auto; padding:16px; overscroll-behavior:contain; }
.ax-ctx{ background:var(--surface); border:1px solid var(--rule); border-left:4px solid var(--violet); border-radius:12px; padding:10px 12px; margin-bottom:14px; font-size:13.5px; }
.ax-ctx .h{ display:flex; align-items:center; gap:8px; color:var(--faint); font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; }
.ax-ctx .h span{ flex:1; }
.ax-ctx .h button{ border:0; background:none; color:var(--faint); cursor:pointer; font:inherit; font-size:12px; text-decoration:underline; text-transform:none; letter-spacing:0; }
.ax-ctx .l{ font-weight:600; color:var(--violet); margin:4px 0 2px; font-size:13px; }
.ax-ctx .q{ color:var(--text); display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; line-height:1.5; }
.ax-chips{ display:flex; flex-wrap:wrap; gap:8px; margin:4px 0 16px; }
.ax-chips .ax-hint{ width:100%; font-size:12px; font-weight:600; color:var(--faint); text-transform:uppercase; letter-spacing:.05em; }
.ax-chip{ border:1px solid var(--rule); background:var(--surface); color:var(--text); font:inherit; font-size:13.5px; padding:7px 12px; border-radius:999px; cursor:pointer; text-align:left; }
.ax-chip:hover{ border-color:var(--violet); color:var(--violet); }
.ax-turn{ margin-bottom:18px; }
.ax-you{ margin-left:auto; max-width:88%; width:fit-content; background:var(--violet-soft); color:var(--text); border-radius:14px 14px 4px 14px; padding:9px 13px; font-size:14.5px; line-height:1.5; margin-bottom:10px; white-space:pre-wrap; }
.ax-ans{ background:var(--surface); border:1px solid var(--rule); border-radius:14px; padding:14px 16px; font-size:14.5px; line-height:1.65; box-shadow:var(--shadow); }
.ax-md h4{ font-size:15px; margin:14px 0 6px; color:var(--marigold); }
.ax-md h4:first-child{ margin-top:0; }
.ax-md p{ margin:0 0 9px; }
.ax-md ul, .ax-md ol{ margin:0 0 10px; padding-left:20px; }
.ax-md li{ margin:3px 0; }
.ax-md code{ background:var(--surface-2); border-radius:5px; padding:1px 5px; font-size:.92em; }
.ax-md a{ color:var(--violet); text-decoration:underline; }
.ax-tw{ overflow-x:auto; margin:0 0 10px; }
.ax-md table{ border-collapse:collapse; font-size:13.5px; min-width:100%; }
.ax-md th, .ax-md td{ border:1px solid var(--rule); padding:6px 8px; text-align:left; vertical-align:top; }
.ax-md th{ background:var(--surface-2); }
.ax-src{ margin-top:10px; padding-top:10px; border-top:1px dashed var(--rule); font-size:12.5px; color:var(--muted); }
.ax-src b{ display:block; font-size:11.5px; text-transform:uppercase; letter-spacing:.05em; color:var(--faint); margin-bottom:4px; }
.ax-src a{ display:block; color:var(--violet); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ax-acts{ display:flex; gap:8px; flex-wrap:wrap; margin-top:12px; align-items:center; }
.ax-save{ background:var(--marigold); color:var(--on-accent); border-color:var(--marigold); }
.ax-save:hover{ color:var(--on-accent); filter:brightness(1.05); }
.ax-acts .ax-save[disabled]{ background:var(--mint-soft); color:var(--mint); border-color:var(--mint); cursor:default; }
.ax-acts .ax-meta{ margin-left:auto; font-size:12px; color:var(--faint); }
.ax-load{ display:flex; align-items:center; gap:10px; color:var(--muted); font-size:14px; }
.ax-load i{ width:18px; height:18px; border-radius:50%; border:2px solid var(--rule); border-top-color:var(--marigold); animation:axspin .8s linear infinite; }
@keyframes axspin{ to{ transform:rotate(360deg); } }
.ax-sk{ height:10px; border-radius:6px; background:var(--surface-2); margin-top:10px; animation:axpulse 1.2s ease-in-out infinite; }
@keyframes axpulse{ 50%{ opacity:.45; } }
.ax-err{ background:var(--pink-soft); color:var(--pink); border-radius:12px; padding:10px 12px; font-size:14px; }
.ax-foot{ border-top:1px solid var(--rule); padding:12px 16px calc(12px + env(safe-area-inset-bottom)); background:var(--surface); }
.ax-form{ display:flex; gap:8px; align-items:flex-end; }
.ax-form textarea{ flex:1; resize:none; min-height:44px; max-height:140px; border:1px solid var(--rule); border-radius:14px; padding:11px 13px; font:inherit; font-size:15px; background:var(--ink); color:var(--text); line-height:1.4; }
.ax-form textarea:focus{ outline:2px solid var(--marigold); outline-offset:-1px; border-color:transparent; }
.ax-send{ height:44px; padding:0 18px; border-radius:14px; border:0; background:var(--marigold); color:var(--on-accent); font:inherit; font-weight:700; font-size:15px; cursor:pointer; }
.ax-send[disabled]{ opacity:.5; cursor:default; }
.ax-fine{ font-size:11.5px; color:var(--faint); margin-top:8px; display:flex; gap:10px; justify-content:space-between; flex-wrap:wrap; }
.ax-sv{ margin-top:12px; background:var(--surface-2); border-radius:12px; padding:12px; display:grid; gap:8px; }
.ax-sv label{ display:grid; gap:4px; font-size:12px; font-weight:600; color:var(--muted); }
.ax-sv .row{ display:grid; grid-template-columns:1fr 1fr; gap:8px; }
@media (max-width:420px){ .ax-sv .row{ grid-template-columns:1fr; } }
.ax-newin{ margin-top:6px; }
.ax-in, .ax-sel{ width:100%; border:1px solid var(--rule); border-radius:10px; padding:8px 10px; font:inherit; font-size:14px; background:var(--surface); color:var(--text); min-width:0; }
.ax-sv .btns{ display:flex; gap:8px; justify-content:flex-end; }
.ax-toast{ position:fixed; left:50%; bottom:24px; transform:translateX(-50%) translateY(20px); background:var(--text); color:var(--ink); padding:10px 16px; border-radius:999px; font-size:14px; font-weight:600;
  z-index:200; opacity:0; transition:all .2s; pointer-events:none; display:flex; gap:12px; align-items:center; max-width:calc(100% - 32px); }
.ax-toast.on{ opacity:1; transform:translateX(-50%); pointer-events:auto; }
.ax-toast button{ border:0; background:none; color:var(--marigold-soft); font:inherit; font-weight:700; text-decoration:underline; cursor:pointer; padding:0; }
.ax-q{ display:inline-flex; align-items:center; gap:6px; border:1px solid var(--violet); color:var(--violet); background:var(--violet-soft); font:inherit; font-size:13px; font-weight:600;
  padding:6px 12px; border-radius:999px; cursor:pointer; white-space:nowrap; }
.ax-q:hover{ background:var(--violet); color:#fff; }
.ax-q svg{ width:14px; height:14px; }
.qright .ax-q{ margin-top:12px; }
.sr-meta .ax-q{ margin-left:auto; padding:3px 10px; font-size:12.5px; }

/* notebook */
.nb-wrap{ position:fixed; inset:0; z-index:110; background:var(--ink); color:var(--text); display:none; flex-direction:column; }
.nb-wrap.open{ display:flex; }
.nb-wrap.nb-page{ position:static; display:flex; min-height:70vh; background:none; z-index:auto; }
.nb-head{ display:flex; align-items:center; gap:10px; padding:14px 20px; border-bottom:1px solid var(--rule); background:var(--surface); flex-wrap:wrap; }
.nb-page .nb-head{ background:none; border:0; padding:8px 0 16px; }
.nb-head h2{ font-family:var(--display,inherit); font-size:22px; font-weight:600; margin:0; display:flex; align-items:center; gap:10px; }
.nb-head h2 svg{ width:22px; height:22px; color:var(--marigold); }
.nb-head .nb-count{ color:var(--faint); font-size:14px; font-weight:500; }
.nb-head .sp{ flex:1; }
.nb-search{ width:220px; max-width:100%; border:1px solid var(--rule); border-radius:999px; padding:8px 14px; font:inherit; font-size:14px; background:var(--ink); color:var(--text); }
.nb-new{ background:var(--marigold); color:var(--on-accent); border:0; border-radius:999px; padding:9px 16px; font:inherit; font-weight:700; font-size:14px; cursor:pointer; }
.nb-main{ flex:1; display:grid; grid-template-columns:260px 1fr; min-height:0; }
.nb-page .nb-main{ border:1px solid var(--rule); border-radius:var(--radius,14px); background:var(--surface); overflow:hidden; }
.nb-side{ border-right:1px solid var(--rule); overflow:auto; padding:12px 10px; background:var(--surface); }
.nb-side .g{ font-size:11.5px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--faint); padding:12px 10px 4px; }
.nb-s{ display:flex; width:100%; align-items:center; gap:8px; text-align:left; border:0; background:none; color:var(--text); font:inherit; font-size:14px; padding:7px 10px; border-radius:9px; cursor:pointer; }
.nb-s:hover{ background:var(--surface-2); }
.nb-s.on{ background:var(--marigold-soft); color:var(--marigold); font-weight:600; }
.nb-s span{ flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.nb-s em{ font-style:normal; font-size:12px; color:var(--faint); background:var(--surface-2); border-radius:999px; padding:1px 7px; }
.nb-s.on em{ background:var(--surface); }
.nb-s.t{ padding-left:24px; font-size:13.5px; }
.nb-list{ overflow:auto; padding:18px 22px 40px; background:var(--ink); }
.nb-page .nb-list{ background:var(--ink); max-height:none; }
.nb-banner{ background:var(--amber-soft); color:var(--amber); border-radius:12px; padding:10px 14px; font-size:13.5px; display:flex; gap:10px; align-items:center; margin-bottom:14px; flex-wrap:wrap; }
.nb-banner span{ flex:1; min-width:200px; }
.nb-banner.ok{ background:var(--mint-soft); color:var(--mint); }
.nb-crumb{ font-size:13px; color:var(--faint); margin-bottom:12px; }
.nb-crumb b{ color:var(--text); }
.nb-th{ font-size:13px; font-weight:700; color:var(--violet); text-transform:uppercase; letter-spacing:.05em; margin:18px 0 8px; }
.nb-th:first-of-type{ margin-top:0; }
.nb-card{ background:var(--surface); border:1px solid var(--rule); border-radius:14px; padding:14px 16px; margin-bottom:12px; box-shadow:var(--shadow); }
.nb-card h3{ font-size:16px; margin:0 0 4px; line-height:1.35; }
.nb-meta{ display:flex; flex-wrap:wrap; gap:6px 10px; font-size:12px; color:var(--faint); margin-bottom:8px; align-items:center; }
.nb-meta .src{ font-weight:700; border-radius:999px; padding:1px 8px; background:var(--violet-soft); color:var(--violet); }
.nb-meta .src.me{ background:var(--amber-soft); color:var(--amber); }
.nb-meta .tp{ background:var(--surface-2); border-radius:999px; padding:1px 8px; color:var(--muted); }
.nb-meta a{ color:var(--violet); text-decoration:underline; }
.nb-body{ font-size:14.5px; line-height:1.65; position:relative; }
.nb-body.clip{ max-height:190px; overflow:hidden; }
.nb-body.clip::after{ content:''; position:absolute; left:0; right:0; bottom:0; height:60px; background:linear-gradient(transparent,var(--surface)); }
.nb-cacts{ display:flex; gap:8px; margin-top:10px; flex-wrap:wrap; }
.nb-cacts .del:hover{ border-color:var(--pink); color:var(--pink); }
.nb-cacts .del.armed{ background:var(--pink); border-color:var(--pink); color:#fff; }
.nb-edit textarea{ width:100%; min-height:200px; resize:vertical; border:1px solid var(--rule); border-radius:10px; padding:10px 12px; font:inherit; font-size:14.5px; line-height:1.55; background:var(--ink); color:var(--text); }
.nb-edit{ display:grid; gap:8px; }
.nb-edit .row{ display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.nb-empty{ text-align:center; padding:60px 20px; color:var(--muted); }
.nb-empty h3{ font-family:var(--display,inherit); font-size:20px; color:var(--text); margin:12px 0 6px; }
.nb-empty svg{ width:44px; height:44px; color:var(--marigold); }
.nb-empty p{ max-width:380px; margin:0 auto 16px; font-size:14.5px; line-height:1.6; }
.nb-mob{ display:none; }
@media (max-width:760px){
  .nb-main{ grid-template-columns:1fr; }
  .nb-side{ display:none; }
  .nb-mob{ display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px; }
  .nb-head{ padding:12px 16px; }
  .nb-search{ width:100%; order:5; }
  .nb-list{ padding:14px 16px 40px; }
  .nb-edit .row{ grid-template-columns:1fr; }
}
@media print{
  body > *:not(.nb-wrap){ display:none !important; }
  .nb-wrap{ position:static; display:block; }
  .nb-side, .nb-head .sp, .nb-search, .nb-new, .nb-head button, .nb-cacts, .nb-banner, .nb-mob{ display:none !important; }
  .nb-body.clip{ max-height:none; } .nb-body.clip::after{ display:none; }
}
`;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  const I = {
    spark: '<svg viewBox="0 0 24 24" fill="none"><path fill="currentColor" d="M12 2c.9 6.6 1.5 7.2 9 9-7.5 1.8-8.1 2.4-9 9-.9-6.6-1.5-7.2-9-9 7.5-1.8 8.1-2.4 9-9z"/><path fill="currentColor" opacity=".7" d="M19 2c.3 2 .5 2.2 2.5 2.5-2 .3-2.2.5-2.5 2.5-.3-2-.5-2.2-2.5-2.5 2-.3 2.2-.5 2.5-2.5z"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5V5a2 2 0 0 1 2-2h13v16H6.5A2.5 2.5 0 0 0 4 21.5v-2z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H19M9 7h6M9 11h4"/></svg>',
    reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
  };

  /* ---------- toast ---------- */
  const toast = document.createElement('div'); toast.className = 'ax-toast'; toast.setAttribute('role', 'status'); toast.setAttribute('data-no-i18n', '');
  document.body.appendChild(toast);
  let toastT = null;
  function say(msg, action) {
    toast.innerHTML = `<span>${esc(msg)}</span>` + (action ? `<button type="button">${esc(action.label)}</button>` : '');
    if (action) toast.querySelector('button').onclick = () => { toast.classList.remove('on'); action.run(); };
    toast.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('on'), 4200);
  }

  /* ---------- subject / topic picker (shared by save form and note editor) ---------- */
  function subjectOptions(sel) {
    const used = [...new Set(live().map(n => n.subject))].filter(s => !subjectOf(s));
    let h = '';
    TAX.forEach(g => { h += `<optgroup label="${esc(trS(g.name))}">` + g.subjects.map(s => `<option value="${esc(s.name)}"${s.name === sel ? ' selected' : ''}>${esc(trS(s.name))}</option>`).join('') + '</optgroup>'; });
    if (sel && !subjectOf(sel) && !used.includes(sel)) used.push(sel);
    if (used.length) h += `<optgroup label="${esc(t('My subjects'))}">` + used.map(s => `<option value="${esc(s)}"${s === sel ? ' selected' : ''}>${esc(s)}</option>`).join('') + '</optgroup>';
    return h + `<option value="__new">${esc(t('+ New subject…'))}</option>`;
  }
  function topicOptions(subject, sel) {
    const base = (subjectOf(subject) || { topics: [] }).topics;
    const mine = [...new Set(live().filter(n => n.subject === subject && n.topic).map(n => n.topic))].filter(x => !base.includes(x));
    if (sel && !base.includes(sel) && !mine.includes(sel)) mine.push(sel);
    return `<option value=""${!sel ? ' selected' : ''}>${esc(t('General'))}</option>` +
      [...base, ...mine].map(x => `<option value="${esc(x)}"${x === sel ? ' selected' : ''}>${esc(trS(x))}</option>`).join('') +
      `<option value="__new">${esc(t('+ New topic…'))}</option>`;
  }
  // wires a <select data-f=subject> + <select data-f=topic> pair inside root; "+ New…" shows a text box under the select
  function wirePicker(root) {
    const ss = root.querySelector('[data-f=subject]'), ts = root.querySelector('[data-f=topic]');
    const box = (sel, ph) => { const i = document.createElement('input'); i.className = 'ax-in ax-newin'; i.maxLength = 120; i.placeholder = ph; i.hidden = true; sel.insertAdjacentElement('afterend', i); return i; };
    const sNew = box(ss, t('New subject name')), tNew = box(ts, t('New topic name'));
    ss.addEventListener('change', () => {
      sNew.hidden = ss.value !== '__new';
      ts.innerHTML = topicOptions(ss.value === '__new' ? '' : ss.value, '');
      tNew.hidden = true;
      if (!sNew.hidden) sNew.focus();
    });
    ts.addEventListener('change', () => { tNew.hidden = ts.value !== '__new'; if (!tNew.hidden) tNew.focus(); });
    return () => ({ subject: ss.value === '__new' ? sNew.value.trim().slice(0, 80) : ss.value, topic: ts.value === '__new' ? tNew.value.trim().slice(0, 120) : ts.value });
  }
  function guessPlace(ctx) {
    if (ctx && ctx.subject) {
      const s = subjectOf(ctx.subject);
      const tp = (ctx.topic || '').split(', ').find(x => s && s.topics.includes(x)) || (ctx.topic || '').split(', ')[0] || '';
      return { subject: ctx.subject, topic: tp };
    }
    return lsGet('pyq-nb-last', { subject: SUBJECTS[0] ? SUBJECTS[0].name : 'Miscellaneous', topic: '' });
  }

  /* ---------- AI ---------- */
  const PRESETS = {
    prelims: [['explain', 'Explain this question'], ['concepts', 'Concept and related facts'], ['mains', 'Mains angle']],
    mains: [['outline', 'Answer outline'], ['keywords', 'Keywords and examples'], ['concepts', 'Concept and related facts']],
  };
  const PRESET_TEXT = {
    explain: 'Explain this question: why the official answer is correct, and why each of the other options or statements is right or wrong.',
    concepts: 'Teach me the core concept behind this question and the related facts UPSC could ask next.',
    mains: 'How could this topic be asked in Mains? Give the key points, examples and a short answer structure.',
    outline: 'Give me a model answer outline for this Mains question: introduction, body points with examples and data, way forward and conclusion, within the word limit.',
    keywords: 'List the keywords, constitutional or legal provisions, committees, reports, data points and examples I should use in this answer.',
  };
  const EXAMPLES = HI
    ? ['रेपो दर और रिवर्स रेपो दर में अंतर', 'मौलिक अधिकार बनाम नीति निदेशक तत्व', 'भारत में बाघ संरक्षण: परियोजना टाइगर से अब तक']
    : ['Difference between repo rate and reverse repo rate', 'Fundamental Rights vs Directive Principles', 'Tiger conservation in India: Project Tiger to today'];

  // The same instructions the Worker uses (ai-worker/prompt.js); only the demo builds the prompt in the browser.
  const SYSTEM = `You are Astra, the study assistant of PYQ Astra, a free UPSC Civil Services exam practice site. You help aspirants research questions and topics and build revision notes.
Rules:
- Be accurate and exam-focused. If you are not sure of a fact, date, article number or figure, say so instead of guessing. Never invent sources.
- When an official UPSC answer is given, treat it as correct and explain it; if it looks disputed, say so politely.
- Format in Markdown: short "## " headings, bullet points, **bold** key terms, a table only when comparing things. No preamble.
- Keep it to about 350 words unless the student asks for more.
- Finish with "## Quick revision": 3 to 5 one-line bullets worth memorising.
- Stay on UPSC-relevant study topics. Politely decline anything else.`;
  function buildUser(req) {
    const c = req.ctx; let s = '';
    if (c) {
      s += `Question from UPSC ${c.kind === 'mains' ? 'Mains' : c.kind === 'csat' ? 'Prelims CSAT' : 'Prelims GS'}${c.year ? ' ' + c.year : ''}${c.subject ? ', ' + c.subject : ''}${c.topic ? ' / ' + c.topic : ''}:\n`;
      if (c.passage) s += `Passage: ${c.passage}\n`;
      s += `${c.text}\n`;
      if (c.options && c.options.length) s += c.options.map((o, i) => `(${'abcd'[i]}) ${o}`).join('\n') + '\n';
      if (c.answer) s += c.answer === 'x' ? 'UPSC dropped this question.\n' : `Official answer: (${c.answer})\n`;
      if (c.marks) s += `Marks: ${c.marks}\n`;
      s += '\n';
    }
    s += `Student's request: ${req.query}\n`;
    if (req.lang === 'hi') s += '\nWrite the whole answer in Hindi (Devanagari script), keeping standard English terms in brackets where useful.';
    return s;
  }

  async function askAI(req) {
    if (CFG.demo) {
      const sample = await (window.claude && window.claude.use ? window.claude.use('sample') : null);
      if (!sample) throw { code: 'unavailable', message: 'The demo AI is not available in this view.' };
      const msgs = [];
      (req.history || []).forEach(h => msgs.push({ role: h.role, content: h.content }));
      msgs.push({ role: 'user', content: buildUser(req) });
      msgs[0] = { role: msgs[0].role, content: SYSTEM + '\n\n' + msgs[0].content };
      if (msgs[0].role !== 'user') msgs.unshift({ role: 'user', content: SYSTEM });
      const r = await sample(msgs, { modelTier: 'quick', cache: false });
      const d = lsGet('pyq-ai-demo', { day: '', n: 0 }), today = new Date().toDateString();
      if (d.day !== today) { d.day = today; d.n = 0; } d.n++; lsSet('pyq-ai-demo', d);
      return { answer: r.text, sources: [], remaining: Math.max(0, (CFG.dailyLimit || 20) - d.n), limit: CFG.dailyLimit || 20 };
    }
    const tok = auth() && (await auth().token());
    const res = await fetch(CFG.endpoint.replace(/\/$/, '') + '/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (tok || '') },
      body: JSON.stringify(req),
    });
    let data = {}; try { data = await res.json(); } catch (e) {}
    if (!res.ok) throw { code: data.error || res.status, message: data.message, remaining: data.remaining };
    return data;
  }

  /* ---------- AI panel ---------- */
  const back = document.createElement('div'); back.className = 'ax-back';
  const panel = document.createElement('aside'); panel.className = 'ax-panel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', t('Ask AI')); panel.setAttribute('data-no-i18n', '');
  panel.innerHTML = `
    <div class="ax-ph"><h2><i>${I.spark}</i>${esc(t('Ask AI'))}</h2>
      <button class="ax-sm" type="button" data-ax="reset" title="${esc(t('New chat'))}">${esc(t('New chat'))}</button>
      <button class="ax-sm" type="button" data-ax="nb">${esc(t('Notebook'))}</button>
      <button class="ax-ib" type="button" data-ax="close" aria-label="${esc(t('Close'))}">×</button></div>
    <div class="ax-body" id="axBody"></div>
    <div class="ax-foot"><form class="ax-form" id="axForm"><textarea id="axIn" rows="1" maxlength="600" placeholder="${esc(t('Ask anything about UPSC: a concept, a question, a current issue…'))}"></textarea>
      <button class="ax-send" id="axSend" type="submit">${esc(t('Ask'))}</button></form>
      <div class="ax-fine"><span>${esc(t('AI answers can be wrong. Check facts against NCERTs and official sources before you revise from them.'))}</span><span id="axQuota"></span></div></div>`;
  document.body.appendChild(back); document.body.appendChild(panel);
  const $b = panel.querySelector('#axBody'), $in = panel.querySelector('#axIn'), $send = panel.querySelector('#axSend'), $quota = panel.querySelector('#axQuota');
  const S = { ctx: null, turns: [], busy: false, remaining: null, limit: null };

  function renderPanel() {
    let h = '';
    if (S.ctx) {
      h += `<div class="ax-ctx"><div class="h"><span>${esc(t('Attached question'))}</span><button type="button" data-ax="unctx">${esc(t('Remove'))}</button></div>
        <div class="l">${esc(S.ctx.label)}${S.ctx.subject ? ' · ' + esc(trS(S.ctx.subject)) : ''}</div><div class="q">${esc(S.ctx.text)}</div></div>`;
    }
    if (!S.turns.length) {
      const chips = S.ctx ? PRESETS[S.ctx.kind === 'mains' ? 'mains' : 'prelims'].map(([k, l]) => `<button class="ax-chip" type="button" data-preset="${k}">${esc(t(l))}</button>`)
                          : EXAMPLES.map(x => `<button class="ax-chip" type="button" data-ex="${esc(x)}">${esc(x)}</button>`);
      h += `<div class="ax-chips"><span class="ax-hint">${esc(t('Try asking'))}</span>${chips.join('')}</div>`;
    }
    S.turns.forEach((tn, i) => {
      h += `<div class="ax-turn" data-i="${i}"><div class="ax-you">${esc(tn.label || tn.query)}</div>`;
      if (tn.loading) h += `<div class="ax-ans"><div class="ax-load"><i></i>${esc(t('Researching…'))}</div><div class="ax-sk" style="width:92%"></div><div class="ax-sk" style="width:76%"></div><div class="ax-sk" style="width:84%"></div></div>`;
      else if (tn.error) h += `<div class="ax-err">${esc(tn.error)}</div>`;
      else {
        h += `<div class="ax-ans"><div class="ax-md">${md(tn.answer)}</div>`;
        if (tn.sources && tn.sources.length) h += `<div class="ax-src"><b>${esc(t('Sources'))}</b>${tn.sources.slice(0, 5).map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title || s.url)}</a>`).join('')}</div>`;
        h += `<div class="ax-acts"><button class="ax-sm ax-save" type="button" data-save="${i}"${tn.saved ? ' disabled' : ''}>${esc(tn.saved ? '✓ ' + t('Saved') : t('Save to notebook'))}</button>
          <button class="ax-sm" type="button" data-copy="${i}">${esc(t('Copy'))}</button>${tn.cached ? '<span class="ax-meta">⚡</span>' : ''}</div>`;
        if (tn.saving) {
          const p = guessPlace(S.ctx);
          h += `<div class="ax-sv" data-sv="${i}"><label>${esc(t('Title'))}<input class="ax-in" data-f="title" maxlength="200" value="${esc(defaultTitle(tn))}"></label>
            <div class="row"><label>${esc(t('Subject'))}<select class="ax-sel" data-f="subject">${subjectOptions(p.subject)}</select></label>
            <label>${esc(t('Topic'))}<select class="ax-sel" data-f="topic">${topicOptions(p.subject, p.topic)}</select></label></div>
            <div class="btns"><button class="ax-sm" type="button" data-svx="${i}">${esc(t('Cancel'))}</button><button class="ax-sm ax-save" type="button" data-svok="${i}">${esc(t('Save'))}</button></div></div>`;
        }
        h += '</div>';
      }
      h += '</div>';
    });
    $b.innerHTML = h;
    $b.querySelectorAll('.ax-sv').forEach(el => { el._get = wirePicker(el); });
    $in.placeholder = S.turns.length ? t('Ask a follow-up…') : t('Ask anything about UPSC: a concept, a question, a current issue…');
    $send.disabled = S.busy;
    $quota.textContent = S.remaining != null ? (HI ? `आज ${S.remaining}/${S.limit} बचे` : `${S.remaining} of ${S.limit} left today`) : '';
  }
  function defaultTitle(tn) {
    if (S.ctx && tn === S.turns[0]) return `${S.ctx.label}: ${plain(S.ctx.text).slice(0, 90)}${plain(S.ctx.text).length > 90 ? '…' : ''}`;
    return (tn.label || tn.query).slice(0, 140);
  }

  async function send(query, preset) {
    query = (query || '').trim();
    if (!query || S.busy) return;
    if (!AI_ON) { say(t('AI search is not switched on yet.')); return; }
    if (!signedIn()) { if (auth()) auth().wall('ai'); else say(t('Sign in') + ' →'); return; }
    const history = [];
    S.turns.filter(x => x.answer).slice(-MAX_HISTORY / 2).forEach(x => { history.push({ role: 'user', content: x.query }); history.push({ role: 'assistant', content: x.answer.slice(0, 3000) }); });
    const turn = { query, label: preset ? t(PRESETS.prelims.concat(PRESETS.mains).find(p => p[0] === preset)[1]) : query, loading: true };
    S.turns.push(turn); S.busy = true; renderPanel(); $b.scrollTop = $b.scrollHeight;
    const ctx = S.ctx ? Object.assign({}, S.ctx) : null;
    if (ctx) { delete ctx.label; delete ctx.url; }
    try {
      const r = await askAI({ query, preset: preset || undefined, ctx, lang: HI ? 'hi' : 'en', history });
      Object.assign(turn, { loading: false, answer: r.answer || '', sources: r.sources || [], cached: !!r.cached });
      if (r.remaining != null) { S.remaining = r.remaining; S.limit = r.limit; }
    } catch (e) {
      turn.loading = false;
      turn.error = e && e.code === 'limit' ? t('Daily AI limit reached. It resets at midnight (IST).') : (e && e.message) || t('Something went wrong. Please try again.');
      if (e && e.remaining != null) S.remaining = e.remaining;
    }
    S.busy = false; renderPanel();
    const el = $b.querySelector(`.ax-turn[data-i="${S.turns.indexOf(turn)}"]`); if (el) $b.scrollTop = el.offsetTop - 12;
  }

  panel.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const ax = b.dataset.ax;
    if (ax === 'close') return closePanel();
    if (ax === 'reset') { S.turns = []; S.ctx = null; renderPanel(); $in.focus(); return; }
    if (ax === 'nb') { closePanel(); openNotebook(); return; }
    if (ax === 'unctx') { S.ctx = null; renderPanel(); return; }
    if (b.dataset.preset) return send(PRESET_TEXT[b.dataset.preset], b.dataset.preset);
    if (b.dataset.ex) return send(b.dataset.ex);
    if (b.dataset.copy != null) { const tn = S.turns[+b.dataset.copy]; try { navigator.clipboard.writeText(tn.answer); b.textContent = t('Copied'); } catch (x) {} return; }
    if (b.dataset.save != null) { S.turns.forEach(x => x.saving = false); S.turns[+b.dataset.save].saving = true; renderPanel();
      const f = $b.querySelector(`[data-sv="${b.dataset.save}"]`); if (f) f.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return; }
    if (b.dataset.svx != null) { S.turns[+b.dataset.svx].saving = false; renderPanel(); return; }
    if (b.dataset.svok != null) {
      const i = +b.dataset.svok, tn = S.turns[i], f = $b.querySelector(`[data-sv="${i}"]`), place = f._get();
      const title = f.querySelector('[data-f=title]').value;
      let body = tn.answer;
      if (tn.sources && tn.sources.length) body += '\n\n## Sources\n' + tn.sources.slice(0, 5).map(s => `- [${(s.title || s.url).replace(/[\[\]]/g, '')}](${s.url})`).join('\n');
      const note = putNote({ title, subject: place.subject, topic: place.topic, body, src: 'ai', q: tn.query.slice(0, 600),
        ref: S.ctx ? { id: S.ctx.id, label: S.ctx.label, url: S.ctx.url || '' } : null });
      tn.saving = false; tn.saved = true; renderPanel();
      say(`${t('Saved to')} ${trS(note.subject)}${note.topic ? ' › ' + trS(note.topic) : ''}`, { label: t('Open notebook'), run: () => { closePanel(); openNotebook({ subject: note.subject, topic: note.topic }); } });
    }
  });
  panel.querySelector('#axForm').addEventListener('submit', e => { e.preventDefault(); const v = $in.value; $in.value = ''; grow(); send(v); });
  $in.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); panel.querySelector('#axForm').requestSubmit(); } });
  const grow = () => { $in.style.height = 'auto'; $in.style.height = Math.min(140, $in.scrollHeight) + 'px'; };
  $in.addEventListener('input', grow);
  back.addEventListener('click', closePanel);

  let lastFocus = null;
  function openPanel(opts) {
    opts = opts || {};
    if (opts.ctx && (!S.ctx || S.ctx.id !== opts.ctx.id)) { S.ctx = opts.ctx; S.turns = []; }
    lastFocus = document.activeElement;
    back.classList.add('open'); panel.classList.add('open'); document.body.style.overflow = 'hidden';
    renderPanel();
    if (opts.query) { send(opts.query); } else setTimeout(() => $in.focus(), 60);
  }
  function closePanel() {
    back.classList.remove('open'); panel.classList.remove('open');
    if (!nbWrap.classList.contains('open') && !document.querySelector('#sv:not([hidden]), #fx:not([hidden])')) document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {}
  }

  /* ---------- notebook view ---------- */
  const nbWrap = document.createElement('section'); nbWrap.className = 'nb-wrap'; nbWrap.setAttribute('data-no-i18n', '');
  nbWrap.setAttribute('aria-label', t('Revision notebook'));
  const NV = { subject: '__all', topic: null, q: '', edit: null, open: {} };
  let nbPage = false;

  function counts() {
    const c = {};
    live().forEach(n => { const s = c[n.subject] = c[n.subject] || { n: 0, t: {} }; s.n++; const k = n.topic || ''; s.t[k] = (s.t[k] || 0) + 1; });
    return c;
  }
  function visibleNotes() {
    const q = NV.q.trim().toLowerCase();
    return live().filter(n => (NV.subject === '__all' || n.subject === NV.subject) && (NV.topic == null || (n.topic || '') === NV.topic) &&
      (!q || (n.title + ' ' + n.body + ' ' + n.subject + ' ' + (n.topic || '')).toLowerCase().includes(q)));
  }
  function editorHTML(n) {
    return `<div class="nb-card nb-edit" data-edit="${esc(n.id || '')}">
      <input class="ax-in" data-f="title" maxlength="200" placeholder="${esc(t('Title'))}" value="${esc(n.title || '')}">
      <div class="row"><select class="ax-sel" data-f="subject" aria-label="${esc(t('Subject'))}">${subjectOptions(n.subject)}</select>
      <select class="ax-sel" data-f="topic" aria-label="${esc(t('Topic'))}">${topicOptions(n.subject, n.topic)}</select></div>
      <textarea data-f="body" placeholder="${esc(t('Write your note… (Markdown works: **bold**, - bullets, ## headings)'))}">${esc(n.body || '')}</textarea>
      <div class="nb-cacts" style="justify-content:flex-end"><button class="ax-sm" type="button" data-nb="cancel">${esc(t('Cancel'))}</button><button class="nb-new" type="button" data-nb="save">${esc(t('Save'))}</button></div></div>`;
  }
  function cardHTML(n) {
    if (NV.edit === n.id) return editorHTML(n);
    const long = (n.body || '').length > 600, open = NV.open[n.id];
    const ref = n.ref && n.ref.label ? (n.ref.url ? `<a href="${esc(n.ref.url)}">${esc(n.ref.label)}</a>` : `<span>${esc(n.ref.label)}</span>`) : '';
    return `<article class="nb-card" data-id="${esc(n.id)}"><h3>${esc(n.title)}</h3>
      <div class="nb-meta"><span class="src${n.src === 'ai' ? '' : ' me'}">${esc(n.src === 'ai' ? t('AI answer') : t('My note'))}</span>
        ${NV.subject === '__all' ? `<span class="tp">${esc(trS(n.subject))}${n.topic ? ' › ' + esc(trS(n.topic)) : ''}</span>` : ''}${ref}<span>${esc(fmtDate(n.updated))}</span></div>
      <div class="nb-body ax-md${long && !open ? ' clip' : ''}">${md(n.body)}</div>
      <div class="nb-cacts">${long ? `<button class="ax-sm" type="button" data-nb="more">${esc(open ? t('Show less') : t('Show more'))}</button>` : ''}
        <button class="ax-sm" type="button" data-nb="edit">${esc(t('Edit'))}</button>
        ${AI_ON ? `<button class="ax-sm" type="button" data-nb="ask">${esc(t('Ask AI about this'))}</button>` : ''}
        <button class="ax-sm del" type="button" data-nb="del">${esc(t('Delete'))}</button></div></article>`;
  }
  function renderNotebook() {
    const c = counts(), total = live().length;
    if (NV.subject !== '__all' && !c[NV.subject] && NV.edit !== '__new') { NV.subject = '__all'; NV.topic = null; }
    // sidebar: subjects that have notes, in taxonomy order, then the student's own
    const order = SUBJECTS.map(s => s.name).filter(s => c[s]).concat(Object.keys(c).filter(s => !subjectOf(s)).sort());
    let side = `<button class="nb-s${NV.subject === '__all' ? ' on' : ''}" data-s="__all"><span>${esc(t('All notes'))}</span><em>${total}</em></button>`;
    let lastG = '';
    order.forEach(s => {
      const g = (subjectOf(s) || { group: t('My subjects') }).group;
      if (g !== lastG) { side += `<div class="g">${esc(trS(g))}</div>`; lastG = g; }
      side += `<button class="nb-s${NV.subject === s && NV.topic == null ? ' on' : ''}" data-s="${esc(s)}"><span>${esc(trS(s))}</span><em>${c[s].n}</em></button>`;
      if (NV.subject === s) Object.keys(c[s].t).sort((a, b) => (a === '') - (b === '') || a.localeCompare(b)).forEach(tp => {
        side += `<button class="nb-s t${NV.topic === tp ? ' on' : ''}" data-s="${esc(s)}" data-t="${esc(tp)}"><span>${esc(tp ? trS(tp) : t('General'))}</span><em>${c[s].t[tp]}</em></button>`;
      });
    });
    // mobile pickers
    const mob = `<div class="nb-mob"><select class="ax-sel" data-mob="s"><option value="__all">${esc(t('All notes'))} (${total})</option>${order.map(s => `<option value="${esc(s)}"${s === NV.subject ? ' selected' : ''}>${esc(trS(s))} (${c[s].n})</option>`).join('')}</select>
      <select class="ax-sel" data-mob="t"${NV.subject === '__all' ? ' disabled' : ''}><option value="__any">${esc(t('All notes'))}</option>${NV.subject !== '__all' && c[NV.subject] ? Object.keys(c[NV.subject].t).map(tp => `<option value="${esc(tp)}"${NV.topic === tp ? ' selected' : ''}>${esc(tp ? trS(tp) : t('General'))}</option>`).join('') : ''}</select></div>`;

    let list = '';
    const a = auth();
    if (!CFG.demo && a && !a.user()) list += `<div class="nb-banner"><span>${esc(t('Notes are saved in this browser only. Sign in to keep them on every device.'))}</span><button class="ax-sm" type="button" data-nb="signin">${esc(t('Sign in'))}</button></div>`;
    list += mob;
    if (NV.edit === '__new') {
      const p = NV.subject !== '__all' ? { subject: NV.subject, topic: NV.topic || '' } : guessPlace(null);
      list += editorHTML({ id: '', subject: p.subject, topic: p.topic });
    }
    const notes = visibleNotes().sort((x, y) => y.updated - x.updated);
    if (!total && NV.edit !== '__new') {
      list += `<div class="nb-empty">${I.book}<h3>${esc(t('Your notebook is empty'))}</h3><p>${esc(t('Save AI answers or write your own notes. They are organised here by subject and topic.'))}</p>
        <button class="nb-new" type="button" data-nb="new">+ ${esc(t('New note'))}</button>${AI_ON ? ` <button class="ax-sm" type="button" data-nb="ai">${esc(t('Ask AI'))}</button>` : ''}</div>`;
    } else if (!notes.length && NV.edit !== '__new') {
      list += `<div class="nb-empty"><p>${esc(t('No notes match your search.'))}</p></div>`;
    } else if (NV.subject !== '__all') {
      list += `<div class="nb-crumb">${esc(trS(subjectOf(NV.subject) ? subjectOf(NV.subject).group : t('My subjects')))} › <b>${esc(trS(NV.subject))}</b>${NV.topic != null ? ' › <b>' + esc(NV.topic ? trS(NV.topic) : t('General')) + '</b>' : ''}</div>`;
      // group by topic
      const by = {};
      notes.forEach(n => (by[n.topic || ''] = by[n.topic || ''] || []).push(n));
      Object.keys(by).sort((x, y) => (x === '') - (y === '') || x.localeCompare(y)).forEach(tp => {
        if (NV.topic == null) list += `<div class="nb-th">${esc(tp ? trS(tp) : t('General'))}</div>`;
        list += by[tp].map(cardHTML).join('');
      });
    } else list += notes.map(cardHTML).join('');

    nbWrap.innerHTML = `<div class="nb-head"><h2>${I.book}${esc(t('Revision notebook'))} <span class="nb-count">${total} ${esc(total === 1 ? t('note') : t('notes'))}</span></h2><span class="sp"></span>
      <input class="nb-search" type="search" placeholder="${esc(t('Search notes'))}" value="${esc(NV.q)}" aria-label="${esc(t('Search notes'))}">
      ${total ? `<button class="ax-sm" type="button" data-nb="export">${esc(t('Export'))}</button>` : ''}
      <button class="nb-new" type="button" data-nb="new">+ ${esc(t('New note'))}</button>
      ${nbPage ? '' : `<button class="ax-ib" type="button" data-nb="close" aria-label="${esc(t('Close'))}">×</button>`}</div>
      <div class="nb-main"><nav class="nb-side" aria-label="${esc(t('Subject'))}">${side}</nav><div class="nb-list">${list}</div></div>`;
    const ed = nbWrap.querySelector('.nb-edit'); if (ed) { ed._get = wirePicker(ed); }
    const si = nbWrap.querySelector('.nb-search');
    si.addEventListener('input', () => { NV.q = si.value; const pos = si.selectionStart; renderNotebook(); const n2 = nbWrap.querySelector('.nb-search'); n2.focus(); try { n2.setSelectionRange(pos, pos); } catch (e) {} });
  }
  function refreshNotebook() { if (nbWrap.classList.contains('open') || nbPage) { if (NV.edit) return; renderNotebook(); } }

  nbWrap.addEventListener('change', e => {
    const m = e.target.dataset.mob; if (!m) return;
    if (m === 's') { NV.subject = e.target.value; NV.topic = null; }
    else NV.topic = e.target.value === '__any' ? null : e.target.value;
    renderNotebook();
  });
  nbWrap.addEventListener('click', e => {
    const s = e.target.closest('.nb-s');
    if (s) { NV.subject = s.dataset.s; NV.topic = s.dataset.t != null ? s.dataset.t : null; NV.edit = null; renderNotebook(); return; }
    const b = e.target.closest('[data-nb]'); if (!b) return;
    const act = b.dataset.nb, card = b.closest('[data-id]'), id = card && card.dataset.id;
    if (act === 'close') return closeNotebook();
    if (act === 'new') { NV.edit = '__new'; renderNotebook(); const ti = nbWrap.querySelector('.nb-edit [data-f=title]'); if (ti) ti.focus(); return; }
    if (act === 'ai') { closeNotebook(); openPanel(); return; }
    if (act === 'signin') { if (auth()) auth().signIn(); return; }
    if (act === 'export') return exportNotes();
    if (act === 'more') { NV.open[id] = !NV.open[id]; renderNotebook(); return; }
    if (act === 'edit') { NV.edit = id; renderNotebook(); return; }
    if (act === 'del') {   // two taps: the first turns the button into a confirm
      if (b.dataset.armed) { deleteNote(id); renderNotebook(); return; }
      b.dataset.armed = '1'; b.classList.add('armed'); b.textContent = t('Tap again to delete');
      setTimeout(() => { if (document.contains(b)) { delete b.dataset.armed; b.classList.remove('armed'); b.textContent = t('Delete'); } }, 4000); return;
    }
    if (act === 'ask') { const n = NB.notes[id]; closeNotebook(); S.ctx = null; S.turns = []; openPanel({ query: (HI ? 'इस विषय को और गहराई से समझाइए: ' : 'Go deeper on this topic: ') + n.title }); return; }
    if (act === 'cancel') { NV.edit = null; renderNotebook(); return; }
    if (act === 'save') {
      const ed = b.closest('.nb-edit'), place = ed._get();
      const prev = ed.dataset.edit ? NB.notes[ed.dataset.edit] : null;
      const body = ed.querySelector('[data-f=body]').value, title = ed.querySelector('[data-f=title]').value;
      if (!title.trim() && !body.trim()) { NV.edit = null; renderNotebook(); return; }
      const n = putNote(Object.assign({}, prev || {}, { title: title || plain(body).slice(0, 80), body, subject: place.subject, topic: place.topic }));
      NV.edit = null; NV.subject = n.subject; NV.topic = null; renderNotebook();
    }
  });
  function exportNotes() {
    const notes = live().sort((a, b) => a.subject.localeCompare(b.subject) || (a.topic || '').localeCompare(b.topic || '') || a.created - b.created);
    let out = `# ${t('Revision notebook')} (PYQ Astra)\n\n`, s = null, tp = null;
    notes.forEach(n => {
      if (n.subject !== s) { s = n.subject; tp = null; out += `\n# ${n.subject}\n`; }
      if ((n.topic || '') !== tp) { tp = n.topic || ''; out += `\n## ${tp || t('General')}\n`; }
      out += `\n### ${n.title}\n${n.ref && n.ref.label ? `_${n.ref.label}_\n\n` : ''}${n.body}\n`;
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([out], { type: 'text/markdown' }));
    a.download = 'pyqastra-revision-notebook.md'; document.body.appendChild(a); a.click(); a.remove();
  }
  function openNotebook(at) {
    if (at) { NV.subject = at.subject || '__all'; NV.topic = at.topic != null ? at.topic : null; }
    NV.edit = null; reloadNB();
    if (nbPage) { renderNotebook(); return; }
    if (!nbWrap.parentNode) document.body.appendChild(nbWrap);
    nbWrap.classList.add('open'); document.body.style.overflow = 'hidden'; renderNotebook();
    try { history.pushState({ pkNb: 1 }, ''); } catch (e) {}
  }
  function closeNotebook() {
    if (nbPage) return;
    nbWrap.classList.remove('open');
    if (!panel.classList.contains('open') && !document.querySelector('#sv:not([hidden]), #fx:not([hidden])')) document.body.style.overflow = '';
    try { if (history.state && history.state.pkNb) history.back(); } catch (e) {}
  }
  addEventListener('popstate', () => { if (nbWrap.classList.contains('open') && !nbPage) { nbWrap.classList.remove('open'); if (!panel.classList.contains('open')) document.body.style.overflow = ''; } });

  /* ---------- header buttons ---------- */
  function addHeader() {
    const slot = document.querySelector('.head-right'); if (!slot || slot.querySelector('.ax-hb')) return;
    const before = document.querySelector('.head-right .lang-sw') || document.getElementById('themeToggle');
    const mk = (cls, html, label, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'ax-hb ' + cls; b.innerHTML = html; b.setAttribute('aria-label', label); b.title = label; b.addEventListener('click', fn); b.setAttribute('data-no-i18n', ''); return b; };
    const nb = mk('ax-nbb', I.book, t('Revision notebook'), () => openNotebook());
    slot.insertBefore(nb, before && before.parentNode === slot ? before : null);
    if (AI_ON) {
      const mac = /Mac|iPhone|iPad/.test(navigator.platform || '');
      const ai = mk('ax-ai', `${I.spark}<span class="ax-lbl">${esc(t('Ask AI'))}</span><span class="ax-kbd">${mac ? '⌘' : 'Ctrl'} K</span>`, t('Ask AI'), () => openPanel());
      slot.insertBefore(ai, nb);
    }
  }
  addEventListener('keydown', e => {
    if (e.key === 'Escape') { if (panel.classList.contains('open')) { e.stopImmediatePropagation(); closePanel(); } else if (nbWrap.classList.contains('open') && !NV.edit) { e.stopImmediatePropagation(); closeNotebook(); } return; }
    if (AI_ON && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); panel.classList.contains('open') ? closePanel() : openPanel(); }
  }, true);

  /* ---------- "Research with AI" on questions ---------- */
  const qBtn = (kind) => `<button class="ax-q" type="button" data-axq="${kind}" data-no-i18n>${I.spark}${esc(t('Research with AI'))}</button>`;
  function ctxFromPractice(card) {
    const id = card.dataset.id;
    let q = null; try { q = typeof BYID !== 'undefined' ? BYID[id] : null; } catch (e) {}   // practice.html's question index
    if (!q || !q.o) return null;
    const csat = /^csat-/.test(id);
    return { kind: csat ? 'csat' : 'prelims', id, label: `${csat ? 'CSAT' : 'Prelims'} ${q.y} · Q${q.n}`, year: q.y, subject: q.s, topic: q.t,
      text: q.q, passage: q.p ? String(q.p).slice(0, 3000) : '', options: q.o, answer: q.a, url: `practice.html${csat ? '#paper=csat' : ''}` };
  }
  function ctxFromSearch(art) {
    const meta = (art.querySelector('.yq') || {}).textContent || '', m = meta.match(/(\d{4})\D+(\d+)/);
    const opts = [...art.querySelectorAll('.sr-o span')].map(x => x.textContent);
    const ok = art.querySelector('.sr-o.ok b'), tags = [...art.querySelectorAll('.sr-meta .tg:not(.hi-soon)')].map(x => x.textContent);
    let csat = false; try { csat = typeof current !== 'undefined' && current === 'csat'; } catch (e) {}   // prelims.html's selected paper
    const ps = art.querySelector('.sr-psg div');
    return { kind: csat ? 'csat' : 'prelims', id: `${csat ? 'csat-' : ''}${m ? m[1] + '-' + m[2] : meta}`, label: `${csat ? 'CSAT' : 'Prelims'} ${meta.trim()}`, year: m ? +m[1] : null,
      subject: tags[0] || '', topic: tags.slice(1).join(', '), text: (art.querySelector('.sr-q') || {}).textContent || '', passage: ps ? ps.textContent.slice(0, 3000) : '',
      options: opts, answer: ok ? ok.textContent.replace(/[()]/g, '') : (art.querySelector('.sr-ans .drop') ? 'x' : ''), url: 'prelims.html' };
  }
  function ctxFromMains() {
    let x = null;
    try { const det = document.querySelector('#svDetail .sv-kick'); if (typeof BYID === 'undefined' || !det) return null;
      const cur = document.querySelector('#svList .sv-item.cur'); const ids = typeof V !== 'undefined' ? V.ids : null;
      x = typeof extra !== 'undefined' && extra ? BYID[extra] : (ids && cur ? BYID[ids[+cur.dataset.i]] : null); } catch (e) {}
    if (!x || !x.k) return null;
    const roman = (window.PYQ && window.PYQ[x.k] && window.PYQ[x.k].roman) || x.k.replace('gs', '');
    return { kind: 'mains', id: x.id, label: `Mains GS ${roman} ${x.y} · Q${x.n}`, year: x.y, subject: `Mains GS ${roman}`, topic: x.t, text: x.q, marks: x.m, url: 'mains.html' };
  }
  function decorate() {
    if (!AI_ON) return;
    document.querySelectorAll('#fx .qc .qright').forEach(r => { if (r.querySelector('.verdict') && !r.querySelector('.ax-q')) r.insertAdjacentHTML('beforeend', qBtn('practice')); });
    document.querySelectorAll('article.sr .sr-meta').forEach(m => { if (!m.querySelector('.ax-q')) m.insertAdjacentHTML('beforeend', qBtn('search')); });
    const acts = document.querySelector('#svDetail .sv-acts');
    if (acts && !acts.querySelector('.ax-q')) acts.insertAdjacentHTML('beforeend', qBtn('mains'));
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-axq]'); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    const k = b.dataset.axq;
    const ctx = k === 'practice' ? ctxFromPractice(b.closest('.qc')) : k === 'search' ? ctxFromSearch(b.closest('article.sr')) : ctxFromMains();
    openPanel({ ctx });
  }, true);
  let dq = null;
  new MutationObserver(() => { if (!dq) dq = requestAnimationFrame(() => { dq = null; decorate(); }); }).observe(document.body, { childList: true, subtree: true });

  /* ---------- start ---------- */
  function start() {
    addHeader(); decorate();
    const root = document.getElementById('nbRoot');
    if (root) { nbPage = true; nbWrap.classList.add('nb-page'); root.appendChild(nbWrap); renderNotebook(); }
    if (/[#&]ask(=|$)/.test(location.hash) && AI_ON) { const m = location.hash.match(/ask=([^&]*)/); openPanel(m ? { query: decodeURIComponent(m[1]) } : {}); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  // i18n.js adds its EN/हिंदी switch on DOMContentLoaded; keep our buttons before it
  window.PK_ASTRA = { open: openPanel, notebook: openNotebook, md };
})();
