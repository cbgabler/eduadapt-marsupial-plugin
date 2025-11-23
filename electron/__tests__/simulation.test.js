import { jest } from "@jest/globals";

const mockDb = { prepare: jest.fn() };
const mockGetDb = jest.fn(() => mockDb);
const mockGetScenarioById = jest.fn();

const baseScenario = {
  id: 22,
  name: "Test Scenario",
  definition: {
    vitals: {
      current: {
        bloodPressure: { systolic: 150, diastolic: 95 },
        heartRate: 90,
        respiratoryRate: 18,
      },
    },
    medications: [
      {
        id: "med-linear",
        name: "TestMed",
        dosage: "10 mg",
        titration: {
          min: 0,
          max: 20,
          step: 1,
          unit: "mg",
          current: 10,
        },
      },
    ],
    simulation: {
      tickIntervalMs: 1000,
      baselineDrift: {
        bloodPressure: { systolic: -2, diastolic: -1 },
        heartRate: -1,
      },
      medicationEffects: {
        "med-linear": {
          referenceDose: 10,
          perUnitChange: {
            bloodPressure: { systolic: -0.5, diastolic: -0.25 },
            heartRate: -0.2,
          },
        },
      },
      vitalRanges: {
        bloodPressure: {
          systolic: { min: 120, max: 200 },
          diastolic: { min: 70, max: 120 },
        },
        heartRate: { min: 60, max: 120 },
      },
      targets: {
        description: "Lower heart rate below 85 bpm for 2 ticks",
        holdTicks: 2,
        vitals: {
          heartRate: { max: 85 },
        },
      },
    },
  },
};

let startSession;
let getSessionState;
let adjustMedication;
let pauseSession;
let resumeSession;
let endSession;

let selectUserStmt;
let insertSessionStmt;
let updateSessionStmt;
let sessionIdCounter = 1;

function cloneScenario() {
  return JSON.parse(JSON.stringify(baseScenario));
}

async function loadSimulationModule() {
  jest.resetModules();
  await jest.unstable_mockModule("../database/database.js", () => ({
    getDb: mockGetDb,
  }));
  await jest.unstable_mockModule("../database/models/scenarios.js", () => ({
    getScenarioById: mockGetScenarioById,
  }));
  const module = await import("../database/simulation.js");
  startSession = module.startSession;
  getSessionState = module.getSessionState;
  adjustMedication = module.adjustMedication;
  pauseSession = module.pauseSession;
  resumeSession = module.resumeSession;
  endSession = module.endSession;
}

beforeEach(async () => {
  sessionIdCounter = 1;
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2024-01-01T00:00:00Z"));
  mockDb.prepare = jest.fn();
  selectUserStmt = { get: jest.fn(() => ({ id: 7 })) };
  insertSessionStmt = {
    run: jest.fn(() => ({ lastInsertRowid: sessionIdCounter++ })),
  };
  updateSessionStmt = { run: jest.fn(() => ({ changes: 1 })) };
  mockDb.prepare.mockImplementation((sql) => {
    if (sql.includes("FROM users")) {
      return selectUserStmt;
    }
    if (sql.startsWith("INSERT INTO sessions")) {
      return insertSessionStmt;
    }
    if (sql.startsWith("UPDATE sessions")) {
      return updateSessionStmt;
    }
    return {
      get: jest.fn(),
      run: jest.fn(),
      all: jest.fn(),
    };
  });

  mockGetScenarioById.mockImplementation(() => cloneScenario());
  await loadSimulationModule();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  mockGetScenarioById.mockReset();
});

describe("simulation session manager", () => {
  test("startSession seeds vitals and tick loop advances baseline drift", () => {
    const { sessionId, state } = startSession(22, 7);
    expect(state.sessionId).toBe(sessionId);
    expect(state.currentVitals.heartRate).toBe(90);

    jest.advanceTimersByTime(1000);
    const updated = getSessionState(sessionId);
    expect(updated.tickCount).toBe(1);
    expect(updated.currentVitals.heartRate).toBeCloseTo(89, 5);
  });

  test("adjustMedication updates doses and impacts vitals on the next tick", () => {
    const { sessionId } = startSession(22, 7);
    adjustMedication(sessionId, "med-linear", 15);
    jest.advanceTimersByTime(1000);

    const state = getSessionState(sessionId);
    expect(state.medicationState["med-linear"].dose).toBe(15);
    expect(state.currentVitals.bloodPressure.systolic).toBeCloseTo(145.5, 2);
  });

  test("pause and resume correctly control tick processing", () => {
    const { sessionId } = startSession(22, 7);
    pauseSession(sessionId);
    jest.advanceTimersByTime(1000);
    let state = getSessionState(sessionId);
    expect(state.tickCount).toBe(0);

    resumeSession(sessionId);
    jest.advanceTimersByTime(1000);
    state = getSessionState(sessionId);
    expect(state.tickCount).toBe(1);
  });

  test("endSession stops the tick loop and updates persistence", () => {
    const { sessionId } = startSession(22, 7);
    const finalState = endSession(sessionId);

    expect(finalState.status).toBe("ended");
    expect(updateSessionStmt.run).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(2000);
    const snapshot = getSessionState(sessionId);
    expect(snapshot.tickCount).toBe(finalState.tickCount);
    expect(snapshot.status).toBe("ended");
  });

  test("session auto-ends when target vitals are achieved", () => {
    const { sessionId } = startSession(22, 7);
    // heart rate drops 1 bpm per tick; need 2 ticks <=85 with holdTicks=2
    jest.advanceTimersByTime(6000);

    const state = getSessionState(sessionId);
    expect(state.status).toBe("ended");
    expect(state.completionReasonCode).toBe("targets_met");
    expect(state.targetStatus.met).toBe(true);
  });
});
