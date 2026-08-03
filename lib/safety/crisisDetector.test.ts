import { describe, expect, it } from "vitest";
import { scanForCrisisLanguage } from "./crisisDetector";

describe("scanForCrisisLanguage", () => {
  it("flags direct self-harm language", () => {
    expect(scanForCrisisLanguage("I want to kill myself").flagged).toBe(true);
    expect(scanForCrisisLanguage("I've been thinking about suicide").flagged).toBe(true);
    expect(scanForCrisisLanguage("I've been hurting myself").flagged).toBe(true);
    expect(scanForCrisisLanguage("everyone would be better off without me").flagged).toBe(true);
  });

  it("does not flag ordinary venting", () => {
    expect(scanForCrisisLanguage("work is killing me this week").flagged).toBe(false);
    expect(scanForCrisisLanguage("I'm just really tired today").flagged).toBe(false);
    expect(scanForCrisisLanguage("that movie was to die for").flagged).toBe(false);
  });

  it("returns the matched phrase when flagged", () => {
    const result = scanForCrisisLanguage("sometimes I want to die");
    expect(result.flagged).toBe(true);
    expect(result.matched).toBeTruthy();
  });
});
