import { app, BrowserWindow, ipcMain, dialog } from "electron";
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
import { exportData } from "./database/progess/export.js";

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
ipcMain.handle("show-open-dialog", async (event, options) => {
  try {
    const result = await dialog.showOpenDialog(options);
    return result;
  } catch (error) {
    console.error("Error showing open dialog:", error);
    return { canceled: true, error: error.message };
  }
});

ipcMain.handle("show-save-dialog", async (event, options) => {
  try {
    const result = await dialog.showSaveDialog(options);
    return result;
  } catch (error) {
    console.error("Error showing save dialog:", error);
    return { canceled: true, error: error.message };
  }
});

ipcMain.handle("import-file", async (event, filePath) => {
  try {
    const importFilePath = importData(filePath);
    if (!importFilePath) {
      return { success: false, error: "Importing failed" };
    }
    return { success: true, filePath };
  } catch (error) {
    console.error("Error importing file:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("export-data", async (event, filePath) => {
  try {
    const result = exportData(filePath);
    return result;
  } catch (error) {
    console.error("Error exporting data:", error);
    return { success: false, error: error.message };
  }
});

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
