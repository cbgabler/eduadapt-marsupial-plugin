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
