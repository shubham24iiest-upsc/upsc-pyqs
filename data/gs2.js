// General Studies II
// Add one entry per year inside `data`, same shape as data/gs1.js:
//   2025: { fmt: "150 words (Q1–10, 10 marks) · 250 words (Q11–20, 15 marks)", questions: [
//     {n:1, t:"<one of the topics below, spelled exactly>", q:"Question text", m:"10"},
//   ]},
// The tab switches on automatically once at least one year is present.
window.PYQ = window.PYQ || {};
window.PYQ.gs2 = {
  code: "GS2",
  name: "General Studies II",
  pdfPrefix: "GS2",   // PDFs live at papers/GS2-YEAR.pdf (case-sensitive)
  roman: "II",
  blurb: "Polity, Governance, Social Justice and International Relations are pulled apart so you can drill straight into what you're revising.",
  topics: [
    "Constitution & Polity",
    "Parliament, Executive & Judiciary",
    "Federalism & Local Governance",
    "Constitutional & Statutory Bodies",
    "Governance, Transparency & Accountability",
    "Social Justice & Welfare",
    "Health, Education & Human Resources",
    "India & Its Neighbourhood",
    "Bilateral, Regional & Global Groupings",
    "International Institutions & Diaspora"
  ],
  data: {
  }
};
