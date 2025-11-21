import { getDb } from "../database.js";
import { app } from "electron";
import path from "path";
import fs from "fs";

// Export current scenario from local db for sharing to students
export function exportData(filePath) {
  const db = getDb();
  const sourceDbPath = path.join(app.getPath("userData"), "ehr_sim.db");

  if (!fs.existsSync(sourceDbPath)) {
    throw new Error("Source database file does not exist");
  }

  // Copy the database file to the destination
  fs.copyFileSync(sourceDbPath, filePath);

  return { success: true, filePath };
}
