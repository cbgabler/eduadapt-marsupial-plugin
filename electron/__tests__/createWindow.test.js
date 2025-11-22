import { jest } from "@jest/globals";

async function loadMainModule({ isPackaged = false } = {}) {
  jest.resetModules();

  const mockWindowInstance = {
    loadURL: jest.fn(),
    loadFile: jest.fn(),
    webContents: {
      openDevTools: jest.fn(),
    },
  };
  const mockBrowserWindow = jest.fn(() => mockWindowInstance);
  const mockIpcHandle = jest.fn();

  const mockApp = {
    whenReady: jest.fn(() => Promise.resolve()),
    on: jest.fn(),
    quit: jest.fn(),
    getPath: jest.fn(() => "/tmp/test-user-data"),
  };
  Object.defineProperty(mockApp, "isPackaged", {
    get: () => isPackaged,
  });

  const mockDataModels = {
    registerUser: jest.fn(),
    getAllScenarios: jest.fn(),
    getScenarioById: jest.fn(),
    addSessionNote: jest.fn(),
    getSessionNotes: jest.fn(),
    deleteSessionNote: jest.fn(),
  };

  await jest.unstable_mockModule("electron", () => ({
    app: mockApp,
    BrowserWindow: mockBrowserWindow,
    ipcMain: {
      handle: mockIpcHandle,
    },
    dialog: {
      showOpenDialog: jest.fn(),
      showSaveDialog: jest.fn(),
    },
  }));

  await jest.unstable_mockModule("../database/database.js", () => ({
    initDatabase: jest.fn(),
    getDb: jest.fn(),
  }));

  await jest.unstable_mockModule(
    "../database/dataModels.js",
    () => mockDataModels
  );

  await jest.unstable_mockModule("../database/exampleScenarios.js", () => ({
    seedExampleScenarios: jest.fn(),
  }));

  await jest.unstable_mockModule("../database/progess/import.js", () => ({
    importData: jest.fn(),
  }));

  await jest.unstable_mockModule("../database/progess/export.js", () => ({
    exportData: jest.fn(),
  }));

  await jest.unstable_mockModule("../database/simulation.js", () => ({
    startSession: jest.fn(),
    getSessionState: jest.fn(),
    adjustMedication: jest.fn(),
    pauseSession: jest.fn(),
    resumeSession: jest.fn(),
    endSession: jest.fn(),
    getSession: jest.fn(),
  }));

  const electron = await import("electron");
  const mainModule = await import("../main.js");

  mockBrowserWindow.mockClear();
  mockWindowInstance.loadURL.mockClear();
  mockWindowInstance.loadFile.mockClear();
  mockWindowInstance.webContents.openDevTools.mockClear();

  return {
    electron,
    createWindow: mainModule.createWindow,
    mockBrowserWindow,
    mockWindowInstance,
  };
}

describe("createWindow", () => {
  test("loads the dev server when running in development", async () => {
    const { createWindow, mockBrowserWindow, mockWindowInstance } =
      await loadMainModule({ isPackaged: false });

    createWindow();

    expect(mockBrowserWindow).toHaveBeenCalledTimes(1);
    expect(mockWindowInstance.loadURL).toHaveBeenCalledWith(
      "http://localhost:5173"
    );
    expect(mockWindowInstance.webContents.openDevTools).toHaveBeenCalled();
  });

  test("loads the bundled files when running in production", async () => {
    const { createWindow, mockWindowInstance } = await loadMainModule({
      isPackaged: true,
    });

    createWindow();

    expect(mockWindowInstance.loadURL).not.toHaveBeenCalled();
    expect(mockWindowInstance.loadFile).toHaveBeenCalledWith(
      expect.stringMatching(/build[\\/]+index\.html$/)
    );
    expect(mockWindowInstance.webContents.openDevTools).not.toHaveBeenCalled();
  });
});
