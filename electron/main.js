import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { initDatabase } from "./database/database.js";
import { registerUser } from "./database/dataStore.js";

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

function createWindow() {
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
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
