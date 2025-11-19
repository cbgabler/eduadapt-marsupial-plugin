import { useEffect, useRef, useState } from "react";
import "./Scenarios.css";
import { buildVitalSummary } from "./utils/simulationFormatting.js";

const POLL_INTERVAL_MS = 2500;

function Scenarios() {
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [sessionError, setSessionError] = useState(null);
  const [userIdInput, setUserIdInput] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const pollingRef = useRef(null);
  const [doseInputs, setDoseInputs] = useState({});

  const electronApiAvailable =
    typeof window !== "undefined" && window.api && window.api.getAllScenarios;

  useEffect(() => {
    loadScenarios();
  }, []);

  useEffect(() => {
    if (!selectedScenario && scenarios.length > 0) {
      setSelectedScenario(scenarios[0]);
    }
  }, [scenarios, selectedScenario]);

  useEffect(() => {
    return () => stopPolling();
  }, []);

  useEffect(() => {
    if (!activeSession?.state?.medicationState) {
      setDoseInputs({});
      return;
    }
    setDoseInputs((prev) => {
      const next = {};
      Object.entries(activeSession.state.medicationState).forEach(
        ([id, medState]) => {
          next[id] =
            prev[id] ??
            (typeof medState.dose === "number" ? medState.dose : "");
        }
      );
      return next;
    });
  }, [activeSession?.state?.medicationState]);

  useEffect(() => {
    if (activeSession?.state?.status === "ended") {
      stopPolling();
    }
  }, [activeSession?.state?.status]);

  async function loadScenarios() {
    if (!electronApiAvailable) {
      setError("Electron IPC bridge unavailable. Please run via Electron.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.getAllScenarios();
      if (response.success) {
        setScenarios(response.scenarios ?? []);
      } else {
        setError(response.error || "Failed to load scenarios");
      }
    } catch (err) {
      setError(err.message || "Failed to load scenarios");
    } finally {
      setLoading(false);
    }
  }

  function stopPolling() {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }

  function startPolling(sessionId) {
    stopPolling();
    pollingRef.current = setInterval(() => {
      refreshSessionState(sessionId);
    }, POLL_INTERVAL_MS);
  }

  async function refreshSessionState(sessionId) {
    if (!window.api?.getSimulationState) return;
    try {
      const response = await window.api.getSimulationState(sessionId);
      if (response.success) {
        setActiveSession((prev) => ({
          sessionId,
          state: response.state,
          userId: prev?.userId ?? null,
        }));
        if (response.state.status === "ended") {
          stopPolling();
        }
      } else {
        setSessionError(response.error || "Failed to read simulation state");
        stopPolling();
      }
    } catch (err) {
      setSessionError(err.message || "Failed to read simulation state");
      stopPolling();
    }
  }

  async function handleStartSimulation() {
    setSessionError(null);
    if (!selectedScenario) {
      setSessionError("Select a scenario first.");
      return;
    }
    const parsedUserId = Number.parseInt(userIdInput, 10);
    if (!Number.isFinite(parsedUserId) || parsedUserId <= 0) {
      setSessionError("Enter a valid numeric user ID.");
      return;
    }
    if (!window.api?.startSimulation) {
      setSessionError("Simulation IPC channel unavailable.");
      return;
    }
    setIsStarting(true);
    try {
      const response = await window.api.startSimulation({
        scenarioId: selectedScenario.id,
        userId: parsedUserId,
      });
      if (response.success) {
        setActiveSession({
          sessionId: response.sessionId,
          state: response.state,
          userId: parsedUserId,
        });
        startPolling(response.sessionId);
      } else {
        setSessionError(response.error || "Unable to start simulation");
      }
    } catch (err) {
      setSessionError(err.message || "Unable to start simulation");
    } finally {
      setIsStarting(false);
    }
  }

  async function handlePause() {
    if (!activeSession || !window.api?.pauseSimulation) return;
    try {
      const response = await window.api.pauseSimulation(
        activeSession.sessionId
      );
      if (response.success) {
        setActiveSession((prev) => ({
          ...prev,
          state: response.state,
        }));
      } else {
        setSessionError(response.error || "Unable to pause simulation");
      }
    } catch (err) {
      setSessionError(err.message || "Unable to pause simulation");
    }
  }

  async function handleResume() {
    if (!activeSession || !window.api?.resumeSimulation) return;
    try {
      const response = await window.api.resumeSimulation(
        activeSession.sessionId
      );
      if (response.success) {
        setActiveSession((prev) => ({
          ...prev,
          state: response.state,
        }));
      } else {
        setSessionError(response.error || "Unable to resume simulation");
      }
    } catch (err) {
      setSessionError(err.message || "Unable to resume simulation");
    }
  }

  async function handleEnd() {
    if (!activeSession || !window.api?.endSimulation) return;
    try {
      const response = await window.api.endSimulation(activeSession.sessionId);
      if (response.success) {
        setActiveSession((prev) => ({
          ...prev,
          state: response.state,
        }));
        stopPolling();
      } else {
        setSessionError(response.error || "Unable to end simulation");
      }
    } catch (err) {
      setSessionError(err.message || "Unable to end simulation");
    }
  }

  async function handleAdjustMedication(medicationId) {
    if (!activeSession || !window.api?.adjustMedication) return;
    const desiredDose = Number.parseFloat(doseInputs[medicationId]);
    if (!Number.isFinite(desiredDose)) {
      setSessionError("Enter a valid numeric dose.");
      return;
    }
    try {
      const response = await window.api.adjustMedication({
        sessionId: activeSession.sessionId,
        medicationId,
        newDose: desiredDose,
      });
      if (response.success) {
        setActiveSession((prev) => ({
          ...prev,
          state: response.state,
        }));
        setSessionError(null);
      } else {
        setSessionError(response.error || "Unable to adjust medication");
      }
    } catch (err) {
      setSessionError(err.message || "Unable to adjust medication");
    }
  }

  if (loading) {
    return (
      <div className="page-container scenarios-page">
        <p>Loading scenarios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container scenarios-page">
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={loadScenarios}>Retry</button>
        </div>
      </div>
    );
  }

  const definition = selectedScenario?.definition ?? {};
  const patient = definition.patient ?? {};
  const learningObjectives = definition.learningObjectives ?? [];
  const medications = definition.medications ?? [];
  const vitalsSummary = buildVitalSummary(definition.vitals?.current);

  return (
    <div className="page-container scenarios-page">
      <div className="scenarios-header">
        <h1>Simulation Scenarios</h1>
        <p>Select a patient story and launch the backend simulation engine.</p>
      </div>

      <div className="scenarios-layout">
        <div className="scenarios-grid">
          {scenarios.length === 0 && (
            <div className="empty-state">
              <p>No scenarios found. Create one in the Electron backend.</p>
            </div>
          )}
          {scenarios.map((scenario) => (
            <article
              key={scenario.id}
              className={`scenario-card ${
                selectedScenario?.id === scenario.id ? "active" : ""
              }`}
              onClick={() => setSelectedScenario(scenario)}
            >
              <h3>{scenario.name}</h3>
              <small>
                {scenario.definition?.metadata?.difficulty || "Unscored"}
              </small>
              {scenario.definition?.patient?.primaryDiagnosis && (
                <p>{scenario.definition.patient.primaryDiagnosis}</p>
              )}
            </article>
          ))}
        </div>

        <aside className="scenario-details-panel">
          {selectedScenario ? (
            <>
              <h2>{selectedScenario.name}</h2>
              <div className="details-section details-list">
                <div>
                  <strong>Patient:</strong> {patient.name || "Unknown"}{" "}
                  {patient.age && `• ${patient.age} yrs`}{" "}
                  {patient.gender && `• ${patient.gender}`}
                </div>
                {patient.primaryDiagnosis && (
                  <div>
                    <strong>Diagnosis:</strong> {patient.primaryDiagnosis}
                  </div>
                )}
              </div>

              {vitalsSummary.length > 0 && (
                <div className="details-section details-list">
                  <strong>Current Vitals</strong>
                  {vitalsSummary.map((vital) => (
                    <span key={vital.label}>
                      {vital.label}: {vital.value}
                    </span>
                  ))}
                </div>
              )}

              {medications.length > 0 && (
                <div className="details-section details-list">
                  <strong>Medications</strong>
                  {medications.map((med) => (
                    <span key={med.id}>
                      {med.name} - {med.dosage}
                      {med.route ? ` ${med.route}` : ""}{" "}
                      {med.frequency ? `(${med.frequency})` : ""}
                    </span>
                  ))}
                </div>
              )}

              {learningObjectives.length > 0 && (
                <div className="details-section details-list">
                  <strong>Learning Objectives</strong>
                  <ul>
                    {learningObjectives.map((objective) => (
                      <li key={objective}>{objective}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="start-controls">
                <label htmlFor="user-id-input">
                  Enter your user ID to launch the simulation
                </label>
                <input
                  id="user-id-input"
                  type="number"
                  value={userIdInput}
                  onChange={(event) => setUserIdInput(event.target.value)}
                  placeholder="e.g. 1"
                />
                <button
                  disabled={isStarting}
                  onClick={handleStartSimulation}
                >
                  {isStarting ? "Starting…" : "Start Simulation"}
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>Select a scenario to see details.</p>
            </div>
          )}
        </aside>
      </div>

      {activeSession?.state && (
      <section className="simulation-panel">
        <h2>Live Simulation</h2>
        <div className="simulation-meta">
          <span className="session-pill">
            Session #{activeSession.sessionId} -{" "}
            {activeSession.state.status?.toUpperCase()}
          </span>
          <span className="session-pill">
            Tick Count: {activeSession.state.tickCount}
          </span>
          <span className="session-pill">
            Interval: {activeSession.state.tickIntervalMs}ms
          </span>
        </div>

        {activeSession.state.targetStatus?.configured && (
          <div
            className={`target-banner ${
              activeSession.state.targetStatus.met ? "met" : ""
            }`}
          >
            <strong>Goal:</strong>{" "}
            {activeSession.state.targetStatus.description ||
              "Follow scenario target"}
            <div className="target-progress">
              Progress:{" "}
              {Math.min(
                activeSession.state.targetStatus.consecutiveTicks,
                activeSession.state.targetStatus.holdTicksRequired
              )}
              /{activeSession.state.targetStatus.holdTicksRequired} consecutive
              ticks in range
            </div>
          </div>
        )}

        <div className="vitals-grid">
          {buildVitalSummary(activeSession.state.currentVitals).map(
            (vital) => (
              <div className="vital-card" key={vital.label}>
                <span>{vital.label}</span>
                  <strong>{vital.value}</strong>
                </div>
              )
            )}
          </div>

          {activeSession.state.medications?.length > 0 && (
            <div className="medications-panel">
              <h3>Medication Titration</h3>
              {activeSession.state.medications.map((med) => {
                const medState =
                  activeSession.state.medicationState?.[med.id];
                return (
                  <div key={med.id} className="medication-row">
                    <div>
                      <strong>{med.name}</strong> - {med.dosage}
                      {medState?.unit && ` (${medState.unit})`}
                      {typeof medState?.min === "number" &&
                        typeof medState?.max === "number" && (
                          <div>
                            Range: {medState.min} - {medState.max}{" "}
                            {medState.unit}
                          </div>
                        )}
                      <div>
                        Current Dose:{" "}
                        {typeof medState?.dose === "number"
                          ? medState.dose
                          : "N/A"}{" "}
                        {medState?.unit ?? ""}
                      </div>
                    </div>
                    {medState && (
                      <div className="medication-controls">
                        <input
                          type="number"
                          step={medState.step ?? 1}
                          value={doseInputs[med.id] ?? ""}
                          onChange={(event) =>
                            setDoseInputs((prev) => ({
                              ...prev,
                              [med.id]: event.target.value,
                            }))
                          }
                        />
                        <button
                          onClick={() => handleAdjustMedication(med.id)}
                        >
                          Apply
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="simulation-controls">
            <button className="pause" onClick={handlePause}>
              Pause
            </button>
            <button className="resume" onClick={handleResume}>
              Resume
            </button>
            <button className="end" onClick={handleEnd}>
              End
            </button>
          </div>

          {activeSession.state.completionReason && (
            <div className="completion-banner">
              {activeSession.state.completionReason}
            </div>
          )}

          {sessionError && (
            <div className="error-banner">
              <p>{sessionError}</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default Scenarios;
