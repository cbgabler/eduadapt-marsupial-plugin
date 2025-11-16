import { getDb } from '../database';

// Import custom scenarios created by educators
export function importData() {
  const db = getDb()
  const stmt = ".open" + 

  db.exec(stmt)
}