import { jest } from "@jest/globals";

const createMockWindow = () => ({
  loadURL: jest.fn(),
  loadFile: jest.fn(),
  webContents: {
    openDevTools: jest.fn(),
  },
});

const mockBrowserWindow = jest.fn(() => createMockWindow());

const mockApp = {
  whenReady: jest.fn(() => Promise.resolve()),
  on: jest.fn(),
  quit: jest.fn(),
  getPath: jest.fn(() => "/tmp/test-user-data"),
  get isPackaged() {
    return global.__TEST_IS_PACKAGED__ ?? false;
  },
};

await jest.unstable_mockModule("electron", () => ({
  app: mockApp,
  BrowserWindow: mockBrowserWindow,
  ipcMain: {
    handle: jest.fn(),
  },
}));

await jest.unstable_mockModule("../database/database.js", () => ({
  initDatabase: jest.fn(),
  getDb: jest.fn(),
}));

await jest.unstable_mockModule("../database/dataStore.js", () => ({
  registerUser: jest.fn(),
}));

const electron = await import("electron");
const { createWindow } = await import("../main.js");

describe("createWindow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete global.__TEST_IS_PACKAGED__;
  });

  test("loads dev server upon run", () => {
    global.__TEST_IS_PACKAGED__ = false;

    createWindow();

    expect(electron.BrowserWindow).toHaveBeenCalledTimes(1);

    const windowInstance =
      electron.BrowserWindow.mock.results[
        electron.BrowserWindow.mock.results.length - 1
      ].value;
    expect(windowInstance.loadURL).toHaveBeenCalledWith(
      "http://localhost:5173"
    );
  });
});
