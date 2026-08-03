import type { Language } from "@/types/conversation";

const STORAGE_KEY = "psai-language";
const listeners = new Set<() => void>();

function isLanguage(value: string | null): value is Language {
  return value === "en" || value === "he" || value === "ru" || value === "ar";
}

// For useSyncExternalStore: the server (and the first client render, to
// avoid a hydration mismatch) always sees "en"; the real stored value
// takes over immediately after mount via the subscribed re-render.
export function getServerLanguageSnapshot(): Language {
  return "en";
}

export function getLanguageSnapshot(): Language {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isLanguage(stored) ? stored : "en";
}

export function setStoredLanguage(language: Language): void {
  window.localStorage.setItem(STORAGE_KEY, language);
  listeners.forEach((listener) => listener());
}

export function subscribeToLanguage(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
