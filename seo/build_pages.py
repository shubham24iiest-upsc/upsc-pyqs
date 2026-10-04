#!/usr/bin/env python3
"""Build crawlable, keyword-targeted PYQ pages for search engines.

The interactive pages (mains.html, prelims.html, practice.html) render every
question with JavaScript, so search engines see almost no question text. This
script reads the same question data and writes plain HTML pages, one per
year, paper, subject and topic, plus a full sitemap.xml.

    python3 seo/build_pages.py        # run from the repo root

Re-run it whenever mains.html or prelims-gs1.js gets new questions. Needs
Python 3 and Node (Node only evaluates the JS data files).
"""
import datetime
import html
import json
import os
import re
import shutil
import subprocess
import textwrap

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://pyqastra.com"
TODAY = datetime.date.today().isoformat()

OUT_DIRS = ["upsc-pyq", "upsc-prelims-pyq", "upsc-mains-pyq"]
STATIC_PAGES = [  # (path, changefreq, priority) for the hand-made pages
    ("/", "weekly", "1.0"),
    ("/practice.html", "weekly", "0.9"),
    ("/prelims.html", "monthly", "0.8"),
    ("/mains.html", "monthly", "0.8"),
    ("/privacy.html", "yearly", "0.2"),
]
ON = ' class="on"'
PAPERS = ["gs1", "gs2", "gs3", "gs4"]
PAPER_SHORT = {"gs1": "GS 1", "gs2": "GS 2", "gs3": "GS 3", "gs4": "GS 4"}
PAPER_SUBJECTS = {
    "gs1": "History, Culture, Society and Geography",
    "gs2": "Polity, Governance, Social Justice and International Relations",
    "gs3": "Economy, Agriculture, Science and Tech, Environment, Security and Disaster Management",
    "gs4": "Ethics, Integrity and Aptitude",
}

EXTRACT_JS = r"""
const fs = require('fs'), vm = require('vm');
const ctx = { window: {} }; vm.createContext(ctx);
const mains = fs.readFileSync('mains.html', 'utf8');
for (const m of mains.matchAll(/<script>([\s\S]*?)<\/script>/g))
  if (/window\.PYQ\.gs\d\s*=/.test(m[1])) vm.runInContext(m[1], ctx);
vm.runInContext(fs.readFileSync('prelims-gs1.js', 'utf8'), ctx);
process.stdout.write(JSON.stringify({ mains: ctx.window.PYQ, prelims: ctx.window.PRE_SEARCH }));
"""


def load_data():
    out = subprocess.run(["node", "-e", EXTRACT_JS], cwd=ROOT, check=True,
                         capture_output=True, text=True).stdout
    return json.loads(out)


def slug(s):
    s = s.lower().replace("&", "and").replace("'", "").replace("\u2019", "")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def esc(s):
    return html.escape(str(s), quote=True)


def para(s):
    return "<br>".join(esc(line) for line in str(s).split("\n"))


def years_label(years):
    return f"{min(years)}–{max(years)}" if len(years) > 1 else str(years[0])


# ---------------------------------------------------------------- page shell

def page(path, title, description, crumbs, body, active=None):
    """path is the URL path ending in '/', crumbs a list of (name, path)."""
    url = SITE + path
    ld = [{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": n, "item": SITE + p}
            for i, (n, p) in enumerate(crumbs)
        ],
    }]
    nav = "".join(
        f'<a href="{href}"{ON if key == active else ""}>{label}</a>'
        for key, href, label in [("mains", "/upsc-mains-pyq/", "Mains"),
                                 ("prelims", "/upsc-prelims-pyq/", "Prelims"),
                                 ("practice", "/practice.html", "Practice")]
    )
    crumb_html = " <span aria-hidden=\"true\">/</span> ".join(
        f'<a href="{p}">{esc(n)}</a>' if i < len(crumbs) - 1 else f"<span>{esc(n)}</span>"
        for i, (n, p) in enumerate(crumbs)
    )
    doc = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(description)}">
<link rel="canonical" href="{url}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#C9432B">
<meta property="og:type" content="website">
<meta property="og:site_name" content="PYQ Astra">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(description)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<script>(function(){{var t;try{{t=localStorage.getItem('pyq-theme')}}catch(e){{}}if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme',t)}})();</script>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Serif:wght@500;600;700&display=swap">
<link rel="stylesheet" href="/seo/pages.css">
<link rel="stylesheet" href="/theme.css">
<script type="application/ld+json">{json.dumps(ld[0], ensure_ascii=False)}</script>
</head>
<body>
<header class="site-head"><div class="wrap head-row">
  <a href="/" class="brand"><span class="brand-dot"></span>PYQ Astra <small>UPSC CSE</small></a>
  <div class="head-right"><nav class="top-nav" aria-label="Sections">{nav}</nav></div>
</div></header>
<main class="wrap">
<nav class="crumbs" aria-label="Breadcrumb">{crumb_html}</nav>
{body}
</main>
<footer class="wrap site-foot">
  <nav aria-label="All PYQs"><a href="/upsc-pyq/">UPSC PYQ</a><a href="/upsc-prelims-pyq/">UPSC Prelims PYQ</a><a href="/upsc-mains-pyq/">UPSC Mains PYQ</a><a href="/practice.html">Practice Prelims</a><a href="/privacy.html">Privacy</a></nav>
  <span>Question papers and answer keys are published by UPSC. PYQ Astra is not affiliated with UPSC.</span>
</footer>
</body>
</html>
"""
    dest = os.path.join(ROOT, path.strip("/"), "index.html")
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with open(dest, "w", encoding="utf-8") as f:
        f.write(doc)
    return path


def link_grid(items):
    """items: list of (href, label, sub)."""
    cells = "".join(
        f'<a class="tile" href="{h}"><b>{esc(l)}</b>{f"<span>{esc(s)}</span>" if s else ""}</a>'
        for h, l, s in items
    )
    return f'<div class="tiles">{cells}</div>'


def cta(text, href, label):
    return f'<p class="cta">{esc(text)} <a href="{href}">{esc(label)}</a></p>'


# ------------------------------------------------------------------- prelims

LETTERS = "abcd"


def prelims_q(row, show_year):
    year, qno, subject, topic, q, opts, ans = row
    tag = f"{year} · Q{qno}" if show_year else f"Q{qno}"
    opts_html = "".join(f"<li><b>({LETTERS[i]})</b> {para(o)}</li>" for i, o in enumerate(opts))
    if ans in LETTERS:
        answer = f"({ans}) {esc(opts[LETTERS.index(ans)])}"
    else:
        answer = "Dropped by UPSC in the final answer key"
    return f"""<article class="q" id="q{year}-{qno}">
<p class="q-meta"><span class="q-no">{tag}</span> <a href="/upsc-prelims-pyq/{slug(subject)}/">{esc(subject)}</a> · {esc(topic)}</p>
<p class="q-text">{para(q)}</p>
<ol class="opts">{opts_html}</ol>
<details><summary>Show answer</summary><p>Answer: {answer}</p></details>
</article>"""


def build_prelims(pre):
    rows = pre["qs"]
    years = sorted({r[0] for r in rows}, reverse=True)
    subjects = sorted({r[2] for r in rows}, key=lambda s: -sum(1 for r in rows if r[2] == s))
    span = years_label(years)
    base = "/upsc-prelims-pyq/"
    hub_crumbs = [("PYQ Astra", "/"), ("UPSC Prelims PYQ", base)]
    paths = []

    for y in years:
        yr = sorted((r for r in rows if r[0] == y), key=lambda r: r[1])
        info = pre["years"].get(str(y), {})
        key_note = info.get("key", "Official answer key")
        pdf = ""
        if os.path.exists(os.path.join(ROOT, f"papers/PRE-GS1-{y}.pdf")):
            pdf = (f' Download the <a href="/papers/PRE-GS1-{y}.pdf">question paper PDF</a>'
                   + (f' and the <a href="/papers/PRE-GS1-{y}-KEY.pdf">answer key PDF</a>.'
                      if os.path.exists(os.path.join(ROOT, f"papers/PRE-GS1-{y}-KEY.pdf")) else "."))
        others = " ".join(f'<a href="{base}{o}/">{o}</a>' for o in years if o != y)
        body = f"""<h1>UPSC Prelims {y} Question Paper (GS Paper 1) with Answer Key</h1>
<p class="lede">All {len(yr)} questions from the UPSC Civil Services Prelims {y} General Studies Paper 1 (Series {esc(info.get("series", "A"))}), each tagged by subject and topic, with the answer from UPSC's {esc(key_note.lower())}.{pdf}</p>
{cta(f"Want to attempt Prelims {y} as a timed test with instant marking?", "/practice.html", "Practice it on PYQ Astra")}
{"".join(prelims_q(r, False) for r in yr)}
<h2>Other years</h2>
<p class="year-links">{others}</p>"""
        paths.append(page(f"{base}{y}/", f"UPSC Prelims {y} Question Paper with Answer Key (GS 1 PYQ) | PYQ Astra",
                          f"UPSC Prelims {y} GS Paper 1: all {len(yr)} previous year questions with options and UPSC's {key_note.lower()}, tagged subject-wise. Free, no login.",
                          hub_crumbs + [(f"Prelims {y}", f"{base}{y}/")], body, "prelims"))

    for s in subjects:
        sr = sorted((r for r in rows if r[2] == s), key=lambda r: (-r[0], r[1]))
        topics = {}
        for r in sr:
            topics[r[3]] = topics.get(r[3], 0) + 1
        topic_line = ", ".join(f"{esc(t)} ({n})" for t, n in sorted(topics.items(), key=lambda x: -x[1])[:12])
        body = f"""<h1>UPSC Prelims PYQ: {esc(s)} ({span})</h1>
<p class="lede">Every {esc(s)} question asked in UPSC Prelims GS Paper 1 from {span}, {len(sr)} in all, newest first, with options and UPSC's answer. Most asked topics: {topic_line}.</p>
{cta("Prefer to test yourself?", "/practice.html", "Practice Prelims PYQs with instant marking")}
{"".join(prelims_q(r, True) for r in sr)}"""
        paths.append(page(f"{base}{slug(s)}/", f"{s} UPSC Prelims PYQ ({span}) Subject-wise with Answers | PYQ Astra",
                          f"{len(sr)} {s} previous year questions from UPSC Prelims {span}, sorted year-wise with options and official answer keys.",
                          hub_crumbs + [(s, f"{base}{slug(s)}/")], body, "prelims"))

    by_year = [(f"{base}{y}/", f"Prelims {y}", f"{sum(1 for r in rows if r[0] == y)} questions") for y in years]
    by_subj = [(f"{base}{slug(s)}/", s, f"{sum(1 for r in rows if r[2] == s)} questions") for s in subjects]
    body = f"""<h1>UPSC Prelims PYQ: Previous Year Question Papers with Answer Keys ({span})</h1>
<p class="lede">All {len(rows)} UPSC Civil Services Prelims GS Paper 1 questions from {span}, readable online with options and UPSC's official answer keys. Browse year-wise or subject-wise, or download the original question paper and answer key PDFs, including CSAT, from the <a href="/prelims.html">papers page</a>.</p>
{cta("Ready to attempt a full paper?", "/practice.html", "Take a Prelims PYQ test with instant marking")}
<h2>UPSC Prelims PYQ year-wise</h2>
{link_grid(by_year)}
<h2>UPSC Prelims PYQ subject-wise</h2>
{link_grid(by_subj)}
<h2>How to use Prelims previous year questions</h2>
<p>UPSC repeats themes far more often than it repeats questions. Solving the last ten years subject-wise shows which parts of the syllabus get asked (Environment, Polity and Economy dominate recent papers), how statement-based questions are framed, and how elimination works on "how many of the above" options. Attempt each year as a timed paper first, then revisit the subjects where you lose marks.</p>"""
    paths.insert(0, page(base, f"UPSC Prelims PYQ {span}: Year-wise & Subject-wise with Answer Keys | PYQ Astra",
                         f"UPSC Prelims previous year questions ({span}) with official answer keys. {len(rows)} GS Paper 1 PYQs, year-wise and subject-wise, plus question paper PDFs. Free.",
                         hub_crumbs, body, "prelims"))
    return paths, by_year, len(rows), span


# --------------------------------------------------------------------- mains

def mains_q(paper, year, q, show_year):
    tag = f"{year} · Q{q['n']}" if show_year else f"Q{q['n']}"
    return f"""<article class="q" id="{paper}-{year}-{esc(q['n'])}">
<p class="q-meta"><span class="q-no">{tag}</span> <a href="/upsc-mains-pyq/{paper}/{slug(q['t'])}/">{esc(q['t'])}</a>{f" · {esc(q['m'])} marks" if q.get('m') else ""}</p>
<p class="q-text">{para(q['q'])}</p>
</article>"""


def mains_pdf(paper, year):
    for name in (f"{paper.upper()}-{year}.pdf", f"{paper}-{year}.pdf"):
        if os.path.exists(os.path.join(ROOT, "papers", name)):
            return f"/papers/{name}"
    return None


def build_mains(mains):
    base = "/upsc-mains-pyq/"
    hub_crumbs = [("PYQ Astra", "/"), ("UPSC Mains PYQ", base)]
    paths, paper_tiles, total = [], [], 0
    all_years = set()

    for k in PAPERS:
        p = mains[k]
        years = sorted((int(y) for y in p["data"] if p["data"][y]["questions"]), reverse=True)
        if not years:
            continue
        all_years.update(years)
        span = years_label(years)
        short = PAPER_SHORT[k]
        pbase = f"{base}{k}/"
        pcrumbs = hub_crumbs + [(f"{short}", pbase)]
        allq = [(y, q) for y in years for q in p["data"][str(y)]["questions"]]
        total += len(allq)
        topics = {}
        for y, q in allq:
            topics.setdefault(q["t"], []).append((y, q))

        for y in years:
            d = p["data"][str(y)]
            pdf = mains_pdf(k, y)
            others = " ".join(f'<a href="{pbase}{o}/">{o}</a>' for o in years if o != y)
            body = f"""<h1>UPSC Mains {y} {short} Question Paper ({esc(p['name'])})</h1>
<p class="lede">All {len(d['questions'])} questions from the UPSC Civil Services Mains {y} {esc(p['name'])} paper, transcribed from the official question paper and tagged by syllabus topic.{f" Format: {esc(d['fmt'])}." if d.get('fmt') else ""}{f' Download the <a href="{pdf}">original question paper PDF</a>.' if pdf else ""}</p>
{cta("Want to write answers to these?", "/mains.html", "Open the Mains answer-writing view")}
{"".join(mains_q(k, y, q, False) for q in d['questions'])}
<h2>{short} other years</h2>
<p class="year-links">{others}</p>"""
            paths.append(page(f"{pbase}{y}/", f"UPSC Mains {y} {short} Question Paper (PYQ) | PYQ Astra",
                              f"UPSC Mains {y} {p['name']} question paper: all {len(d['questions'])} questions with marks and syllabus topic, plus the official PDF.",
                              pcrumbs + [(f"{y}", f"{pbase}{y}/")], body, "mains"))

        for t, qs in topics.items():
            qs.sort(key=lambda x: -x[0])
            body = f"""<h1>UPSC Mains {short} PYQ: {esc(t)} ({span})</h1>
<p class="lede">Every question on {esc(t)} asked in UPSC Mains {esc(p['name'])} from {span}, {len(qs)} in all, newest first.</p>
{"".join(mains_q(k, y, q, True) for y, q in qs)}"""
            paths.append(page(f"{pbase}{slug(t)}/", f"{t}: UPSC Mains {short} PYQ Topic-wise ({span}) | PYQ Astra",
                              f"{len(qs)} UPSC Mains {short} previous year questions on {t} from {span}, year-wise with marks.",
                              pcrumbs + [(t, f"{pbase}{slug(t)}/")], body, "mains"))

        year_tiles = [(f"{pbase}{y}/", f"{short} {y}", f"{len(p['data'][str(y)]['questions'])} questions") for y in years]
        topic_tiles = [(f"{pbase}{slug(t)}/", t, f"{len(qs)} questions")
                       for t, qs in sorted(topics.items(), key=lambda x: -len(x[1]))]
        body = f"""<h1>UPSC Mains {short} PYQ ({span}): Year-wise and Topic-wise</h1>
<p class="lede">All {len(allq)} UPSC Mains {esc(p['name'])} previous year questions from {span}, covering {PAPER_SUBJECTS[k]}. Read them paper by paper or topic by topic.</p>
<h2>{short} PYQ year-wise</h2>
{link_grid(year_tiles)}
<h2>{short} PYQ topic-wise</h2>
{link_grid(topic_tiles)}"""
        paths.append(page(pbase, f"UPSC Mains {short} PYQ ({span}) Year-wise & Topic-wise | PYQ Astra",
                          f"{len(allq)} UPSC Mains {p['name']} previous year questions ({span}) on {PAPER_SUBJECTS[k]}, year-wise and topic-wise with question paper PDFs.",
                          pcrumbs, body, "mains"))
        paper_tiles.append((pbase, f"{short}: {p['name']}", f"{PAPER_SUBJECTS[k]} · {len(allq)} questions"))

    span = years_label(sorted(all_years))
    latest = max(all_years)
    body = f"""<h1>UPSC Mains PYQ: Previous Year Questions GS 1 to GS 4 ({span})</h1>
<p class="lede">{total} UPSC Civil Services Mains General Studies questions from {span}, transcribed from the official papers and sorted by syllabus topic. Pick a paper below to read it year-wise or topic-wise.</p>
{link_grid(paper_tiles)}
<h2>Latest papers ({latest})</h2>
{link_grid([(f"{base}{k}/{latest}/", f"Mains {latest} {PAPER_SHORT[k]}", "") for k in PAPERS if str(latest) in mains[k]["data"]])}
{cta("Practise answer writing with topic filters and a heatmap:", "/mains.html", "open the Mains workspace")}"""
    paths.insert(0, page(base, f"UPSC Mains PYQ {span}: GS 1, 2, 3, 4 Year-wise & Topic-wise | PYQ Astra",
                         f"UPSC Mains previous year questions ({span}) for GS 1, GS 2, GS 3 and GS 4 Ethics: {total} questions, year-wise and topic-wise, with question paper PDFs. Free.",
                         hub_crumbs, body, "mains"))
    return paths, paper_tiles, total, span


# --------------------------------------------------------------------- build

def build_landing(pre_tiles, pre_total, pre_span, mains_tiles, mains_total, mains_span):
    body = f"""<h1>UPSC PYQ: Prelims and Mains Previous Year Questions</h1>
<p class="lede">Every UPSC Civil Services previous year question in one place: {pre_total} Prelims GS Paper 1 questions ({pre_span}) with official answer keys, and {mains_total} Mains GS 1 to GS 4 questions ({mains_span}) sorted by topic. Free to read, no login needed.</p>
<h2><a href="/upsc-prelims-pyq/">UPSC Prelims PYQ</a></h2>
{link_grid(pre_tiles)}
<h2><a href="/upsc-mains-pyq/">UPSC Mains PYQ</a></h2>
{link_grid(mains_tiles)}
<h2>Practice</h2>
{cta("Attempt any Prelims paper as a timed test with instant marking.", "/practice.html", "Start practising")}"""
    return page("/upsc-pyq/", "UPSC PYQ: Prelims & Mains Previous Year Questions with Answers | PYQ Astra",
                f"Free UPSC PYQs: {pre_total} Prelims questions ({pre_span}) with official answer keys and {mains_total} Mains GS 1-4 questions ({mains_span}), year-wise and topic-wise.",
                [("PYQ Astra", "/"), ("UPSC PYQ", "/upsc-pyq/")], body)


def write_sitemap(paths):
    urls = [(p, f, pr) for p, f, pr in STATIC_PAGES]
    for p in paths:
        depth = p.strip("/").count("/")
        urls.append((p, "monthly", "0.9" if depth == 0 else "0.7" if depth == 1 else "0.6"))
    body = "\n".join(
        f"  <url><loc>{SITE}{p}</loc><lastmod>{TODAY}</lastmod><changefreq>{f}</changefreq><priority>{pr}</priority></url>"
        for p, f, pr in urls
    )
    with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n'
                '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
                f"{body}\n</urlset>\n")
    return len(urls)


def main():
    data = load_data()
    for d in OUT_DIRS:  # start clean so renamed topics don't leave orphans
        shutil.rmtree(os.path.join(ROOT, d), ignore_errors=True)
    pre_paths, pre_tiles, pre_total, pre_span = build_prelims(data["prelims"])
    mains_paths, mains_tiles, mains_total, mains_span = build_mains(data["mains"])
    landing = build_landing(pre_tiles, pre_total, pre_span, mains_tiles, mains_total, mains_span)
    paths = [landing] + pre_paths + mains_paths
    n = write_sitemap(paths)
    print(textwrap.dedent(f"""\
        wrote {len(paths)} pages ({len(pre_paths)} prelims, {len(mains_paths)} mains, 1 landing)
        sitemap.xml: {n} URLs"""))


if __name__ == "__main__":
    main()
