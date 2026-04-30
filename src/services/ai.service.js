const Course = require('../models/Course');

/* ============================================================
   Provider configuration
   ============================================================ */
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

console.log(
  '[ai.service] providers →',
  GROQ_API_KEY ? `Groq ✓ (${GROQ_MODEL})` : 'Groq ✗',
  '|',
  GEMINI_API_KEY ? `Gemini ✓ (${GEMINI_MODEL})` : 'Gemini ✗'
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ============================================================
   Low-level provider calls
   ============================================================ */

async function generateWithGroq(prompt, { temperature = 0.7, maxTokens = 2500 } = {}) {
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
    const err = new Error(`Groq ${res.status}: ${errText.slice(0, 300)}`);
    err.status = res.status;
    const m = errText.match(/try again in ([\d.]+)s/i);
    err.retryAfterSec = m
      ? Math.ceil(parseFloat(m[1]))
      : Number(res.headers.get('retry-after')) || null;
    throw err;
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Groq returned empty content');
  return text;
}

async function generateWithGemini(prompt, { temperature = 0.7, maxTokens = 2500 } = {}) {
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
    const err = new Error(`Gemini ${res.status}: ${errText.slice(0, 300)}`);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned empty content');
  return text;
}

async function generate(prompt, opts = {}) {
  if (GROQ_API_KEY) {
    try {
      return await generateWithGroq(prompt, opts);
    } catch (err) {
      if (err.status === 429 && err.retryAfterSec && err.retryAfterSec <= 30) {
        console.warn(`[ai.service] Groq 429, waiting ${err.retryAfterSec}s then retrying once`);
        await sleep((err.retryAfterSec + 1) * 1000);
        try {
          return await generateWithGroq(prompt, opts);
        } catch (err2) {
          console.warn('[ai.service] Groq retry failed:', err2.message);
        }
      } else {
        console.warn('[ai.service] Groq failed:', err.message);
      }
    }
  }

  if (GEMINI_API_KEY) {
    try {
      return await generateWithGemini(prompt, opts);
    } catch (err) {
      console.warn('[ai.service] Gemini failed:', err.message);
    }
  }

  throw new Error('No AI provider available right now (rate limited or no key)');
}

/* ============================================================
   Course context
   ============================================================ */

async function getCourseContext(courseId) {
  if (!courseId) return null;
  try {
    const course = await Course.findById(courseId).lean();
    if (!course) return null;
    return {
      _id: course._id,
      title: course.title || 'this course',
      description: course.description || '',
      category: course.category || '',
      level: course.level || 'Beginner',
      topics: Array.isArray(course.topics) ? course.topics : [],
      whatYouWillLearn: Array.isArray(course.whatYouWillLearn) ? course.whatYouWillLearn : [],
      requirements: Array.isArray(course.requirements) ? course.requirements : [],
      targetAudience: Array.isArray(course.targetAudience) ? course.targetAudience : [],
    };
  } catch (err) {
    console.warn('[ai.service] getCourseContext failed:', err.message);
    return null;
  }
}

/* ============================================================
   Curriculum loader (modules + lessons)
   ============================================================ */

/**
 * Load the full curriculum for a course as:
 * [
 *   { title, description, lessons: [{ title, description, durationSec }, ...] },
 *   ...
 * ]
 *
 * Tries to require the Module and Lesson models. If either is missing or the
 * field shapes differ, falls back gracefully (returns []).
 */
async function getCourseCurriculum(courseId) {
  if (!courseId) return [];

  let Module, Lesson;
  try {
    Module = require('../models/Module');
  } catch (_) { }
  try {
    Lesson = require('../models/Lesson');
  } catch (_) { }

  if (!Module || !Lesson) {
    console.warn('[ai.service] Module or Lesson model not found — skipping curriculum');
    return [];
  }

  try {
    const modules = await Module.find({ course: courseId })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    if (!modules.length) return [];

    const moduleIds = modules.map((m) => m._id);
    const lessons = await Lesson.find({ module: { $in: moduleIds } })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    return modules.map((m) => ({
      title: m.title || m.name || 'Module',
      description: String(m.description || '').slice(0, 120),
      lessons: lessons
        .filter((l) => String(l.module) === String(m._id))
        .map((l) => ({
          title: l.title || l.name || 'Lesson',
          description: String(l.description || l.summary || '').slice(0, 100),
          durationSec: Number(l.durationSec || l.duration || 0),
        })),
    }));
  } catch (err) {
    console.warn('[ai.service] getCourseCurriculum failed:', err.message);
    return [];
  }
}

/**
 * Render a curriculum array as a compact text block for the prompt.
 * Caps modules and lessons to keep token usage predictable.
 */
function formatCurriculumForPrompt(curriculum, { maxModules = 10, maxLessonsPerModule = 8 } = {}) {
  if (!Array.isArray(curriculum) || curriculum.length === 0) return '';

  const trimmed = curriculum.slice(0, maxModules);
  const lines = [];

  trimmed.forEach((mod, mi) => {
    const modTitle = mod.title || `Module ${mi + 1}`;
    const modDesc = mod.description ? ` — ${mod.description}` : '';
    lines.push(`${mi + 1}. ${modTitle}${modDesc}`);

    const lessons = (mod.lessons || []).slice(0, maxLessonsPerModule);
    lessons.forEach((l, li) => {
      const dur = l.durationSec ? ` (${Math.round(l.durationSec / 60)} min)` : '';
      const desc = l.description ? ` — ${l.description}` : '';
      lines.push(`   ${mi + 1}.${li + 1} ${l.title}${dur}${desc}`);
    });

    const extraLessons = (mod.lessons || []).length - lessons.length;
    if (extraLessons > 0) {
      lines.push(`   …and ${extraLessons} more lesson${extraLessons > 1 ? 's' : ''}`);
    }
  });

  const extraModules = curriculum.length - trimmed.length;
  if (extraModules > 0) {
    lines.push(`…and ${extraModules} more module${extraModules > 1 ? 's' : ''}`);
  }

  return lines.join('\n');
}

/* ============================================================
   Chat
   ============================================================ */

exports.chat = async ({ courseId, messages = [] }) => {
  const ctx = await getCourseContext(courseId);
  const courseInfo = ctx
    ? `You are a helpful AI tutor for "${ctx.title}" (${ctx.level}). Topics: ${ctx.topics.join(', ') || 'general'}. Description: ${(ctx.description || '').slice(0, 300)}`
    : 'You are a helpful AI tutor.';

  const history = messages
    .slice(-8)
    .map((m) => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`)
    .join('\n');

  const prompt = `${courseInfo}\n\nKeep replies clear and concise (under 200 words).\n\n${history}\n\nTutor:`;

  try {
    const reply = await generate(prompt, { temperature: 0.7, maxTokens: 800 });
    return reply.trim();
  } catch (err) {
    console.error('[ai.service.chat] error:', err.message);
    return "I'm temporarily rate-limited. Please try again in a minute.";
  }
};

/* ============================================================
   Summarize — clean walkthrough, no numbering
   ============================================================ */

exports.summarize = async ({ courseId }) => {
  const ctx = await getCourseContext(courseId);
  if (!ctx) return 'No course found to summarize.';

  const curriculum = await getCourseCurriculum(courseId);

  const totalModules = curriculum.length;
  const totalLessons = curriculum.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);

  console.log(
    `[ai.service.summarize] "${ctx.title}" — ${totalModules} modules, ${totalLessons} lessons in context`
  );

  // No curriculum → short metadata-only overview
  if (totalModules === 0) {
    const prompt = `Write a short 3-paragraph overview of the course "${ctx.title}" (${ctx.level}).
Topics: ${ctx.topics.join(', ') || 'general'}.
Description: ${(ctx.description || '').slice(0, 400)}
Use plain Markdown. No top-level H1.`;
    try {
      return (await generate(prompt, { temperature: 0.6, maxTokens: 800 })).trim();
    } catch (err) {
      return `**${ctx.title}** — ${ctx.level}. ${(ctx.description || '').slice(0, 300)}`;
    }
  }

  // Build a compact JSON of the curriculum for the model
  const curriculumJson = JSON.stringify(
    curriculum.slice(0, 12).map((m) => ({
      title: m.title,
      description: m.description || '',
      lessons: (m.lessons || []).slice(0, 12).map((l) => ({
        title: l.title,
        description: l.description || '',
        durationSec: l.durationSec || 0,
      })),
    })),
    null,
    0
  );

  const prompt = `You are an expert instructor writing a course walkthrough for "${ctx.title}".

Course context:
- Level: ${ctx.level}
- Category: ${ctx.category || 'general'}
- Topics: ${ctx.topics.join(', ') || 'general'}
- Description: ${(ctx.description || '').slice(0, 400)}

Curriculum (JSON, ${totalModules} modules, ${totalLessons} lessons):
${curriculumJson}

Now write the walkthrough in this EXACT plain-text format. Use these exact tags. Nothing else.

TAGLINE: <one motivating sentence about the whole course, max 18 words>

MODULE: <exact module title without the part thing (eg "part 1: ..." do not do this)>
INTRO: <one sentence summarizing this module, max 20 words>
LESSON: <exact lesson title without the part thing (eg "part 1: ..." do not do this)> | <3-4 sentences explaining what this lesson teaches and why it matters, max 50 words>
LESSON: <exact lesson title without the part thing (eg "part 1: ..." do not do this)> | <explanation>

MODULE: <exact module title  without the part thing (eg "part 1: ..." do not do this)>
INTRO: <one sentence>
LESSON: ...

CONCLUSION: <2 sentences tying the whole course together>

Rules:
- Use the EXACT module and lesson titles from the curriculum above. Do not rename or translate them.
- Include EVERY module and EVERY lesson. Do not skip any.
- Each LESSON line uses the pipe separator | between title, duration, and explanation.
- Do NOT use numbering like "Module 1" or "Lesson 1.1".
- Do NOT add any text outside the tagged lines (no headers, no markdown, no commentary).
- Start your response with "TAGLINE:" on the first line.`;

  try {
    const text = await generate(prompt, { temperature: 0.5, maxTokens: 3500 });
    return text.trim();
  } catch (err) {
    console.error('[ai.service.summarize] error:', err.message);

    // Deterministic fallback (no AI) — same clean format, no numbering
    const lines = [];
    lines.push(`> ✨ A guided walkthrough of **${ctx.title}**.`);
    lines.push('');
    curriculum.forEach((m, mi) => {
      if (mi > 0) {
        lines.push('');
        lines.push('---');
        lines.push('');
      } else {
        lines.push('---');
        lines.push('');
      }
      lines.push(`## 📦 ${m.title}`);
      if (m.description) lines.push(`*${m.description}*`);
      lines.push('');
      (m.lessons || []).forEach((l) => {
        const dur = l.durationSec ? ` *· ${Math.round(l.durationSec / 60)} min*` : '';
        const desc = l.description ? ` — ${l.description}` : '';
        lines.push(`- 🎯 **${l.title}**${dur}${desc}`);
      });
    });
    return lines.join('\n').trim();
  }
};

/* ============================================================
   Quiz — slim prompt, single retry on 429
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

  const prompt = `Generate exactly ${n} multiple-choice quiz questions about "${ctx.title}" (${ctx.level} level).
Topics: ${ctx.topics.slice(0, 5).join(', ') || ctx.category || 'general'}.

Rules:
- Real, complete questions ending with "?". No placeholders, no "...", no single letters as options.
- Each question has exactly 4 distinct options, each at least 3 words.
- "correctIndex" is 0-based (0-3).
- Mix easy/medium/hard difficulty.
- Variation seed: ${seed}.
- Output ONLY a JSON array. No markdown fences, no commentary.

Shape per item:
{"question":"...","options":["...","...","...","..."],"correctIndex":0,"explanation":"...","difficulty":"easy"}

Return the array of ${n} questions now:`;

  try {
    const raw = await generate(prompt, { temperature: 0.8, maxTokens: 2500 });
    const cleaned = String(raw).replace(/```json|```/g, '').trim();
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) {
      let arr;
      try {
        arr = JSON.parse(match[0]);
      } catch (parseErr) {
        console.warn('[ai.service.quiz] parse error:', parseErr.message);
        arr = null;
      }

      if (Array.isArray(arr) && arr.length > 0) {
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
            `[ai.service.quiz] ✓ returning ${valid.length} valid questions for "${ctx.title}"`
          );
          return valid;
        }

        console.warn(
          `[ai.service.quiz] 0 valid after filtering. Raw start: ${cleaned.slice(0, 200)}`
        );
      }
    } else {
      console.warn(`[ai.service.quiz] no JSON array found. Raw start: ${cleaned.slice(0, 150)}`);
    }
  } catch (err) {
    console.warn('[ai.service.quiz] generation failed:', err.message);
  }

  console.warn('[ai.service.quiz] using hardcoded fallback');
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
      explanation: 'Spaced retrieval practice consistently outperforms cramming.',
      difficulty: 'easy',
    },
  ];
};

/* ============================================================
   Emotion logging
   ============================================================ */

exports.logEmotion = async ({ courseId, userId, emotion, confidence }) => {
  console.log(
    `[ai.service.emotion] user=${userId || '-'} course=${courseId || '-'} emotion=${emotion} conf=${confidence}`
  );
  return { ok: true };
};