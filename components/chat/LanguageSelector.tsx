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
    <div style={{ display: "flex", gap: "0.4rem" }}>
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: "0.3rem 0.7rem",
            borderRadius: 999,
            border: "1px solid #444",
            background: language === opt.value ? "#5b8def" : "transparent",
            color: language === opt.value ? "#fff" : "#aaa",
            fontSize: "0.78rem",
            cursor: "pointer",
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
