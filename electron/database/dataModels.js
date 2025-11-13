import { getDb } from './database.js';

export function registerUser(first_name, last_name, username, email) {
  const db = getDb();
  
  // Check if username already exists
  const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existingUser) {
    throw new Error('Username or email already exists');
  }
  
  const stmt = db.prepare(`
    INSERT INTO users (
      first_name,
      last_name,
      username,
      email
    ) VALUES (
      ?, ?, ?, ?
    );
  `);

  const info = stmt.run(first_name, last_name, username, email);
  return info.lastInsertRowid;
}

export function createScenario(name, definition, createdBy) {
  const db = getDb();

  const stmt = db.prepare(`
    INSERT INTO scenarios (name, definition, createdBy) VALUES (?, ?, ?);
  `);

  const info = stmt.run(name, definition, createdBy);
  return info.lastInsertRowid;
}

/*
All update functions
*/

/*
All get functions
*/
export function getUserById(userId) {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
}

export function getUserByUsername(username) {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
}

export function getUserByEmail(email) {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

export function getAllUsers() {
  const db = getDb();
  return db.prepare('SELECT * FROM users').all();
}