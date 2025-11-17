import { getDb } from '../database';

// Export current scenario from local db for sharing to students
export function exportData() {
  const db = getDb()

  db.exec(`
      .save ehr_sim.db;
    `);
}