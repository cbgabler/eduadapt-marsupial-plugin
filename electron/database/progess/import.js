import { getDb } from "../database.js";
import { error } from "console";
import fs from "fs";
import path from "path";

// Import custom scenarios created by educators
export function importData(filePath) {
  const db = getDb();

  if (!fs.existsSync(filePath)) {
    throw new Error("File path does not exist")
  }

  if (!filePath.endsWith(".db") && !filePath.endsWith(".sqlite") && !filePath.endsWith(".sqlite3")) {
    throw new Error("File path does not have the correct suffix")
  }

  const normalizedPath = path.resolve(filePath).replace(/'/g, "''");

  try {
    db.exec(`
      ATTACH DATABASE '${normalizedPath}' AS source;
      INSERT OR IGNORE INTO main.scenarios (name, definition)
      SELECT name, definition FROM source.scenarios;
      INSERT OR IGNORE INTO main.scenario_tabs (scenarioId, name, content, orderIndex)
      SELECT m.id, st.name, st.content, st.orderIndex
      FROM source.scenario_tabs st
      JOIN source.scenarios s ON st.scenarioId = s.id
      JOIN main.scenarios m ON s.name = m.name AND s.definition = m.definition;
      DETACH DATABASE source;
    `);

    return { success: true, filePath}
  } catch (err) {
    try {
      db.exec(`DETACH DATABASE IF EXISTS source;`)
    } catch (detachErr) {
      // Ignore detach errors
    }
    throw err;
  }
}
