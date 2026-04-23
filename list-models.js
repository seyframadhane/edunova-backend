require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

async function main() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const models = await ai.models.list();

  // Depending on SDK version, models might be in models.models or models directly
  console.log("RAW MODELS RESPONSE:\n", JSON.stringify(models, null, 2));
}

main().catch((e) => {
  console.error("ListModels error:", e?.message || e);
  process.exit(1);
});
