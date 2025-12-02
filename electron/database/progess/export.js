import { getDb } from "../database.js";
import { initDatabase } from "../database.js";
import { app } from "electron";
import path from "path";
import fs from "fs";

/* 
Export current scenario from local db for sharing to students

scenarioIds must be formatted as (1,2,...,k)
temp is a var to hold our selected scenarioIds from the frontend. Must be changed to uphold any schema changes (scenario_tabs/states... etc.)
*/
export function exportData(filePath, scenarioIds) {
  const tempDb = initDatabase(filePath)
  const sourceDbPath = path.join(app.getPath("userData"), "ehr_scenarios.db");

  if (!fs.existsSync(sourceDbPath)) {
    throw new Error("Source database file does not exist");
  }

  const temp = tempDb.exec(`
      ATTACH database ${sourceDbPath} as main
      INSERT INTO 
      SELECT * FROM scenarios WHERE id=${scenarioIds};
    `);
  console.log(temp)

  return { success: true, filePath };
}
