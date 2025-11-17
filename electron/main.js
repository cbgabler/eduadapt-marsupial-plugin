import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { initDatabase } from "./database/database.js";
import {
  registerUser,
  getAllScenarios,
  getScenarioById,
} from "./database/dataModels.js";
import { seedExampleScenarios } from "./database/exampleScenarios.js";
import { importData } from "./database/progess/import.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !app.isPackaged; // for dev vs prod, should be changed later

// IPC handlers
ipcMain.handle(
  "register-user",
  async (event, { first_name, last_name, username, email }) => {
    try {
      console.log("Registering user:", {
        first_name,
        last_name,
        username,
        email,
      });
      const userId = registerUser(first_name, last_name, username, email);
      console.log("User registered successfully with ID:", userId);
      return { success: true, userId };
    } catch (error) {
      console.error("Error registering user:", error);
      return { success: false, error: error.message };
    }
  }
);

// Scenario handlers
ipcMain.handle("get-all-scenarios", async () => {
  try {
    const scenarios = getAllScenarios();
    return { success: true, scenarios };
  } catch (error) {
    console.error("Error getting scenarios:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("get-scenario", async (event, scenarioId) => {
  try {
    const scenario = getScenarioById(scenarioId);
    if (!scenario) {
      return { success: false, error: "Scenario not found" };
    }
    return { success: true, scenario };
  } catch (error) {
    console.error("Error getting scenario:", error);
    return { success: false, error: error.message };
  }
});

// Import & Export handlers
// use this when have more time https://www.electronjs.org/docs/latest/api/dialog
ipcMain.handle("import-file", async ()) => {
  try {
    const
  }
}

export function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "build/index.html"));
  }
}

// Initialize database and create window when app is ready
app.whenReady().then(async () => {
  initDatabase();

  // Seed example scenarios in development mode
  if (isDev) {
    try {
      await seedExampleScenarios();
    } catch (error) {
      console.error("Error seeding example scenarios:", error);
    }
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
