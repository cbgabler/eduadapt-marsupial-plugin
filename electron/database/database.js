import path from "path";
import { app } from "electron";
import Database from "better-sqlite3";
import { error } from "console";

let db;

// Current version
const SCHEMA_VERSION = "v1.1.0";

// Initializes the current database if it doesn't already exist
export function initDatabase() {
  const dbPath = path.join(app.getPath("userData"), "ehr_scenarios.db");
  db = new Database(dbPath);

  // Build table if not exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version TEXT PRIMARY KEY
    );

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
      FOREIGN KEY (scenarioId) REFERENCES scenarios(id),
      FOREIGN KEY (createdBy) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS scenario_tabs (
      id INTEGER PRIMARY KEY,
      scenarioId INTEGER,
      name TEXT,
      content TEXT,
      orderIndex INTEGER,
      FOREIGN KEY (scenarioId) REFERENCES scenarios(id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY,
      scenarioId INTEGER,
      userId INTEGER,
      started DATETIME,
      ended DATETIME,
      FOREIGN KEY (scenarioId) REFERENCES scenarios(id),
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY,
      sessionId INTEGER,
      userId INTEGER,
      content TEXT,
      vitalsSnapshot TEXT,
      createdAt DATETIME,
      FOREIGN KEY (sessionId) REFERENCES sessions(id),
      FOREIGN KEY (userId) REFERENCES users(id)
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

export function checkSchema() {
  const db = getDb();

  if (!db) {
    throw new error("DB failed to initialize.");
  }

  const CURRENT_VERSION = db.exec(`SELECT * FROM schema_version`);
  if (CURRENT_VERSION != SCHEMA_VERSION) {
    db.exec();
  }
}
