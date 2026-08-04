"use client";

import type { Language } from "@/types/conversation";

const OPTIONS: { value: Language; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "he", label: "עברית" },
  { value: "ru", label: "Русский" },
  { value: "ar", label: "العربية" },
];

interface LanguageSelectorProps {
  language: Language;
  onChange: (language: Language) => void;
}

export function LanguageSelector({ language, onChange }: LanguageSelectorProps) {
  return (
    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
      {OPTIONS.map((opt) => {
        const active = language === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              padding: "0.5rem 1.1rem",
              borderRadius: 999,
              border: active ? "2px solid #ff9d6c" : "2px solid rgba(150, 120, 160, 0.35)",
              background: active ? "#ff9d6c" : "rgba(255, 255, 255, 0.35)",
              color: active ? "#4a2c1f" : "inherit",
              fontWeight: 600,
              fontSize: "0.9rem",
              cursor: "pointer",
              transition: "transform 0.15s ease, background 0.15s ease",
              transform: active ? "scale(1.05)" : "scale(1)",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
