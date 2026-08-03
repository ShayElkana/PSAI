import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import type { Profile, SafetyFlag, SessionRecord, Turn } from "../../types/memory";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "psai.db");

function openDb(): Database.Database {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at TEXT NOT NULL,
      ended_at TEXT
    );
    CREATE TABLE IF NOT EXISTS turns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES sessions(id),
      role TEXT NOT NULL CHECK (role IN ('user','model')),
      text TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      summary TEXT NOT NULL DEFAULT '',
      updated_at TEXT
    );
    CREATE TABLE IF NOT EXISTS safety_flags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES sessions(id),
      excerpt TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  db.prepare(`INSERT OR IGNORE INTO profile (id, summary, updated_at) VALUES (1, '', NULL)`).run();
  return db;
}

let dbInstance: Database.Database | null = null;

function getDb(): Database.Database {
  if (!dbInstance) dbInstance = openDb();
  return dbInstance;
}

export function startSession(): number {
  const result = getDb()
    .prepare(`INSERT INTO sessions (started_at) VALUES (?)`)
    .run(new Date().toISOString());
  return Number(result.lastInsertRowid);
}

export function endSession(sessionId: number): void {
  getDb()
    .prepare(`UPDATE sessions SET ended_at = ? WHERE id = ?`)
    .run(new Date().toISOString(), sessionId);
}

export function saveTurn(sessionId: number, role: "user" | "model", text: string): void {
  if (!text.trim()) return;
  getDb()
    .prepare(`INSERT INTO turns (session_id, role, text, created_at) VALUES (?, ?, ?, ?)`)
    .run(sessionId, role, text, new Date().toISOString());
}

export function getSessionTurns(sessionId: number): Turn[] {
  const rows = getDb()
    .prepare(`SELECT id, session_id as sessionId, role, text, created_at as createdAt FROM turns WHERE session_id = ? ORDER BY id ASC`)
    .all(sessionId) as Turn[];
  return rows;
}

export function getProfile(): Profile {
  const row = getDb()
    .prepare(`SELECT summary, updated_at as updatedAt FROM profile WHERE id = 1`)
    .get() as Profile | undefined;
  return row ?? { summary: "", updatedAt: null };
}

export function setProfile(summary: string): void {
  getDb()
    .prepare(`UPDATE profile SET summary = ?, updated_at = ? WHERE id = 1`)
    .run(summary, new Date().toISOString());
}

export function logSafetyFlag(sessionId: number, excerpt: string): void {
  getDb()
    .prepare(`INSERT INTO safety_flags (session_id, excerpt, created_at) VALUES (?, ?, ?)`)
    .run(sessionId, excerpt, new Date().toISOString());
}

export function getRecentSessions(limit = 20): SessionRecord[] {
  const rows = getDb()
    .prepare(`SELECT id, started_at as startedAt, ended_at as endedAt FROM sessions ORDER BY id DESC LIMIT ?`)
    .all(limit) as SessionRecord[];
  return rows;
}

export function getRecentSafetyFlags(limit = 50): SafetyFlag[] {
  const rows = getDb()
    .prepare(`SELECT id, session_id as sessionId, excerpt, created_at as createdAt FROM safety_flags ORDER BY id DESC LIMIT ?`)
    .all(limit) as SafetyFlag[];
  return rows;
}
