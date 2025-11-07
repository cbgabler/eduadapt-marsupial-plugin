import { getDb } from './database.js';

let sessions = {}

// Generate the current sessions
// vars: scenarioId (current selected scenario), userId (current user)
export function endSession(scenarioId, userId) {
  const db = getDb()
  const currScenario = db.prepare('SELECT * FROM scenarios WHERE id=?').get(scenarioId)

  const sessionId = db.prepare(`
    INSERT INTO sessions (scenarioId, userId, started) VALUES (?, ?, ?)
  `).run(scenarioId, userId, new Date())

  // Current state of the scenario (default)
  const currState = JSON.parse(scenario) // TODO need to make something that defines the current scenario, like a state definition table

  sessions[sessionId].interval = setInterval(() => tick(sessionId), 1000);

  return { sessionId, vitals: initialState };
}

export function endSession(sessionId) {
  get
}