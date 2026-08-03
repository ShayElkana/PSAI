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
