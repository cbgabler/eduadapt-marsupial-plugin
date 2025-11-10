import { getDb } from './database.js';

let sessions = {};

// These arent really important to the current sprint.

// Start a new session
// vars: scenarioId (current selected scenario), userId (current user)
export function startSession(scenarioId, userId) {
  const db = getDb();
  
  // Verify user
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  // Verify scenario
  const currScenario = db.prepare('SELECT * FROM scenarios WHERE id = ?').get(scenarioId);
  if (!currScenario) {
    throw new Error('Scenario not found');
  }

  const info = db.prepare(`
    INSERT INTO sessions (scenarioId, userId, started) VALUES (?, ?, ?)
  `).run(scenarioId, userId, new Date().toISOString());

  const sessionId = info.lastInsertRowid;

  // Current state of the scenario (default)
  // TODO: need to make something that defines the current scenario, like a state definition table
  const currState = currScenario.definition ? JSON.parse(currScenario.definition) : {};

  sessions[sessionId] = {
    scenarioId,
    userId,
    state: currState,
    started: new Date().toISOString()
  };

  // function to tick the session
  // sessions[sessionId].interval = setInterval(() => tick(sessionId), 1000);

  return { sessionId, state: currState };
}

// End a session
export function endSession(sessionId) {
  const db = getDb();
  
  // Update session end time in database
  const info = db.prepare(`
    UPDATE sessions SET ended = ? WHERE id = ?
  `).run(new Date().toISOString(), sessionId);
  
  // Clear session from memory
  if (sessions[sessionId] && sessions[sessionId].interval) {
    clearInterval(sessions[sessionId].interval);
  }
  delete sessions[sessionId];
  
  return info.changes > 0;
}

// Get a session by ID
export function getSession(sessionId) {
  const db = getDb();
  return db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
}

// Get all sessions
export function getUserSessions(userId) {
  const db = getDb();
  return db.prepare('SELECT * FROM sessions WHERE userId = ? ORDER BY started DESC').all(userId);
}