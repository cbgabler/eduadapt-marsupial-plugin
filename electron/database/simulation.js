import { getDb } from './database.js';
import { getScenarioById } from './models/scenarios.js';

const DEFAULT_TICK_INTERVAL_MS = 5000;
const DEFAULT_VITAL_RANGES = {
  heartRate: { min: 30, max: 180 },
  respiratoryRate: { min: 5, max: 50 },
  temperature: { min: 92, max: 107 },
  oxygenSaturation: { min: 70, max: 100 },
  bloodGlucose: { min: 60, max: 250 },
  bloodPressure: {
    systolic: { min: 70, max: 220 },
    diastolic: { min: 40, max: 140 },
  },
};

const sessions = new Map();
const DEFAULT_TARGET_STATUS = {
  configured: false,
  met: false,
  description: null,
  holdTicksRequired: 0,
  consecutiveTicks: 0,
};

// Creates a simulation session in memory + DB, then starts the tick loop.
export function startSession(scenarioId, userId) {
  const db = getDb();

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const scenario = getScenarioById(scenarioId);
  if (!scenario) {
    throw new Error('Scenario not found');
  }

  const startedAt = new Date().toISOString();
  const result = db
    .prepare(
      'INSERT INTO sessions (scenarioId, userId, started) VALUES (?, ?, ?)'
    )
    .run(scenarioId, userId, startedAt);

  const sessionId = result.lastInsertRowid;
  const simulationConfig = buildSimulationConfig(scenario.definition);
  const state = createInitialState({
    sessionId,
    scenario,
    userId,
    startedAt,
    simulationConfig,
  });

  const interval = startTickLoop(sessionId, simulationConfig.tickIntervalMs);
  sessions.set(sessionId, {
    ...state,
    simulationConfig,
    interval,
    scenario,
    targetHoldCount: 0,
    targetStatus: DEFAULT_TARGET_STATUS,
    completionReason: null,
    completionReasonCode: null,
  });

  return { sessionId, state: formatState(sessions.get(sessionId)) };
}

// Returns a snapshot of the current session state (no mutation).
export function getSessionState(sessionId) {
  const session = getActiveSession(sessionId);
  return formatState(session);
}

// Validates and updates a medication's dose for the running session.
export function adjustMedication(sessionId, medicationId, newDose) {
  const session = getActiveSession(sessionId);
  const medState = session.medicationState[medicationId];
  if (!medState) {
    throw new Error('Medication not found in session');
  }

  if (typeof newDose !== 'number' || Number.isNaN(newDose)) {
    throw new Error('Dose must be a number');
  }

  if (medState.min !== null && newDose < medState.min) {
    throw new Error('Dose below allowed minimum');
  }

  if (medState.max !== null && newDose > medState.max) {
    throw new Error('Dose above allowed maximum');
  }

  medState.dose = Number(newDose);
  session.updatedAt = new Date().toISOString();

  return formatState(session);
}

// Stops the tick timer without finalizing the session.
export function pauseSession(sessionId) {
  const session = getActiveSession(sessionId);
  if (session.status !== 'running') {
    return formatState(session);
  }
  if (session.interval) {
    clearInterval(session.interval);
    session.interval = null;
  }
  session.status = 'paused';
  session.updatedAt = new Date().toISOString();
  return formatState(session);
}

// Restarts the tick timer after a pause.
export function resumeSession(sessionId) {
  const session = getActiveSession(sessionId);
  if (session.status !== 'paused') {
    return formatState(session);
  }
  session.interval = startTickLoop(
    sessionId,
    session.simulationConfig.tickIntervalMs
  );
  session.status = 'running';
  session.updatedAt = new Date().toISOString();
  return formatState(session);
}

// Finalizes the session (from user action or auto-completion).
export function endSession(sessionId, options = {}) {
  const db = getDb();
  const session = getActiveSession(sessionId);

  const endedAt = new Date().toISOString();
  db.prepare('UPDATE sessions SET ended = ? WHERE id = ?').run(
    endedAt,
    sessionId
  );

  if (session.interval) {
    clearInterval(session.interval);
    session.interval = null;
  }

  session.status = 'ended';
  session.endedAt = endedAt;
  session.updatedAt = endedAt;
  session.completionReasonCode =
    options.reason ?? session.completionReasonCode ?? 'manual';
  if (options.message) {
    session.completionReason = options.message;
  } else if (!session.completionReason) {
    session.completionReason =
      session.completionReasonCode === 'targets_met'
        ? 'Scenario targets achieved'
        : 'Ended by user';
  }

  return formatState(session);
}

// Reads a session metadata row directly from SQLite.
export function getSession(sessionId) {
  const db = getDb();
  return db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
}

// Lists all sessions for a given user ordered by start time.
export function getUserSessions(userId) {
  const db = getDb();
  return db
    .prepare('SELECT * FROM sessions WHERE userId = ? ORDER BY started DESC')
    .all(userId);
}

// Creates the setInterval loop that drives the simulation.
function startTickLoop(sessionId, intervalMs = DEFAULT_TICK_INTERVAL_MS) {
  return setInterval(() => processTick(sessionId), intervalMs);
}

// Helper to assert that a session exists in memory.
function getActiveSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  return session;
}

// Builds the initial state object using the scenario definition.
function createInitialState({
  sessionId,
  scenario,
  userId,
  startedAt,
  simulationConfig,
}) {
  const currentVitals = deepClone(
    scenario.definition?.vitals?.current ?? {
      bloodPressure: { systolic: 120, diastolic: 80 },
      heartRate: 80,
      respiratoryRate: 18,
      temperature: 98.6,
      oxygenSaturation: 98,
      painLevel: 0,
    }
  );
  if (!currentVitals.bloodPressure) {
    currentVitals.bloodPressure = { systolic: 120, diastolic: 80 };
  } else {
    currentVitals.bloodPressure = {
      systolic:
        typeof currentVitals.bloodPressure.systolic === 'number'
          ? currentVitals.bloodPressure.systolic
          : 120,
      diastolic:
        typeof currentVitals.bloodPressure.diastolic === 'number'
          ? currentVitals.bloodPressure.diastolic
          : 80,
    };
  }

  const medications = deepClone(scenario.definition?.medications ?? []);
  const medicationState = createMedicationState(medications);
  const orders = deepClone(scenario.definition?.orders ?? []);

  return {
    sessionId,
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    userId,
    status: 'running',
    tickCount: 0,
    startedAt,
    updatedAt: startedAt,
    currentVitals,
    medications,
    medicationState,
    orders,
  };
}

// Single tick: apply drift, meds, clamp vitals, and check targets.
function processTick(sessionId) {
  const session = sessions.get(sessionId);
  if (!session || session.status !== 'running') {
    return;
  }

  const vitals = deepClone(session.currentVitals);
  const { simulationConfig } = session;

  applyBaselineDrift(vitals, simulationConfig.baselineDrift);
  applyMedicationEffects(vitals, session);
  clampVitals(vitals, simulationConfig.vitalRanges);

  session.currentVitals = vitals;
  session.updatedAt = new Date().toISOString();
  session.tickCount += 1;

  const targetStatus = evaluateTargets(session);
  session.targetStatus = targetStatus;
  if (
    targetStatus.met &&
    session.status === 'running' &&
    session.completionReasonCode !== 'targets_met'
  ) {
    session.completionReason =
      targetStatus.description || 'Target goals achieved';
    endSession(sessionId, {
      reason: 'targets_met',
      message: session.completionReason,
    });
  }
}

// Adds baseline drift adjustments for each tick.
function applyBaselineDrift(vitals, drift = {}) {
  Object.entries(drift).forEach(([key, value]) => {
    if (key === 'bloodPressure' && typeof value === 'object') {
      if (typeof value.systolic === 'number') {
        vitals.bloodPressure.systolic += value.systolic;
      }
      if (typeof value.diastolic === 'number') {
        vitals.bloodPressure.diastolic += value.diastolic;
      }
      return;
    }

    if (typeof value === 'number' && typeof vitals[key] === 'number') {
      vitals[key] += value;
    }
  });
}

// Applies medication effect deltas based on current dose.
function applyMedicationEffects(vitals, session) {
  const effects = session.simulationConfig.medicationEffects ?? {};
  Object.entries(effects).forEach(([medicationId, effect]) => {
    const medState = session.medicationState[medicationId];
    if (!medState) {
      return;
    }

    const delta =
      medState.dose - (effect.referenceDose ?? medState.dose ?? 0);
    const perUnitChange = effect.perUnitChange ?? {};
    applyDelta(vitals, perUnitChange, delta);
  });
}

// Recursively adds deltaDefinition * multiplier into the target object.
function applyDelta(target, deltaDefinition, multiplier = 1) {
  Object.entries(deltaDefinition).forEach(([key, value]) => {
    if (typeof value === 'object' && !Array.isArray(value)) {
      if (!target[key]) {
        target[key] = {};
      }
      applyDelta(target[key], value, multiplier);
      return;
    }

    if (typeof value === 'number' && typeof target[key] === 'number') {
      target[key] += value * multiplier;
    }
  });
}

// Prevents vitals from going outside defined physiological ranges.
function clampVitals(vitals, ranges = {}) {
  const mergedRanges = mergeVitalRanges(ranges);
  Object.entries(mergedRanges).forEach(([key, limits]) => {
    if (key === 'bloodPressure') {
      if (!vitals.bloodPressure) {
        return;
      }
      vitals.bloodPressure.systolic = clampValue(
        vitals.bloodPressure.systolic,
        limits.systolic
      );
      vitals.bloodPressure.diastolic = clampValue(
        vitals.bloodPressure.diastolic,
        limits.diastolic
      );
      return;
    }

    if (typeof vitals[key] === 'number') {
      vitals[key] = clampValue(vitals[key], limits);
    }
  });
}

// Merges defaults with scenario-specific range overrides.
function mergeVitalRanges(overrides = {}) {
  return {
    ...DEFAULT_VITAL_RANGES,
    ...overrides,
    bloodPressure: {
      ...DEFAULT_VITAL_RANGES.bloodPressure,
      ...(overrides.bloodPressure ?? {}),
      systolic: {
        ...DEFAULT_VITAL_RANGES.bloodPressure.systolic,
        ...(overrides.bloodPressure?.systolic ?? {}),
      },
      diastolic: {
        ...DEFAULT_VITAL_RANGES.bloodPressure.diastolic,
        ...(overrides.bloodPressure?.diastolic ?? {}),
      },
    },
  };
}

// Enforces a numeric value within [min, max] bounds.
function clampValue(value, range) {
  if (!range) return value;
  const min = typeof range.min === 'number' ? range.min : -Infinity;
  const max = typeof range.max === 'number' ? range.max : Infinity;
  return Math.min(Math.max(value, min), max);
}

// Normalizes medication list into fast lookup state for titrations.
function createMedicationState(medications) {
  return medications.reduce((acc, medication) => {
    const titration = medication.titration || {};
    const parsedDose = parseDoseValue(medication.dosage);
    acc[medication.id] = {
      name: medication.name,
      unit: titration.unit || parsedDose.unit || null,
      min: typeof titration.min === 'number' ? titration.min : null,
      max: typeof titration.max === 'number' ? titration.max : null,
      step: typeof titration.step === 'number' ? titration.step : null,
      dose:
        typeof titration.current === 'number'
          ? titration.current
          : parsedDose.value,
    };
    return acc;
  }, {});
}

// Extracts a numeric value and unit from a free-form dose string.
function parseDoseValue(doseString) {
  if (typeof doseString !== 'string') {
    return { value: 0, unit: null };
  }
  const [valuePart, unit] = doseString.trim().split(/\s+/);
  const value = Number.parseFloat(valuePart);
  return { value: Number.isFinite(value) ? value : 0, unit: unit ?? null };
}

// Pulls reusable simulation config (drift, ranges, targets, etc.).
function buildSimulationConfig(definition = {}) {
  const simulation = definition?.simulation ?? {};
  return {
    tickIntervalMs: simulation.tickIntervalMs ?? DEFAULT_TICK_INTERVAL_MS,
    baselineDrift: simulation.baselineDrift ?? {},
    medicationEffects: simulation.medicationEffects ?? {},
    vitalRanges: simulation.vitalRanges ?? {},
    targets: normalizeTargets(simulation.targets),
  };
}

// Safe JSON clone helper for returning serializable state.
function deepClone(payload) {
  return payload ? JSON.parse(JSON.stringify(payload)) : payload;
}

// Serializes the internal session object for IPC responses.
function formatState(session) {
  return {
    sessionId: session.sessionId,
    scenarioId: session.scenarioId,
    scenarioName: session.scenarioName,
    userId: session.userId,
    status: session.status,
    startedAt: session.startedAt,
    updatedAt: session.updatedAt,
    endedAt: session.endedAt ?? null,
    tickCount: session.tickCount,
    tickIntervalMs: session.simulationConfig.tickIntervalMs,
    currentVitals: deepClone(session.currentVitals),
    medications: deepClone(session.medications),
    medicationState: deepClone(session.medicationState),
    orders: deepClone(session.orders),
    targetStatus: session.targetStatus ?? DEFAULT_TARGET_STATUS,
    completionReason: session.completionReason,
    completionReasonCode: session.completionReasonCode,
  };
}

// Ensures target definitions always have sane defaults.
function normalizeTargets(targets) {
  if (!targets) return null;
  return {
    holdTicks: Number.isFinite(Number(targets.holdTicks))
      ? Number(targets.holdTicks)
      : 1,
    description: targets.description ?? null,
    vitals: targets.vitals ?? null,
  };
}

// Determines whether the session currently satisfies its goals.
function evaluateTargets(session) {
  const config = session.simulationConfig.targets;
  if (!config || !config.vitals) {
    return DEFAULT_TARGET_STATUS;
  }

  const vitalsMet = vitalsMeetTargets(
    session.currentVitals,
    config.vitals ?? {}
  );

  session.targetHoldCount = vitalsMet
    ? (session.targetHoldCount ?? 0) + 1
    : 0;

  const requiredTicks = Math.max(config.holdTicks ?? 1, 1);
  const met = vitalsMet && session.targetHoldCount >= requiredTicks;

  return {
    configured: true,
    vitalsMet,
    met,
    holdTicksRequired: requiredTicks,
    consecutiveTicks: session.targetHoldCount,
    description: config.description,
  };
}

// Checks if the current vitals match the configured target ranges.
function vitalsMeetTargets(vitals = {}, targets = {}) {
  return Object.entries(targets).every(([key, targetRange]) => {
    if (key === 'bloodPressure') {
      if (!vitals.bloodPressure) {
        return false;
      }
      return (
        valueWithinRange(vitals.bloodPressure.systolic, targetRange.systolic) &&
        valueWithinRange(vitals.bloodPressure.diastolic, targetRange.diastolic)
      );
    }
    return valueWithinRange(vitals[key], targetRange);
  });
}

// Utility to check a number against an optional {min,max} object.
function valueWithinRange(value, range = {}) {
  if (typeof value !== 'number') {
    return false;
  }
  const min = typeof range.min === 'number' ? range.min : -Infinity;
  const max = typeof range.max === 'number' ? range.max : Infinity;
  return value >= min && value <= max;
}

