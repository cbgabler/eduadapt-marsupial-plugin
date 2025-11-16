import { jest } from "@jest/globals";

async function loadMainWithScenarioMocks() {
  jest.resetModules();

  const mockWindowInstance = {
    loadURL: jest.fn(),
    loadFile: jest.fn(),
    webContents: { openDevTools: jest.fn() },
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
    get: () => false,
  });

  const dataModelMocks = {
    registerUser: jest.fn(),
    getAllScenarios: jest.fn(),
    getScenarioById: jest.fn(),
  };

  await jest.unstable_mockModule("electron", () => ({
    app: mockApp,
    BrowserWindow: mockBrowserWindow,
    ipcMain: { handle: mockIpcHandle },
  }));

  await jest.unstable_mockModule("../database/database.js", () => ({
    initDatabase: jest.fn(),
    getDb: jest.fn(),
  }));

  await jest.unstable_mockModule("../database/dataModels.js", () => dataModelMocks);

  await jest.unstable_mockModule("../database/exampleScenarios.js", () => ({
    seedExampleScenarios: jest.fn(),
  }));

  const electron = await import("electron");
  await import("../main.js");

  return { electron, dataModelMocks, mockIpcHandle };
}

const findHandler = (ipcMock, channel) => {
  const handlerCall = ipcMock.mock.calls.find(([name]) => name === channel);
  if (!handlerCall) {
    throw new Error(`Handler for ${channel} not registered`);
  }
  return handlerCall[1];
};

describe("scenario IPC handlers", () => {
  test("get-all-scenarios returns payload on success", async () => {
    const { mockIpcHandle, dataModelMocks } =
      await loadMainWithScenarioMocks();
    const scenarios = [{ id: 1, name: "Example" }];
    dataModelMocks.getAllScenarios.mockReturnValueOnce(scenarios);

    const handler = findHandler(mockIpcHandle, "get-all-scenarios");
    const response = await handler();

    expect(dataModelMocks.getAllScenarios).toHaveBeenCalledTimes(1);
    expect(response).toEqual({ success: true, scenarios });
  });

  test("get-all-scenarios reports errors", async () => {
    const { mockIpcHandle, dataModelMocks } =
      await loadMainWithScenarioMocks();
    const err = new Error("db down");
    dataModelMocks.getAllScenarios.mockImplementation(() => {
      throw err;
    });

    const handler = findHandler(mockIpcHandle, "get-all-scenarios");
    const response = await handler();

    expect(response).toEqual({ success: false, error: err.message });
  });

  test("get-scenario returns record when found", async () => {
    const { mockIpcHandle, dataModelMocks } =
      await loadMainWithScenarioMocks();
    const scenario = { id: 3, name: "Case" };
    dataModelMocks.getScenarioById.mockReturnValueOnce(scenario);

    const handler = findHandler(mockIpcHandle, "get-scenario");
    const response = await handler(null, 3);

    expect(dataModelMocks.getScenarioById).toHaveBeenCalledWith(3);
    expect(response).toEqual({ success: true, scenario });
  });

  test("get-scenario returns error when not found", async () => {
    const { mockIpcHandle, dataModelMocks } =
      await loadMainWithScenarioMocks();
    dataModelMocks.getScenarioById.mockReturnValueOnce(undefined);

    const handler = findHandler(mockIpcHandle, "get-scenario");
    const response = await handler(null, 7);

    expect(response).toEqual({
      success: false,
      error: "Scenario not found",
    });
  });

  test("get-scenario surfaces thrown errors", async () => {
    const { mockIpcHandle, dataModelMocks } =
      await loadMainWithScenarioMocks();
    dataModelMocks.getScenarioById.mockImplementation(() => {
      throw new Error("boom");
    });

    const handler = findHandler(mockIpcHandle, "get-scenario");
    const response = await handler(null, 9);

    expect(response).toEqual({ success: false, error: "boom" });
  });
});
