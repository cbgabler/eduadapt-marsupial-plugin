import path from 'path';
import { app } from 'electron';
import Database from 'better-sqlite3';
import { error } from 'console';

let db;

// Initializes the current database if it doesn't already exist
export function initDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'ehr_sim.db');
  db = new Database(dbPath);
  
  // Build table if not exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      first_name VARCHAR,
      last_name VARCHAR,
      username TEXT UNIQUE,
      role enum('student', 'instructor', 'admin') DEFAULT 'student',
      email VARCHAR UNIQUE
    );

    CREATE TABLE IF NOT EXISTS scenarios (
      id INTEGER PRIMARY KEY,
      name TEXT, 
      definition TEXT, 
    );

    CREATE TABLE IF NOT EXISTS scenario_states (
      id INTEGER PRIMARY KEY,
      scenarioId INTEGER FOREIGN KEY REFERENCES scenarios(id),
      createdBy INTEGER FOREIEGN KEY REFERENCES users(id),
      isPublished BOOLEAN DEFAULT FALSE,
      publishDate DATETIME
    );

    CREATE TABLE IF NOT EXISTS scenario_tabs (
      id
      scenarioId INTEGER FOREIGN KEY REFERENCES scenarios(id),

    )

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY,
      scenarioId INTEGER FOREIGN KEY REFERENCES scenarios(id),
      userId INTEGER,
      started datetime,
      ended datetime
    );
  `);

  return db;
}

export function getDb() {
  if (!db) {
    throw new error('DB failed to initialize.');
  }
  return db;
}