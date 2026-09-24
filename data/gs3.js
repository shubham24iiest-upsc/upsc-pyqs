// General Studies III
// Add one entry per year inside `data`, same shape as data/gs1.js:
//   2025: { fmt: "150 words (Q1–10, 10 marks) · 250 words (Q11–20, 15 marks)", questions: [
//     {n:1, t:"<one of the topics below, spelled exactly>", q:"Question text", m:"10"},
//   ]},
// The tab switches on automatically once at least one year is present.
window.PYQ = window.PYQ || {};
window.PYQ.gs3 = {
  code: "GS3",
  name: "General Studies III",
  pdfPrefix: "GS3",   // PDFs live at papers/GS3-YEAR.pdf (case-sensitive)
  roman: "III",
  blurb: "Economy, Agriculture, Science & Tech, Environment and Security are pulled apart so you can drill straight into what you're revising.",
  topics: [
    "Indian Economy & Planning",
    "Inclusive Growth, Budgeting & Investment",
    "Agriculture & Food Processing",
    "Infrastructure & Energy",
    "Science & Technology",
    "Environment & Ecology",
    "Disaster Management",
    "Internal Security"
  ],
  data: {
  }
};
