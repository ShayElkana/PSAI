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
  connecting: "Connecting…",
  listening: "Listening",
  speaking: "Speaking",
  reconnecting: "Reconnecting…",
  error: "Something went wrong",
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
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
      <p style={{ fontSize: "0.85rem", color: "#666" }}>{STATE_LABEL[state]}</p>

      {micAvailable && (
        <button
          onClick={onToggleMic}
          style={{
            borderRadius: "999px",
            padding: "0.6rem 1.4rem",
            border: "none",
            background: micEnabled ? "#ff8fa3" : "#ddd",
            color: micEnabled ? "#fff" : "#333",
            cursor: "pointer",
          }}
        >
          {micEnabled ? "Mute" : "Talk"}
        </button>
      )}

      <form
        style={{ display: "flex", gap: "0.5rem", width: "100%", maxWidth: 420 }}
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
            padding: "0.5rem 0.75rem",
            borderRadius: 8,
            border: "1px solid #ccc",
          }}
        />
        <button
          type="submit"
          disabled={!textInput.trim()}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: 8,
            border: "none",
            background: "#333",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
