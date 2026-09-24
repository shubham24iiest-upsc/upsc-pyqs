// General Studies IV
// Add one entry per year inside `data`, same shape as data/gs1.js:
//   2025: { fmt: "150 words (Q1–10, 10 marks) · 250 words (Q11–20, 15 marks)", questions: [
//     {n:1, t:"<one of the topics below, spelled exactly>", q:"Question text", m:"10"},
//   ]},
// The tab switches on automatically once at least one year is present.
window.PYQ = window.PYQ || {};
window.PYQ.gs4 = {
  code: "GS4",
  name: "General Studies IV",
  pdfPrefix: "GS4",   // PDFs live at papers/GS4-YEAR.pdf (case-sensitive)
  roman: "IV",
  blurb: "Theory questions are grouped by syllabus area, and Section B case studies sit in their own block since they read differently.",
  topics: [
    "Ethics & Human Interface",
    "Attitude",
    "Aptitude & Foundational Values",
    "Emotional Intelligence",
    "Moral Thinkers & Philosophers",
    "Public Service Values & Ethics in Administration",
    "Probity in Governance",
    "Case Studies"
  ],
  data: {
  }
};
