import { GoogleGenAI } from "@google/genai";

const TRANSLATE_MODEL = process.env.GEMINI_SUMMARY_MODEL || "gemini-2.5-flash";

// Rather than tracking an explicit "conversation language" setting, we just
// match whatever language PSAI's own reply for this turn came out in —
// that's already whatever the person asked for (e.g. "switch to Hebrew"),
// with no separate language-state to keep in sync.
export async function translateToMatchLanguage(
  text: string,
  referenceText: string
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !text.trim() || !referenceText.trim()) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Detect the language of the REFERENCE text, then translate the SOURCE text into that same language. Reply with only the translation, nothing else — no quotes, no explanation. If SOURCE is already in that language, reply with only SOURCE unchanged.

REFERENCE: ${referenceText}

SOURCE: ${text}`;

    const response = await ai.models.generateContent({ model: TRANSLATE_MODEL, contents: prompt });
    return response.text?.trim() || null;
  } catch (err) {
    console.error("[translate] failed", err);
    return null;
  }
}
