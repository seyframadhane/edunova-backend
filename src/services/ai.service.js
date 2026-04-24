// AI service — wraps Google Gemini with graceful fallback to mock responses
// when GEMINI_API_KEY is not configured.

const { GoogleGenAI } = require('@google/genai');
const Course = require('../models/Course');

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

if (!apiKey) {
  console.warn('[ai.service] GEMINI_API_KEY not set — running in MOCK mode.');
}

/** Low-level generate with graceful fallback */
async function generate(prompt, systemInstruction) {
  if (!ai) return mockFallback(prompt, systemInstruction);
  try {
    const result = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: systemInstruction ? { systemInstruction } : undefined,
    });
    return (typeof result.text === 'string' ? result.text : result?.response?.text?.()) || '';
  } catch (err) {
    console.error('[ai.service] Gemini error:', err.message);
    return mockFallback(prompt, systemInstruction);
  }
}

function mockFallback(prompt /*, systemInstruction */) {
  const snippet = String(prompt).slice(-160).replace(/\s+/g, ' ');
  return `(Demo mode) Here's a thoughtful response based on: "${snippet}"...

Focus on the core idea first, then apply it with small practical examples. Spaced practice beats cramming.`;
}

/** Load lightweight course context for prompts */
async function getCourseContext(courseId) {
  const c = await Course.findById(courseId).lean();
  if (!c) return null;
  return {
    title: c.title,
    description: c.description || '',
    level: c.level || 'Beginner',
    topics: Array.isArray(c.topics) ? c.topics : [],
    whatYouWillLearn: Array.isArray(c.whatYouWillLearn) ? c.whatYouWillLearn : [],
  };
}

/* --------------------------- Chat --------------------------- */
exports.chat = async ({ courseId, history = [], message }) => {
  const ctx = await getCourseContext(courseId);
  if (!ctx) return "I couldn't find that course.";

  const system = [
    `You are EduNova's AI tutor helping a student study "${ctx.title}".`,
    `Course level: ${ctx.level}.`,
    ctx.topics.length ? `Topics: ${ctx.topics.join(', ')}.` : '',
    ctx.description ? `Description: ${ctx.description}` : '',
    `Answer clearly, concisely, and with examples. If you don't know, say so honestly.`,
    `Keep responses under 200 words unless the student asks for depth.`,
  ].filter(Boolean).join('\n');

  const convo = history
    .slice(-10)
    .map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`)
    .join('\n');

  const prompt = `${convo ? convo + '\n' : ''}Student: ${message}\nTutor:`;
  const reply = await generate(prompt, system);
  return reply.trim();
};

/* --------------------------- Summary --------------------------- */
exports.summary = async ({ courseId }) => {
  const ctx = await getCourseContext(courseId);
  if (!ctx) return 'Course not found.';

  const prompt = `Write a clear, structured study summary of the course "${ctx.title}".

Course details:
- Level: ${ctx.level}
- Topics: ${ctx.topics.join(', ') || 'n/a'}
- Description: ${ctx.description || 'n/a'}
- What the student will learn: ${ctx.whatYouWillLearn.join('; ') || 'n/a'}

Output format (Markdown):
## Summary — ${ctx.title}

**Main idea.** <1 sentence>

**Key takeaways**
- <3 to 5 short bullets>

**Practice tips**
- <2 to 3 actionable tips>

Keep it under 220 words.`;
  const text = await generate(prompt);
  return text.trim();
};

/* --------------------------- Quiz --------------------------- */
exports.quiz = async ({ courseId, count = 4 }) => {
  const ctx = await getCourseContext(courseId);
  if (!ctx) return [];

  const n = Math.min(Math.max(Number(count) || 4, 1), 10);

  const prompt = `Generate exactly ${n} multiple-choice questions for the course "${ctx.title}".
Level: ${ctx.level}. Topics: ${ctx.topics.join(', ') || 'n/a'}.
Description: ${ctx.description || 'n/a'}

Return ONLY a valid JSON array (no prose, no markdown fences). Shape:
[
  {"question":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"..."}
]

Rules:
- Exactly 4 options per question.
- correctIndex is the 0-based index of the correct option.
- Keep explanations under 25 words.`;

  const raw = await generate(prompt);

  // Robust parsing
  try {
    const cleaned = String(raw).replace(/```json|```/g, '').trim();
    const match = cleaned.match(/\[[\s\S]*\]/);
    const arr = JSON.parse(match ? match[0] : cleaned);
    if (Array.isArray(arr) && arr.every(q => q.question && Array.isArray(q.options))) {
      return arr.map(q => ({
        question: String(q.question),
        options: q.options.slice(0, 4).map(String),
        correctIndex: Math.max(0, Math.min(3, Number(q.correctIndex) || 0)),
        explanation: String(q.explanation || ''),
      }));
    }
  } catch {
    /* fall through */
  }

  // Fallback questions
  return [
    {
      question: `What is the most important first step when studying "${ctx.title}"?`,
      options: ['Memorize every detail', 'Understand the core idea', 'Skip to exercises', 'Read the FAQ'],
      correctIndex: 1,
      explanation: 'Grasping the core idea gives details something to attach to.',
    },
    {
      question: 'Which habit helps retention the most?',
      options: ['Passive re-reading', 'Spaced practice', 'Cramming', 'Watching at 2x speed'],
      correctIndex: 1,
      explanation: 'Spaced practice consistently outperforms cramming.',
    },
  ];
};