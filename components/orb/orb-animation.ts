import type { Emotion, RelayState } from "@/types/conversation";

export interface OrbColors {
  inner: string;
  outer: string;
  glow: string;
}

const PALETTE: Record<Emotion, OrbColors> = {
  calm: { inner: "#fff8e7", outer: "#ffb703", glow: "rgba(255,183,3,0.55)" },
  warm: { inner: "#fff0e0", outer: "#ff8fa3", glow: "rgba(255,143,163,0.55)" },
  concerned: { inner: "#eef4ff", outer: "#5b8def", glow: "rgba(91,141,239,0.55)" },
  listening: { inner: "#f3fff0", outer: "#7bd389", glow: "rgba(123,211,137,0.5)" },
};

export function colorsForEmotion(emotion: Emotion): OrbColors {
  return PALETTE[emotion] ?? PALETTE.calm;
}

// Baseline radius fraction (of canvas min dimension) plus how much the
// audio level and speaking/listening state should push it outward.
export function radiusFraction(state: RelayState, audioLevel: number): number {
  const base = 0.28;
  const activity = Math.min(audioLevel, 1) * 0.12;
  const stateBoost = state === "speaking" || state === "listening" ? 0.03 : 0;
  return base + activity + stateBoost;
}
