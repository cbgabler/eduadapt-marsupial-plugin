import { getDb } from './database.js';

export function addUsers(first_name, last_name, email) {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO users (
      first_name,
      last_name,
      email
    ) VALUES (
      ?, ?, ?, ?
    );
  `);

  const info = stmt.run(first_name, last_name, email)
  return info.lastInsertRowid;
}