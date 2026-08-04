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
        gap: "0.6rem",
        overflowY: "auto",
        maxHeight: "42vh",
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
            background: m.role === "user" ? "#ffd1a9" : "#e6d9f7",
            color: m.role === "user" ? "#5c3a21" : "#4a3b52",
            borderRadius: 20,
            padding: "0.7rem 1rem",
            maxWidth: "85%",
            fontSize: "1rem",
            lineHeight: 1.4,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
          }}
        >
          {m.text}
          {m.translatedText && m.translatedText !== m.text && (
            <div style={{ marginTop: "0.3rem", fontSize: "0.82rem", opacity: 0.7, fontStyle: "italic" }}>
              {m.translatedText}
            </div>
          )}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
