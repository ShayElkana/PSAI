"use client";

import { useEffect, useRef } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  translatedText?: string;
}

interface ChatPanelProps {
  messages: ChatMessage[];
}

export function ChatPanel({ messages }: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        overflowY: "auto",
        maxHeight: "40vh",
        width: "100%",
        maxWidth: 480,
        padding: "0.5rem",
      }}
    >
      {messages.map((m) => (
        <div
          key={m.id}
          style={{
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            background: m.role === "user" ? "#e8f0ff" : "#f5f5f5",
            borderRadius: 12,
            padding: "0.5rem 0.75rem",
            maxWidth: "85%",
            fontSize: "0.9rem",
            color: "#222",
          }}
        >
          {m.text}
          {m.translatedText && m.translatedText !== m.text && (
            <div style={{ marginTop: "0.25rem", fontSize: "0.78rem", opacity: 0.65, fontStyle: "italic" }}>
              {m.translatedText}
            </div>
          )}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
