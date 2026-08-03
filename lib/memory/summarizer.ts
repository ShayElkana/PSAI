import { GoogleGenAI } from "@google/genai";
import { getProfile, getSessionTurns, setProfile } from "./store";

const SUMMARY_MODEL = process.env.GEMINI_SUMMARY_MODEL || "gemini-2.5-flash";

const SUMMARY_INSTRUCTIONS = `You maintain a private long-term memory profile for one person, written for
PSAI (their AI companion) to read before future conversations. Update the
profile below given the new conversation turns.

Keep it compact (under 300 words): recurring emotional themes, ongoing
struggles, what has helped, preferences in how they like to be supported,
and anything they've asked PSAI to remember. Do not include one-off small
talk. Write in third person, plain prose, no headers.`;

export async function summarizeSession(sessionId: number): Promise<void> {
  const turns = getSessionTurns(sessionId);
  if (turns.length === 0) return;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return;

  const existing = getProfile();
  const transcript = turns
    .map((t) => `${t.role === "user" ? "Person" : "PSAI"}: ${t.text}`)
    .join("\n");

  const prompt = `${SUMMARY_INSTRUCTIONS}

Current profile:
${existing.summary || "(none yet)"}

New conversation turns:
${transcript}

Updated profile:`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: SUMMARY_MODEL,
      contents: prompt,
    });
    const updated = response.text?.trim();
    if (updated) setProfile(updated);
  } catch (err) {
    console.error("[summarizer] failed to update long-term profile", err);
  }
}
