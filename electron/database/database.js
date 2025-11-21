import path from "path";
import { app } from "electron";
import Database from "better-sqlite3";
import { error } from "console";

let db;

// Initializes the current database if it doesn't already exist
export function initDatabase() {
  const dbPath = path.join(app.getPath("userData"), "ehr_scenarios.db");
  db = new Database(dbPath);

  // Build table if not exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      first_name VARCHAR,
      last_name VARCHAR,
      username TEXT UNIQUE,
      role TEXT DEFAULT 'student' CHECK(role IN ('student', 'instructor', 'admin')),
      email VARCHAR UNIQUE
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
  `);

  return db;
}

export function getDb() {
  if (!db) {
    throw new error("DB failed to initialize.");
  }
  return db;
}
