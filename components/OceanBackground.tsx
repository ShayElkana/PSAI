import { Orb } from "@/components/orb/Orb";
import type { Emotion, RelayState } from "@/types/conversation";

// Fixed (not random) so server and client render the same markup — bubbles
// just need to look varied, not actually be randomized per load.
const BUBBLES = [
  { left: "6%", size: 14, duration: 11, delay: 0 },
  { left: "18%", size: 8, duration: 8, delay: 2 },
  { left: "30%", size: 18, duration: 14, delay: 4 },
  { left: "48%", size: 10, duration: 9, delay: 1 },
  { left: "63%", size: 16, duration: 13, delay: 5 },
  { left: "78%", size: 9, duration: 10, delay: 3 },
  { left: "90%", size: 13, duration: 12, delay: 6 },
];

interface OceanBackgroundProps {
  state: RelayState;
  emotion: Emotion;
  audioLevel: number;
}

export function OceanBackground({ state, emotion, audioLevel }: OceanBackgroundProps) {
  return (
    <div className="psai-ocean" aria-hidden="true">
      <svg
        className="psai-mountains"
        viewBox="0 0 1000 220"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="psai-mtn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7ea7c4" />
            <stop offset="100%" stopColor="#4d7396" />
          </linearGradient>
        </defs>
        <path
          d="M0,220 L0,140 L90,70 L160,120 L240,50 L310,110 L390,35 L470,100 L550,25 L630,95 L710,50 L790,105 L870,40 L950,110 L1000,80 L1000,220 Z"
          fill="url(#psai-mtn)"
        />
        <path d="M240,50 L222,84 L258,84 Z" fill="#f4f9fb" />
        <path d="M390,35 L370,72 L410,72 Z" fill="#f4f9fb" />
        <path d="M550,25 L531,64 L569,64 Z" fill="#f4f9fb" />
        <path d="M870,40 L853,76 L887,76 Z" fill="#f4f9fb" />
      </svg>

      {BUBBLES.map((b, i) => (
        <span
          key={i}
          className="psai-bubble"
          style={{
            left: b.left,
            width: b.size,
            height: b.size,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}

      <div className="psai-wave psai-wave-back" />
      <div className="psai-wave psai-wave-front" />

      <svg
        className="psai-rocks"
        viewBox="0 0 1200 220"
        preserveAspectRatio="xMidYMax slice"
      >
        <defs>
          <radialGradient id="psai-rock" cx="35%" cy="28%" r="80%">
            <stop offset="0%" stopColor="#d6d0c6" />
            <stop offset="100%" stopColor="#7d766c" />
          </radialGradient>
        </defs>
        <ellipse cx="90" cy="230" rx="115" ry="60" fill="rgba(20, 60, 70, 0.25)" />
        <ellipse cx="90" cy="215" rx="110" ry="55" fill="url(#psai-rock)" />

        <ellipse cx="330" cy="235" rx="75" ry="42" fill="rgba(20, 60, 70, 0.25)" />
        <ellipse cx="330" cy="222" rx="70" ry="38" fill="url(#psai-rock)" />

        <ellipse cx="610" cy="220" rx="135" ry="68" fill="rgba(20, 60, 70, 0.25)" />
        <ellipse cx="610" cy="205" rx="128" ry="62" fill="url(#psai-rock)" />

        <ellipse cx="880" cy="238" rx="62" ry="36" fill="rgba(20, 60, 70, 0.25)" />
        <ellipse cx="880" cy="225" rx="58" ry="32" fill="url(#psai-rock)" />

        <ellipse cx="1110" cy="228" rx="98" ry="52" fill="rgba(20, 60, 70, 0.25)" />
        <ellipse cx="1110" cy="213" rx="92" ry="48" fill="url(#psai-rock)" />
      </svg>

      {/* The interactive light lives here, among the rocks, rather than as
          a separate floating shape — it should read as light glowing up
          through the water itself. */}
      <Orb state={state} emotion={emotion} audioLevel={audioLevel} />
    </div>
  );
}
