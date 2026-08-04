"use client";

import type { RelayState } from "@/types/conversation";

interface VoiceControlsProps {
  state: RelayState;
  micEnabled: boolean;
  micAvailable: boolean;
  onToggleMic: () => void;
  textInput: string;
  onTextInputChange: (value: string) => void;
  onSendText: () => void;
}

const STATE_LABEL: Record<RelayState, string> = {
  connecting: "Getting ready…",
  listening: "I'm listening",
  speaking: "PSAI is talking",
  reconnecting: "One sec, coming right back…",
  error: "Oops, something went wrong",
};

export function VoiceControls({
  state,
  micEnabled,
  micAvailable,
  onToggleMic,
  textInput,
  onTextInputChange,
  onSendText,
}: VoiceControlsProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
      <p style={{ fontSize: "1rem", fontWeight: 600, opacity: 0.85 }}>{STATE_LABEL[state]}</p>

      {micAvailable && (
        <button
          onClick={onToggleMic}
          className={`psai-chunky-btn${micEnabled ? " psai-talk-pulse" : ""}`}
          style={{
            borderRadius: "999px",
            padding: "0.9rem 2.4rem",
            border: "none",
            background: micEnabled
              ? "linear-gradient(135deg, #ff9d6c, #ff7f6b)"
              : "linear-gradient(135deg, #ffe0c2, #ffd1a9)",
            color: "#4a2c1f",
            fontSize: "1.1rem",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: micEnabled
              ? "0 4px 0 #d95f43, 0 8px 18px rgba(0, 0, 0, 0.15)"
              : "0 4px 0 #f0b98a, 0 8px 18px rgba(0, 0, 0, 0.12)",
          }}
        >
          {micEnabled ? "Mute" : "Talk to PSAI"}
        </button>
      )}

      <form
        style={{ display: "flex", gap: "0.6rem", width: "100%", maxWidth: 420 }}
        onSubmit={(e) => {
          e.preventDefault();
          onSendText();
        }}
      >
        <input
          value={textInput}
          onChange={(e) => onTextInputChange(e.target.value)}
          placeholder={micAvailable ? "Or type instead…" : "Type to talk to PSAI…"}
          style={{
            flex: 1,
            padding: "0.75rem 1rem",
            borderRadius: 999,
            border: "2px solid rgba(150, 120, 160, 0.35)",
            background: "rgba(255, 255, 255, 0.55)",
            color: "inherit",
            fontSize: "1rem",
          }}
        />
        <button
          type="submit"
          disabled={!textInput.trim()}
          className="psai-chunky-btn"
          style={{
            padding: "0.75rem 1.4rem",
            borderRadius: 999,
            border: "none",
            background: "#e6d9f7",
            color: "#4a3b52",
            fontSize: "1rem",
            fontWeight: 700,
            cursor: "pointer",
            opacity: textInput.trim() ? 1 : 0.5,
            boxShadow: "0 4px 0 #c9b3e8, 0 6px 14px rgba(0, 0, 0, 0.1)",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
