// What the AI is told. astra.js keeps a copy of SYSTEM and buildUser() for the in-browser demo only;
// change both together.

export const SYSTEM = `You are Astra, the study assistant of PYQ Astra, a free UPSC Civil Services exam practice site. You help aspirants research questions and topics and build revision notes.
Rules:
- Be accurate and exam-focused. If you are not sure of a fact, date, article number or figure, say so instead of guessing. Never invent sources.
- When an official UPSC answer is given, treat it as correct and explain it; if it looks disputed, say so politely.
- Format in Markdown: short "## " headings, bullet points, **bold** key terms, a table only when comparing things. No preamble.
- Keep it to about 350 words unless the student asks for more.
- Finish with "## Quick revision": 3 to 5 one-line bullets worth memorising.
- Stay on UPSC-relevant study topics. Politely decline anything else.`;

// One-tap requests offered on a question. The browser sends the preset name; the text comes from here.
export const PRESETS = {
  explain: 'Explain this question: why the official answer is correct, and why each of the other options or statements is right or wrong.',
  concepts: 'Teach me the core concept behind this question and the related facts UPSC could ask next.',
  mains: 'How could this topic be asked in Mains? Give the key points, examples and a short answer structure.',
  outline: 'Give me a model answer outline for this Mains question: introduction, body points with examples and data, way forward and conclusion, within the word limit.',
  keywords: 'List the keywords, constitutional or legal provisions, committees, reports, data points and examples I should use in this answer.',
};

export function buildUser(query, ctx, lang) {
  let s = '';
  if (ctx) {
    const paper = ctx.kind === 'mains' ? 'Mains' : ctx.kind === 'csat' ? 'Prelims CSAT' : 'Prelims GS';
    s += `Question from UPSC ${paper}${ctx.year ? ' ' + ctx.year : ''}${ctx.subject ? ', ' + ctx.subject : ''}${ctx.topic ? ' / ' + ctx.topic : ''}:\n`;
    if (ctx.passage) s += `Passage: ${ctx.passage}\n`;
    s += `${ctx.text}\n`;
    if (ctx.options && ctx.options.length) s += ctx.options.map((o, i) => `(${'abcd'[i]}) ${o}`).join('\n') + '\n';
    if (ctx.answer) s += ctx.answer === 'x' ? 'UPSC dropped this question.\n' : `Official answer: (${ctx.answer})\n`;
    if (ctx.marks) s += `Marks: ${ctx.marks}\n`;
    s += '\n';
  }
  s += `Student's request: ${query}\n`;
  if (lang === 'hi') s += '\nWrite the whole answer in Hindi (Devanagari script), keeping standard English terms in brackets where useful.';
  return s;
}
