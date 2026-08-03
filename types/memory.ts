export interface SessionRecord {
  id: number;
  startedAt: string;
  endedAt: string | null;
}

export interface Turn {
  id: number;
  sessionId: number;
  role: "user" | "model";
  text: string;
  createdAt: string;
}

export interface Profile {
  summary: string;
  updatedAt: string | null;
}

export interface SafetyFlag {
  id: number;
  sessionId: number;
  excerpt: string;
  createdAt: string;
}
