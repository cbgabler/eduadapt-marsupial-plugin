import { getDb } from './database.js';

let sessions = {}

// Generate the current sessions
// vars: scenarioId (current selected scenario), userId (current user)
export function start(scenarioId, userId) {
  const db = getDb()
  const currScenario = db.prepare('SELECT * FROM scenarios WHERE id=?').get(scenarioId)

  const sessionId = db.prepare(`
    INSERT INTO sessions ()
  `)
}