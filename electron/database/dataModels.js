import { getDb } from "./database.js";

export function registerUser(first_name, last_name, username, email) {
  const db = getDb();

  // Check if username already exists
  const existingUser = db
    .prepare("SELECT id FROM users WHERE username = ? OR email = ?")
    .get(username, email);
  if (existingUser) {
    throw new Error("Username or email already exists");
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

// Scenario functions
export function createScenario(name, definition) {
  const db = getDb();

  const stmt = db.prepare(`
    INSERT INTO scenarios (name, definition) VALUES (?, ?);
  `);

  const info = stmt.run(name, JSON.stringify(definition));
  return info.lastInsertRowid;
}

export function getScenarioById(scenarioId) {
  const db = getDb();
  const scenario = db
    .prepare("SELECT * FROM scenarios WHERE id = ?")
    .get(scenarioId);
  if (scenario && scenario.definition) {
    scenario.definition = JSON.parse(scenario.definition);
  }
  return scenario;
}

export function getAllScenarios() {
  const db = getDb();
  const scenarios = db.prepare("SELECT * FROM scenarios ORDER BY id").all();
  return scenarios.map((scenario) => {
    if (scenario.definition) {
      scenario.definition = JSON.parse(scenario.definition);
    }
    return scenario;
  });
}

export function updateScenario(scenarioId, name, definition) {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE scenarios 
    SET name = ?, definition = ? 
    WHERE id = ?
  `);
  const info = stmt.run(name, JSON.stringify(definition), scenarioId);
  return info.changes > 0;
}

export function deleteScenario(scenarioId) {
  const db = getDb();
  const info = db.prepare("DELETE FROM scenarios WHERE id = ?").run(scenarioId);
  return info.changes > 0;
}

/*
All update functions
*/

/*
All get functions
*/
export function getUserById(userId) {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
}

export function getUserByUsername(username) {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE username = ?").get(username);
}

export function getUserByEmail(email) {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email);
}

export function getAllUsers() {
  const db = getDb();
  return db.prepare("SELECT * FROM users").all();
}

export function addSessionNote({
  sessionId,
  userId,
  content,
  vitalsSnapshot = null,
}) {
  const db = getDb();
  const sanitizedContent = (content ?? "").trim();
  if (!sanitizedContent) {
    throw new Error("Note content is required");
  }

  const createdAt = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO notes (sessionId, userId, content, vitalsSnapshot, createdAt)
    VALUES (?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    sessionId,
    userId,
    sanitizedContent,
    vitalsSnapshot ? JSON.stringify(vitalsSnapshot) : null,
    createdAt
  );

  return {
    id: info.lastInsertRowid,
    sessionId,
    userId,
    content: sanitizedContent,
    createdAt,
    vitalsSnapshot,
  };
}

export function getSessionNotes(sessionId) {
  const db = getDb();
  const rows = db
    .prepare(
      `
    SELECT id, sessionId, userId, content, vitalsSnapshot, createdAt
    FROM notes
    WHERE sessionId = ?
    ORDER BY datetime(createdAt) ASC, id ASC
  `
    )
    .all(sessionId);

  return rows.map((row) => ({
    ...row,
    vitalsSnapshot: row.vitalsSnapshot
      ? JSON.parse(row.vitalsSnapshot)
      : null,
  }));
}

export function deleteSessionNote({ noteId, userId }) {
  const db = getDb();
  const note = db
    .prepare("SELECT * FROM notes WHERE id = ?")
    .get(noteId);
  if (!note) {
    throw new Error("Note not found");
  }
  if (userId && note.userId !== userId) {
    throw new Error("You do not have permission to delete this note");
  }
  db.prepare("DELETE FROM notes WHERE id = ?").run(noteId);
  return {
    ...note,
    vitalsSnapshot: note.vitalsSnapshot
      ? JSON.parse(note.vitalsSnapshot)
      : null,
  };
}
