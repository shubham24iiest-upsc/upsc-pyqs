"""Build prelims-csat.js from the per-year CSAT transcriptions in tools/csat/yYYYY.py.

Each year file defines:
  G    {group id: passage or directions text}
  Q    [(qno, group id or None, question, [a, b, c, d]), ...]
  KEY  80-letter official answer key (series A), 'X' for a dropped question
  TAGS {qno: (subject, topic)}
Optional: KEY_NAME ("Official answer key" / "Provisional answer key"), SERIES.
Run:  python3 tools/build_csat.py
Topics must not contain ", " (the site splits multi-topic tags on it).
"""
import json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SUBJECTS = ["Reading Comprehension", "Quantitative Aptitude", "Logical Reasoning",
            "Data Interpretation", "Decision Making", "Interpersonal and Communication Skills"]

def load(path):
    ns = {}
    exec(path.read_text(encoding="utf-8"), ns)
    return ns

years, passages, qs, topics = {}, {}, [], {s: set() for s in SUBJECTS}
for f in sorted((ROOT / "tools" / "csat").glob("y*.py")):
    y = int(re.search(r"\d{4}", f.name).group())
    d = load(f)
    key, tags = d["KEY"].lower(), d["TAGS"]
    assert len(d["Q"]) == len(key), f"{f.name}: {len(d['Q'])} questions, key has {len(key)}"
    years[str(y)] = {"key": d.get("KEY_NAME", "Official answer key"), "series": d.get("SERIES", "A")}
    used = set()
    for n, g, q, o in d["Q"]:
        s, t = tags[n]
        assert s in SUBJECTS, (y, n, s)
        assert ", " not in t, (y, n, t)
        assert len(o) == 4, (y, n)
        topics[s].add(t)
        pid = f"{y}-{g}" if g else ""
        if g: used.add(g)
        qs.append([y, n, s, t, q, o, key[n - 1], pid])
    for g in used:
        passages[f"{y}-{g}"] = d["G"][g]

qs.sort(key=lambda r: (-r[0], r[1]))
subjects = [s for s in SUBJECTS if topics[s]]
data = {"subjects": subjects, "topics": {s: sorted(topics[s]) for s in subjects},
        "years": dict(sorted(years.items(), reverse=True)), "passages": passages, "qs": qs}
out = ("// Prelims CSAT (GS Paper II) questions and official answers, built by tools/build_csat.py.\n"
       "// Row: [year, qno, subject, topic, question, options[a,b,c,d], answer letter (x = dropped by UPSC), passage id]\n"
       "window.CSAT_SEARCH=" + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n")
(ROOT / "prelims-csat.js").write_text(out, encoding="utf-8")
print(f"prelims-csat.js: {len(qs)} questions, {len(years)} years, {len(passages)} passages")

# Section counts per year for the "What this paper asked" card on prelims.html
counts = {}
for r in qs:
    c = counts.setdefault(str(r[0]), {})
    c[r[2]] = c.get(r[2], 0) + 1
page = ROOT / "prelims.html"
html = page.read_text(encoding="utf-8")
html, n = re.subn(r"const CSAT_SUBJ = \{.*?\};",
                  lambda m: "const CSAT_SUBJ = " + json.dumps(counts, ensure_ascii=False) + ";", html, count=1)
assert n == 1, "CSAT_SUBJ line not found in prelims.html"
page.write_text(html, encoding="utf-8")
