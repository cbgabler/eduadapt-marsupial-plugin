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

  const userMocks = {
    registerUser: jest.fn(),
    authenticateUser: jest.fn(),
  };

  const scenarioMocks = {
    getAllScenarios: jest.fn(),
    getScenarioById: jest.fn(),
  };

  const sessionMocks = {
    addSessionNote: jest.fn(),
    getSessionNotes: jest.fn(),
    deleteSessionNote: jest.fn(),
  };

  await jest.unstable_mockModule("electron", () => ({
    app: mockApp,
    BrowserWindow: mockBrowserWindow,
    ipcMain: { handle: mockIpcHandle },
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
    "../database/models/users.js",
    () => userMocks
  );

  await jest.unstable_mockModule(
    "../database/models/scenarios.js",
    () => scenarioMocks
  );

  await jest.unstable_mockModule(
    "../database/models/sessions.js",
    () => sessionMocks
  );

  await jest.unstable_mockModule("../database/exampleScenarios.js", () => ({
    seedExampleScenarios: jest.fn(),
  }));
  const simulationMocks = {
    startSession: jest.fn(),
    getSessionState: jest.fn(),
    adjustMedication: jest.fn(),
    pauseSession: jest.fn(),
    resumeSession: jest.fn(),
    endSession: jest.fn(),
    getSession: jest.fn(),
  };

  await jest.unstable_mockModule(
    "../database/simulation.js",
    () => simulationMocks
  );

  await jest.unstable_mockModule("../database/progess/import.js", () => ({
    importData: jest.fn(),
  }));

  await jest.unstable_mockModule("../database/progess/export.js", () => ({
    exportData: jest.fn(),
  }));

  const electron = await import("electron");
  await import("../main.js");

  return {
    electron,
    userMocks,
    scenarioMocks,
    sessionMocks,
    mockIpcHandle,
    simulationMocks,
  };
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
    const { mockIpcHandle, scenarioMocks } = await loadMainWithScenarioMocks();
    const scenarios = [{ id: 1, name: "Example" }];
    scenarioMocks.getAllScenarios.mockReturnValueOnce(scenarios);

    const handler = findHandler(mockIpcHandle, "get-all-scenarios");
    const response = await handler();

    expect(scenarioMocks.getAllScenarios).toHaveBeenCalledTimes(1);
    expect(response).toEqual({ success: true, scenarios });
  });

  test("get-all-scenarios reports errors", async () => {
    const { mockIpcHandle, scenarioMocks } = await loadMainWithScenarioMocks();
    const err = new Error("db down");
    scenarioMocks.getAllScenarios.mockImplementation(() => {
      throw err;
    });

    const handler = findHandler(mockIpcHandle, "get-all-scenarios");
    const response = await handler();

    expect(response).toEqual({ success: false, error: err.message });
  });

  test("get-scenario returns record when found", async () => {
    const { mockIpcHandle, scenarioMocks } = await loadMainWithScenarioMocks();
    const scenario = { id: 3, name: "Case" };
    scenarioMocks.getScenarioById.mockReturnValueOnce(scenario);

    const handler = findHandler(mockIpcHandle, "get-scenario");
    const response = await handler(null, 3);

    expect(scenarioMocks.getScenarioById).toHaveBeenCalledWith(3);
    expect(response).toEqual({ success: true, scenario });
  });

  test("get-scenario returns error when not found", async () => {
    const { mockIpcHandle, scenarioMocks } = await loadMainWithScenarioMocks();
    scenarioMocks.getScenarioById.mockReturnValueOnce(undefined);

    const handler = findHandler(mockIpcHandle, "get-scenario");
    const response = await handler(null, 7);

    expect(response).toEqual({
      success: false,
      error: "Scenario not found",
    });
  });

  test("get-scenario surfaces thrown errors", async () => {
    const { mockIpcHandle, scenarioMocks } = await loadMainWithScenarioMocks();
    scenarioMocks.getScenarioById.mockImplementation(() => {
      throw new Error("boom");
    });

    const handler = findHandler(mockIpcHandle, "get-scenario");
    const response = await handler(null, 9);

    expect(response).toEqual({ success: false, error: "boom" });
  });
});

describe("auth IPC handlers", () => {
  test("register-user returns new user on success", async () => {
    const { mockIpcHandle, userMocks } = await loadMainWithScenarioMocks();
    const mockUser = { id: 4, username: "nurse", role: "student" };
    userMocks.registerUser.mockReturnValueOnce(mockUser);

    const handler = findHandler(mockIpcHandle, "register-user");
    const payload = {
      username: "nurse",
      password: "Secret1!",
      role: "student",
    };
    const response = await handler(null, payload);

    expect(userMocks.registerUser).toHaveBeenCalledWith(payload);
    expect(response).toEqual({ success: true, user: mockUser });
  });

  test("register-user reports underlying errors", async () => {
    const { mockIpcHandle, userMocks } = await loadMainWithScenarioMocks();
    userMocks.registerUser.mockImplementation(() => {
      throw new Error("taken");
    });

    const handler = findHandler(mockIpcHandle, "register-user");
    const response = await handler(null, { username: "dupe" });

    expect(response).toEqual({ success: false, error: "taken" });
  });

  test("login-user returns authenticated user", async () => {
    const { mockIpcHandle, userMocks } = await loadMainWithScenarioMocks();
    const mockUser = { id: 2, username: "educator", role: "instructor" };
    userMocks.authenticateUser.mockReturnValueOnce(mockUser);

    const handler = findHandler(mockIpcHandle, "login-user");
    const response = await handler(null, {
      username: "educator",
      password: "StrongPass1!",
    });

    expect(userMocks.authenticateUser).toHaveBeenCalledWith(
      "educator",
      "StrongPass1!"
    );
    expect(response).toEqual({ success: true, user: mockUser });
  });

  test("login-user surfaces authentication failures", async () => {
    const { mockIpcHandle, userMocks } = await loadMainWithScenarioMocks();
    userMocks.authenticateUser.mockImplementation(() => {
      throw new Error("Invalid credentials");
    });

    const handler = findHandler(mockIpcHandle, "login-user");
    const response = await handler(null, {
      username: "educator",
      password: "bad",
    });

    expect(response).toEqual({
      success: false,
      error: "Invalid credentials",
    });
  });
});

describe("simulation IPC handlers", () => {
  test("start-sim returns session data", async () => {
    const { mockIpcHandle, simulationMocks } =
      await loadMainWithScenarioMocks();
    const sessionState = { status: "running" };
    simulationMocks.startSession.mockReturnValueOnce({
      sessionId: 12,
      state: sessionState,
    });

    const handler = findHandler(mockIpcHandle, "start-sim");
    const result = await handler(null, { scenarioId: 3, userId: 9 });

    expect(simulationMocks.startSession).toHaveBeenCalledWith(3, 9);
    expect(result).toEqual({
      success: true,
      sessionId: 12,
      state: sessionState,
    });
  });

  test("start-sim reports errors", async () => {
    const { mockIpcHandle, simulationMocks } =
      await loadMainWithScenarioMocks();
    simulationMocks.startSession.mockImplementation(() => {
      throw new Error("nope");
    });

    const handler = findHandler(mockIpcHandle, "start-sim");
    const result = await handler(null, { scenarioId: 3, userId: 9 });

    expect(result).toEqual({ success: false, error: "nope" });
  });

  test("get-sim-state proxies to session manager", async () => {
    const { mockIpcHandle, simulationMocks } =
      await loadMainWithScenarioMocks();
    const state = { tickCount: 2 };
    simulationMocks.getSessionState.mockReturnValueOnce(state);

    const handler = findHandler(mockIpcHandle, "get-sim-state");
    const result = await handler(null, { sessionId: 55 });

    expect(simulationMocks.getSessionState).toHaveBeenCalledWith(55);
    expect(result).toEqual({ success: true, state });
  });

  test("adjust-sim-medication validates numeric dose", async () => {
    const { mockIpcHandle, simulationMocks } =
      await loadMainWithScenarioMocks();
    const state = { tickCount: 5 };
    simulationMocks.adjustMedication.mockReturnValueOnce(state);

    const handler = findHandler(mockIpcHandle, "adjust-sim-medication");
    const payload = { sessionId: 1, medicationId: "med", newDose: 12 };
    const result = await handler(null, payload);

    expect(simulationMocks.adjustMedication).toHaveBeenCalledWith(
      payload.sessionId,
      payload.medicationId,
      payload.newDose
    );
    expect(result).toEqual({ success: true, state });
  });

  test("pause-sim and resume-sim invoke matching helpers", async () => {
    const { mockIpcHandle, simulationMocks } =
      await loadMainWithScenarioMocks();
    const paused = { status: "paused" };
    const resumed = { status: "running" };
    simulationMocks.pauseSession.mockReturnValueOnce(paused);
    simulationMocks.resumeSession.mockReturnValueOnce(resumed);

    const pauseHandler = findHandler(mockIpcHandle, "pause-sim");
    const resumeHandler = findHandler(mockIpcHandle, "resume-sim");

    expect(await pauseHandler(null, { sessionId: 9 })).toEqual({
      success: true,
      state: paused,
    });
    expect(await resumeHandler(null, { sessionId: 9 })).toEqual({
      success: true,
      state: resumed,
    });
  });

  test("end-sim stops the session and returns final state", async () => {
    const { mockIpcHandle, simulationMocks } =
      await loadMainWithScenarioMocks();
    const finalState = { status: "ended" };
    simulationMocks.endSession.mockReturnValueOnce(finalState);

    const handler = findHandler(mockIpcHandle, "end-sim");
    const result = await handler(null, { sessionId: 5 });

    expect(simulationMocks.endSession).toHaveBeenCalledWith(5, {
      reason: "user_end",
    });
    expect(result).toEqual({ success: true, state: finalState });
  });
});

describe("documentation IPC handlers", () => {
  test("add-note stores note via data model", async () => {
    const { mockIpcHandle, sessionMocks, simulationMocks } =
      await loadMainWithScenarioMocks();
    simulationMocks.getSession.mockReturnValueOnce({ id: 7 });
    const savedNote = { id: 1, content: "note" };
    sessionMocks.addSessionNote.mockReturnValueOnce(savedNote);

    const handler = findHandler(mockIpcHandle, "add-note");
    const payload = {
      sessionId: 5,
      userId: 3,
      content: "note",
      vitalsSnapshot: { heartRate: 90 },
    };
    const result = await handler(null, payload);

    expect(simulationMocks.getSession).toHaveBeenCalledWith(5);
    expect(sessionMocks.addSessionNote).toHaveBeenCalledWith(payload);
    expect(result).toEqual({ success: true, note: savedNote });
  });

  test("get-notes returns session notes", async () => {
    const { mockIpcHandle, sessionMocks } = await loadMainWithScenarioMocks();
    const notes = [{ id: 1, content: "note" }];
    sessionMocks.getSessionNotes.mockReturnValueOnce(notes);

    const handler = findHandler(mockIpcHandle, "get-notes");
    const result = await handler(null, { sessionId: 3 });

    expect(sessionMocks.getSessionNotes).toHaveBeenCalledWith(3);
    expect(result).toEqual({ success: true, notes });
  });

  test("delete-note removes note when authorized", async () => {
    const { mockIpcHandle, sessionMocks } = await loadMainWithScenarioMocks();
    const note = { id: 2, content: "note" };
    sessionMocks.deleteSessionNote.mockReturnValueOnce(note);

    const handler = findHandler(mockIpcHandle, "delete-note");
    const result = await handler(null, { noteId: 2, userId: 3 });

    expect(sessionMocks.deleteSessionNote).toHaveBeenCalledWith({
      noteId: 2,
      userId: 3,
    });
    expect(result).toEqual({ success: true, note });
  });
});
