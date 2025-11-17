import { getDb } from "../database";
import { error } from "console";

// Import custom scenarios created by educators
export function importData() {
  const db = getDb();
  const path = "ehr_sim.db"; // Change this to importing the path

  db.exec(`
    ATTACH DATABASE ${path} AS source
    INSERT OR IGNORE INTO main.scenarios (name, definition)
    SELECT name, definition FROM source.scenarios;
    INSERT OR IGNORE INTO main.scenario_tabs (scenarioId, name, content, orderIndex)
    SELECT m.id, st.name, st.content, st.orderIndex
    FROM source.scenario_tabs st
    JOIN source.scenarios s ON st.scenarioId = s.id
    JOIN main.scenarios m ON s.name = m.name AND s.definition = m.definition
    DETACH DATABASE source;
  `);
}
