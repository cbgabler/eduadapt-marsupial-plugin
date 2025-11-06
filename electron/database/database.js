import path from 'path';
import { app } from 'electron';
import Database from 'better-sqlite3';

let db;

export function initDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'ehr_sim.db');
  db = new Database(dbPath);
  

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      first_name VARCHAR,
      last_name VARCHAR,
      username TEXT UNIQUE,
      email VARCHAR UNIQUE
    );
  `);

  return db;
}