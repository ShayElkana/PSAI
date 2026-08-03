// Backup/logging layer only — the live system prompt is the primary safety
// mechanism (Gemini is instructed to handle crisis language on every turn
// regardless of whether this heuristic fires). This exists to (a) reinforce
// the system prompt with an explicit nudge when trigger language appears,
// and (b) keep a local audit log the person can review later.

const TRIGGER_PATTERNS: RegExp[] = [
  /\bkill (myself|me)\b/i,
  /\bsuicid(e|al)\b/i,
  /\bend (my|it all)\b/i,
  /\bwant to die\b/i,
  /\bno reason to live\b/i,
  /\bhurt(ing)? myself\b/i,
  /\bself[- ]harm\b/i,
  /\bcan'?t (go on|do this anymore)\b/i,
  /\bbetter off (dead|without me)\b/i,

  // Child-specific: abuse, grooming, and severe distress. Ordinary
  // bullying/sadness talk is handled by the persona's own warmth and the
  // "encourage support" guidance, not this hard trigger — this list is
  // for the more acute/unsafe end, favoring false positives over missed
  // disclosures since it's a backup/logging layer, not the only response.
  /\b(hit|hits|hitting|hurt|hurts|hurting) me\b/i,
  /\btouch(ed|ing|es)? me\b/i,
  /\bdon'?t tell (mom|dad|my (mom|dad|parents)|anyone)\b/i,
  /\b(keep|keeping) (it |this )?a secret\b/i,
  /\bscared of (him|her|them)\b/i,
  /\bafraid to go (home|school)\b/i,
  /\brun away from home\b/i,
];

export interface CrisisScanResult {
  flagged: boolean;
  matched?: string;
}

export function scanForCrisisLanguage(text: string): CrisisScanResult {
  for (const pattern of TRIGGER_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return { flagged: true, matched: match[0] };
    }
  }
  return { flagged: false };
}
