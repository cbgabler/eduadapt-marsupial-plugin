import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { initDatabase } from "./database/database.js";
import {
  registerUser,
  getAllScenarios,
  getScenarioById,
  addSessionNote,
  getSessionNotes,
  deleteSessionNote,
} from "./database/dataModels.js";
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
