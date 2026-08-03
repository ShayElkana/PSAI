import { describe, expect, it, beforeEach } from "vitest";
import { summarizeSession } from "./summarizer";
import { getProfile, saveTurn, startSession } from "./store";

describe("summarizeSession", () => {
  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  it("is a no-op with no turns", async () => {
    const sessionId = startSession();
    const before = getProfile();
    await summarizeSession(sessionId);
    expect(getProfile()).toEqual(before);
  });

  it("leaves the profile untouched when no API key is configured", async () => {
    const sessionId = startSession();
    saveTurn(sessionId, "user", "I had a rough day today.");
    saveTurn(sessionId, "model", "I'm sorry to hear that. What happened?");
    const before = getProfile();
    await summarizeSession(sessionId);
    expect(getProfile()).toEqual(before);
  });
});
