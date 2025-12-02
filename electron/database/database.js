import path from "path";
import { app } from "electron";
import Database from "better-sqlite3";
import { error } from "console";

const defaultDbPath = path.join(app.getPath("userData"), "ehr_scenarios.db");

let db;

// Initializes the current database if it doesn't already exist
// @param {string} [customDbPath] - Optional path to database file. Defaults to the main database path.
export function initDatabase(dbPath = defaultDbPath) {
  db = new Database(dbPath);

  // Build table if not exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student', 'instructor', 'admin')),
      passwordHash TEXT
    );

    CREATE TABLE IF NOT EXISTS scenarios (
      id INTEGER PRIMARY KEY,
      name TEXT, 
      definition TEXT
    );

    CREATE TABLE IF NOT EXISTS scenario_states (
      id INTEGER PRIMARY KEY,
      scenarioId INTEGER,
      createdBy INTEGER,
      isPublished BOOLEAN DEFAULT 0,
      publishDate DATETIME,
      FOREIGN KEY (scenarioId) REFERENCES scenarios(id) ON DELETE CASCADE,
      FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS scenario_tabs (
      id INTEGER PRIMARY KEY,
      scenarioId INTEGER,
      name TEXT,
      content TEXT,
      orderIndex INTEGER,
      FOREIGN KEY (scenarioId) REFERENCES scenarios(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY,
      scenarioId INTEGER,
      userId INTEGER,
      started DATETIME,
      ended DATETIME,
      FOREIGN KEY (scenarioId) REFERENCES scenarios(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY,
      sessionId INTEGER,
      userId INTEGER,
      content TEXT,
      vitalsSnapshot TEXT,
      createdAt DATETIME,
      FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  return db;
}

export function getDb() {
  if (!db) {
    throw new error("DB failed to initialize.");
  }
  return db;
}
