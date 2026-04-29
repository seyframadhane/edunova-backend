const Course = require('../models/Course');

/* ============================================================
   Provider configuration
   ============================================================ */
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

console.log(
  '[ai.service] providers →',
  GROQ_API_KEY ? `Groq ✓ (${GROQ_MODEL})` : 'Groq ✗',
  '|',
  GEMINI_API_KEY ? `Gemini ✓ (${GEMINI_MODEL})` : 'Gemini ✗'
);

/* ============================================================
   Low-level provider calls
   ============================================================ */

async function generateWithGroq(prompt, { temperature = 0.7, maxTokens = 4096 } = {}) {
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY not set');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Groq returned empty content');
  return text;
}

async function generateWithGemini(prompt, { temperature = 0.7, maxTokens = 4096 } = {}) {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature, maxOutputTokens: maxTokens },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned empty content');
  return text;
}

/**
 * Try Groq first, then Gemini, then throw.
 * All AI features in this file go through this single function.
 */
async function generate(prompt, opts = {}) {
  if (GROQ_API_KEY) {
    try {
      return await generateWithGroq(prompt, opts);
    } catch (err) {
      console.warn('[ai.service] Groq failed:', err.message);
    }
  }

  if (GEMINI_API_KEY) {
    try {
      return await generateWithGemini(prompt, opts);
    } catch (err) {
      console.warn('[ai.service] Gemini failed:', err.message);
    }
  }

  throw new Error('No AI provider available (set GROQ_API_KEY or GEMINI_API_KEY in .env)');
}

/* ============================================================
   Course context loader
   ============================================================ */

async function getCourseContext(courseId) {
  if (!courseId) return null;
  try {
    const course = await Course.findById(courseId).lean();
    if (!course) return null;
    return {
      title: course.title || 'this course',
      description: course.description || '',
      category: course.category || '',
      level: course.level || 'Beginner',
      topics: Array.isArray(course.topics) ? course.topics : [],
      whatYouWillLearn: Array.isArray(course.whatYouWillLearn) ? course.whatYouWillLearn : [],
    };
  } catch (err) {
    console.warn('[ai.service] getCourseContext failed:', err.message);
    return null;
  }
}

/* ============================================================
   Chat
   ============================================================ */

exports.chat = async ({ courseId, messages = [] }) => {
  const ctx = await getCourseContext(courseId);
  const courseInfo = ctx
    ? `You are a helpful AI tutor for the course "${ctx.title}".
Course level: ${ctx.level}.
Topics covered: ${ctx.topics.join(', ') || 'general'}.
Course description: ${(ctx.description || '').slice(0, 500)}

Answer questions clearly and concisely. Stay focused on the course material when relevant. If a question is off-topic, politely redirect to course content.`
    : 'You are a helpful AI tutor. Answer questions clearly and concisely.';

  const history = messages
    .map((m) => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`)
    .join('\n');

  const prompt = `${courseInfo}\n\nConversation so far:\n${history}\n\nTutor:`;

  try {
    const reply = await generate(prompt, { temperature: 0.7, maxTokens: 1024 });
    return reply.trim();
  } catch (err) {
    console.error('[ai.service.chat] error:', err.message);
    return "I'm having trouble responding right now. Please try again in a moment.";
  }
};

/* ============================================================
   Summarize
   ============================================================ */

exports.summarize = async ({ courseId }) => {
  const ctx = await getCourseContext(courseId);
  if (!ctx) return 'No course found to summarize.';

  const prompt = `Write a concise study summary for the course "${ctx.title}".

Course details:
- Level: ${ctx.level}
- Category: ${ctx.category}
- Topics: ${ctx.topics.join(', ') || 'general'}
- Description: ${(ctx.description || '').slice(0, 600)}
- Learning objectives: ${(ctx.whatYouWillLearn || []).slice(0, 8).join('; ')}

Format the summary as:
1. **Overview** (2-3 sentences)
2. **Key Topics** (5-7 bullet points)
3. **Why It Matters** (2-3 sentences)
4. **Study Tips** (3-4 short bullets)

Use clear Markdown. Keep the whole summary under 350 words.`;

  try {
    const text = await generate(prompt, { temperature: 0.6, maxTokens: 1500 });
    return text.trim();
  } catch (err) {
    console.error('[ai.service.summarize] error:', err.message);
    return `# ${ctx.title}\n\nA ${ctx.level.toLowerCase()} course covering ${ctx.topics.slice(0, 3).join(', ') || 'core concepts'}. ${(ctx.description || '').slice(0, 200)}`;
  }
};

/* ============================================================
   Quiz (real-time AI generation)
   ============================================================ */

function isPlaceholderQuestion(q) {
  if (!q || typeof q.question !== 'string') return true;
  const text = q.question.trim();
  if (text.length < 8) return true;
  if (/^\s*\.{2,}\s*$/.test(text)) return true;
  if (/^(question|q\d|placeholder)/i.test(text)) return true;
  if (!Array.isArray(q.options) || q.options.length !== 4) return true;
  if (q.options.some((o) => typeof o !== 'string' || o.trim().length < 2)) return true;
  if (q.options.every((o) => /^[A-Da-d]$/.test(String(o).trim()))) return true;
  if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex > 3) return true;
  return false;
}

exports.quiz = async ({ courseId, count = 4 }) => {
  const ctx = await getCourseContext(courseId);
  if (!ctx) return [];

  const n = Math.min(Math.max(Number(count) || 4, 1), 20);
  const seed = Math.random().toString(36).slice(2, 8);

  const basePrompt = `You are a professional quiz writer. Generate exactly ${n} multiple-choice questions to test knowledge of "${ctx.title}".

Course details:
- Level: ${ctx.level}
- Category: ${ctx.category}
- Topics: ${ctx.topics.join(', ') || 'general'}
- Description: ${(ctx.description || '').slice(0, 500)}

HARD RULES (responses violating these are REJECTED):
1. Each "question" must be a real, complete sentence ending with "?". Minimum 10 characters.
2. NEVER use placeholder text like "...", "Question 1", "A", "B", "Option 1", or single letters.
3. Each question must have exactly 4 distinct, plausible options. Each option must be at least 3 words long.
4. Exactly one option is correct. "correctIndex" is its 0-based position (0, 1, 2, or 3).
5. Mix difficulty: include easy, medium, and hard questions.
6. Vary the questions on each request — variation seed: ${seed}.
7. Output ONLY a valid JSON array. No markdown fences, no commentary, no text before or after.

REFERENCE EXAMPLE (this is for an UNRELATED topic — do NOT copy these questions, only the structure):
[
  {
    "question": "Which HTTP status code indicates that a requested resource was not found?",
    "options": ["200 OK means success", "301 Moved Permanently", "404 Not Found", "500 Internal Server Error"],
    "correctIndex": 2,
    "explanation": "404 is the standard 'Not Found' status, returned when the server cannot locate the resource.",
    "difficulty": "easy"
  },
  {
    "question": "In SQL, what does an INNER JOIN return between two tables?",
    "options": ["All rows from both tables", "Only rows with matching keys in both tables", "Rows from the left table only", "Rows from the right table only"],
    "correctIndex": 1,
    "explanation": "INNER JOIN returns only rows where the join condition matches in both tables.",
    "difficulty": "medium"
  }
]

Now generate ${n} questions for "${ctx.title}". Return only the JSON array:`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    const prompt =
      attempt === 1
        ? basePrompt
        : `${basePrompt}\n\nIMPORTANT: A previous attempt was rejected for using placeholder text or single-letter options. Write REAL questions about "${ctx.title}" with full sentence options.`;

    try {
      const raw = await generate(prompt, { temperature: 0.8, maxTokens: 4096 });
      const cleaned = String(raw).replace(/```json|```/g, '').trim();
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (!match) {
        console.warn(
          `[ai.service.quiz] attempt ${attempt}: no JSON array found. Raw start: ${cleaned.slice(0, 120)}`
        );
        continue;
      }

      let arr;
      try {
        arr = JSON.parse(match[0]);
      } catch (parseErr) {
        console.warn(`[ai.service.quiz] attempt ${attempt} parse error:`, parseErr.message);
        continue;
      }

      if (!Array.isArray(arr) || arr.length === 0) continue;

      const valid = arr
        .filter((q) => !isPlaceholderQuestion(q))
        .slice(0, n)
        .map((q) => ({
          question: q.question.trim(),
          options: q.options.map((o) => String(o).trim()),
          correctIndex: q.correctIndex,
          explanation: String(q.explanation || '').trim(),
          difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty)
            ? q.difficulty
            : 'medium',
        }));

      if (valid.length > 0) {
        console.log(
          `[ai.service.quiz] ✓ attempt ${attempt}: returning ${valid.length} valid questions for "${ctx.title}"`
        );
        return valid;
      }

      console.warn(
        `[ai.service.quiz] attempt ${attempt}: 0 valid questions after filtering. Raw start: ${cleaned.slice(0, 200)}`
      );
    } catch (err) {
      console.warn(`[ai.service.quiz] attempt ${attempt} error:`, err.message);
    }
  }

  console.warn('[ai.service.quiz] all attempts failed — returning hardcoded fallback');
  return [
    {
      question: `What is the most important first step when studying "${ctx.title}"?`,
      options: [
        'Memorize every detail before practicing',
        'Understand the core concept, then practice it',
        'Skip the lessons and jump to exercises',
        'Only read the FAQ section',
      ],
      correctIndex: 1,
      explanation: 'Grasping the core concept gives the details something to attach to.',
      difficulty: 'easy',
    },
    {
      question: 'Which study habit improves long-term retention the most?',
      options: [
        'Passive re-reading of notes',
        'Spaced retrieval practice',
        'Cramming the night before an exam',
        'Watching videos at 2x speed without notes',
      ],
      correctIndex: 1,
      explanation: 'Spaced retrieval practice consistently outperforms cramming and re-reading.',
      difficulty: 'easy',
    },
  ];
};

/* ============================================================
   Emotion logging (no AI call needed — just persistence stub)
   ============================================================ */

exports.logEmotion = async ({ courseId, userId, emotion, confidence }) => {
  // Optional: store to a collection if you have one.
  // For now, just log so the endpoint stays useful.
  console.log(
    `[ai.service.emotion] user=${userId || '-'} course=${courseId || '-'} emotion=${emotion} conf=${confidence}`
  );
  return { ok: true };
};