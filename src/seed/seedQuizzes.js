require('dotenv').config();
const mongoose = require('mongoose');
const { GoogleGenAI } = require('@google/genai');

const Course = require('../models/Course');
const Quiz = require('../models/Quiz');

const TARGET_PER_COURSE = 20;
const BATCH_SIZE = 7; // Gemini is more reliable in smaller batches
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

if (!apiKey) {
  console.warn('[seedQuizzes] GEMINI_API_KEY not set — using MOCK fallback questions.');
}

/* ---------- helpers ---------- */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function generateRaw(prompt) {
  if (!ai) return null;
  try {
    const result = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });
    return (
      (typeof result.text === 'string' ? result.text : result?.response?.text?.()) || ''
    );
  } catch (err) {
    console.error('  [gemini error]', err.message);
    return null;
  }
}

function parseQuestions(raw) {
  if (!raw) return [];
  try {
    const cleaned = String(raw).replace(/```json|```/g, '').trim();
    const match = cleaned.match(/\[[\s\S]*\]/);
    const arr = JSON.parse(match ? match[0] : cleaned);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((q) => q && q.question && Array.isArray(q.options) && q.options.length >= 4)
      .map((q) => ({
        question: String(q.question).trim(),
        options: q.options.slice(0, 4).map((o) => String(o).trim()),
        correctIndex: Math.max(0, Math.min(3, Number(q.correctIndex) || 0)),
        explanation: String(q.explanation || '').trim(),
        difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
      }));
  } catch {
    return [];
  }
}

function buildPrompt(course, count, alreadyAskedSample) {
  const topics = (course.topics || []).join(', ') || course.category || 'general';
  const wyl = (course.whatYouWillLearn || []).slice(0, 6).join('; ') || 'core concepts';
  const avoid =
    alreadyAskedSample.length > 0
      ? `\nAVOID repeating or paraphrasing these existing questions:\n- ${alreadyAskedSample
          .slice(-15)
          .join('\n- ')}`
      : '';

  return `Generate exactly ${count} multiple-choice quiz questions about the course "${course.title}".

Course context:
- Category: ${course.category}
- Level: ${course.level}
- Topics: ${topics}
- Description: ${(course.description || '').slice(0, 600)}
- What students will learn: ${wyl}

Requirements:
- Questions MUST be tightly tied to this specific course's subject matter.
- Mix difficulty: roughly 40% easy, 40% medium, 20% hard. Set "difficulty" to "easy", "medium", or "hard".
- Exactly 4 options per question.
- correctIndex is the 0-based index of the correct option.
- Distractors must be plausible and same-length-ish as the correct answer.
- Explanations under 25 words.
- Return ONLY a valid JSON array — no prose, no markdown fences.

Shape:
[
  {"question":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"...","difficulty":"easy"}
]${avoid}`;
}

/** Mock generator used when there is no API key — still course-context-aware */
function mockQuestions(course, count) {
  const topics = (course.topics || []).filter(Boolean);
  const out = [];
  for (let i = 0; i < count; i++) {
    const t = topics[i % Math.max(topics.length, 1)] || course.category || 'this topic';
    out.push({
      question: `In "${course.title}", which best describes a key idea about ${t}? (#${i + 1})`,
      options: [
        `A surface-level definition of ${t}`,
        `A practical, applied understanding of ${t}`,
        `An unrelated concept`,
        `An outdated approach to ${t}`,
      ],
      correctIndex: 1,
      explanation: `Applied understanding of ${t} is what this course emphasizes.`,
      difficulty: i % 5 === 0 ? 'hard' : i % 2 === 0 ? 'easy' : 'medium',
    });
  }
  return out;
}

/* ---------- main ---------- */
(async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error('✗ No MONGO_URI in environment.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('✓ Connected to MongoDB');

  const courses = await Course.find({}).lean();
  console.log(`Found ${courses.length} courses.\n`);

  let totalInserted = 0;

  for (const course of courses) {
    const existingCount = await Quiz.countDocuments({ course: course._id });
    const needed = TARGET_PER_COURSE - existingCount;

    if (needed <= 0) {
      console.log(`• ${course.title} — already has ${existingCount}/${TARGET_PER_COURSE}, skipping.`);
      continue;
    }

    console.log(
      `• ${course.title} (${course.category}) — has ${existingCount}, generating ${needed}…`
    );

    // pull a sample of existing questions so AI doesn't repeat them
    const existingDocs = await Quiz.find({ course: course._id })
      .select('question')
      .lean();
    const askedSample = existingDocs.map((d) => d.question);

    const newQuestions = [];
    let remaining = needed;
    let attempts = 0;
    const MAX_ATTEMPTS = 6;

    while (remaining > 0 && attempts < MAX_ATTEMPTS) {
      attempts++;
      const batchN = Math.min(BATCH_SIZE, remaining);
      const prompt = buildPrompt(course, batchN, [...askedSample, ...newQuestions.map((q) => q.question)]);

      let parsed = [];
      if (ai) {
        const raw = await generateRaw(prompt);
        parsed = parseQuestions(raw);
        // small backoff to avoid rate-limits
        await sleep(800);
      }

      // Fallback if AI failed or no key
      if (parsed.length === 0) {
        parsed = mockQuestions(course, batchN);
      }

      // de-duplicate against what we already have
      for (const q of parsed) {
        if (remaining <= 0) break;
        const dup = [...askedSample, ...newQuestions.map((x) => x.question)].some(
          (existing) => existing.toLowerCase().trim() === q.question.toLowerCase().trim()
        );
        if (!dup) {
          newQuestions.push(q);
          remaining--;
        }
      }
    }

    if (newQuestions.length === 0) {
      console.log(`  ! Could not generate any questions for ${course.title}. Skipping.`);
      continue;
    }

    const docs = newQuestions.map((q) => ({ ...q, course: course._id }));
    await Quiz.insertMany(docs, { ordered: false });
    totalInserted += docs.length;
    console.log(`  ✓ Inserted ${docs.length} new questions.\n`);
  }

  console.log(`\n🎉 Done. Inserted ${totalInserted} new quiz question(s) across ${courses.length} courses.`);
  await mongoose.disconnect();
  process.exit(0);
})().catch(async (err) => {
  console.error('✗ Fatal error:', err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});