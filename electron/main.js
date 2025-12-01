import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { initDatabase } from "./database/database.js";

// Users
import {
  authenticateUser,
  registerUser
} from "./database/models/users.js"

// Scenarios
import {
  getAllScenarios,
  getScenarioById,
  createScenario,
  deleteScenario,
} from "./database/models/scenarios.js"

// Sessions
import {
  addSessionNote,
  getSessionNotes,
  deleteSessionNote
} from "./database/models/sessions.js"

// Simulation deps
import {
  startSession,
  getSessionState,
  adjustMedication,
  pauseSession,
  resumeSession,
  endSession,
  getSession,
} from "./database/simulation.js";
import { seedExampleScenarios } from "./database/exampleScenarios.js";

// Import & Export deps
import { importData } from "./database/progess/import.js";
import { exportData } from "./database/progess/export.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !app.isPackaged; // for dev vs prod, should be changed later

// IPC handlers
ipcMain.handle("register-user", async (event, payload = {}) => {
  try {
    console.log("Registering user:", {
      username: payload.username,
    });
    const user = registerUser(payload);
    console.log("User registered successfully with ID:", user?.id);
    return { success: true, user };
  } catch (error) {
    console.error("Error registering user:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("login-user", async (event, payload = {}) => {
  try {
    const { username, password } = payload;
    const user = authenticateUser(username, password);
    return { success: true, user };
  } catch (error) {
    console.error("Error logging in:", error);
    return { success: false, error: error.message };
  }
});

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

ipcMain.handle("create-scenario", async (event, payload) => {
  try {
    const { name, definition } = payload ?? {};
    if (!name || !definition) {
      throw new Error("name and definition are required");
    }
    const scenarioId = createScenario(name, definition);
    return { success: true, scenarioId };
  } catch (error) {
    console.error("Error creating scenario:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("delete-scenario", async (event, scenarioId) => {
  try {
    if (!scenarioId) {
      throw new Error("scenarioId is required");
    }
    const deleted = deleteScenario(scenarioId);
    if (!deleted) {
      return { success: false, error: "Scenario not found" };
    }
    return { success: true };
  } catch (error) {
    console.error("Error deleting scenario:", error);
    return { success: false, error: error.message };
  }
});

// Simulation handlers
ipcMain.handle("start-sim", async (event, payload) => {
  try {
    const { scenarioId, userId } = payload ?? {};
    if (!scenarioId || !userId) {
      throw new Error("scenarioId and userId are required");
    }
    const { sessionId, state } = startSession(scenarioId, userId);
    return { success: true, sessionId, state };
  } catch (error) {
    console.error("Error starting simulation:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("get-sim-state", async (event, payload) => {
  try {
    const { sessionId } = payload ?? {};
    if (!sessionId) {
      throw new Error("sessionId is required");
    }
    const state = getSessionState(sessionId);
    return { success: true, state };
  } catch (error) {
    console.error("Error getting simulation state:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("adjust-sim-medication", async (event, payload) => {
  try {
    const { sessionId, medicationId, newDose } = payload ?? {};
    if (!sessionId || !medicationId || typeof newDose !== "number") {
      throw new Error(
        "sessionId, medicationId, and numeric newDose are required"
      );
    }
    const state = adjustMedication(sessionId, medicationId, newDose);
    return { success: true, state };
  } catch (error) {
    console.error("Error adjusting medication:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("pause-sim", async (event, payload) => {
  try {
    const { sessionId } = payload ?? {};
    if (!sessionId) {
      throw new Error("sessionId is required");
    }
    const state = pauseSession(sessionId);
    return { success: true, state };
  } catch (error) {
    console.error("Error pausing simulation:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("resume-sim", async (event, payload) => {
  try {
    const { sessionId } = payload ?? {};
    if (!sessionId) {
      throw new Error("sessionId is required");
    }
    const state = resumeSession(sessionId);
    return { success: true, state };
  } catch (error) {
    console.error("Error resuming simulation:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("end-sim", async (event, payload) => {
  try {
    const { sessionId } = payload ?? {};
    if (!sessionId) {
      throw new Error("sessionId is required");
    }
    const state = endSession(sessionId, { reason: "user_end" });
    return { success: true, state };
  } catch (error) {
    console.error("Error ending simulation:", error);
    return { success: false, error: error.message };
  }
});

// Documentation handlers
ipcMain.handle("add-note", async (event, payload) => {
  try {
    const { sessionId, userId, content, vitalsSnapshot } = payload ?? {};
    if (!sessionId || !userId || !content?.trim()) {
      throw new Error("sessionId, userId, and content are required");
    }
    const session = getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }
    const note = addSessionNote({
      sessionId,
      userId,
      content,
      vitalsSnapshot: vitalsSnapshot ?? null,
    });
    return { success: true, note };
  } catch (error) {
    console.error("Error adding note:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("get-notes", async (event, payload) => {
  try {
    const { sessionId } = payload ?? {};
    if (!sessionId) {
      throw new Error("sessionId is required");
    }
    const notes = getSessionNotes(sessionId);
    return { success: true, notes };
  } catch (error) {
    console.error("Error fetching notes:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("delete-note", async (event, payload) => {
  try {
    const { noteId, userId } = payload ?? {};
    if (!noteId) {
      throw new Error("noteId is required");
    }
    const note = deleteSessionNote({ noteId, userId });
    return { success: true, note };
  } catch (error) {
    console.error("Error deleting note:", error);
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
