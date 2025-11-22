import { useEffect, useRef, useState } from "react";
import "./Scenarios.css";
import { buildVitalSummary } from "../utils/simulationFormatting.js";

const POLL_INTERVAL_MS = 2500;

function formatNoteTimestamp(timestamp) {
  if (!timestamp) {
    return "";
  }
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return timestamp;
  }
}

function Scenarios() {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [activeScenario, setActiveScenario] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [sessionError, setSessionError] = useState(null);
  const [startError, setStartError] = useState(null);
  const [userIdInput, setUserIdInput] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [doseInputs, setDoseInputs] = useState({});
  const [notes, setNotes] = useState([]);
  const [noteContent, setNoteContent] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [noteError, setNoteError] = useState(null);
  const [noteDeletingId, setNoteDeletingId] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const pollingRef = useRef(null);
  const sessionUserIdRef = useRef(null);

  const electronApiAvailable = typeof window !== "undefined" && window.api;

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const refreshSessionState = async (sessionId) => {
    if (!window.api?.getSimulationState) {
      return;
    }
    try {
      const response = await window.api.getSimulationState(sessionId);
      if (response.success) {
        setActiveSession((prev) => ({
          sessionId,
          state: response.state,
          userId: prev?.userId ?? sessionUserIdRef.current ?? null,
        }));
        if (response.state?.status === "ended") {
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
  };

  const startPolling = (sessionId) => {
    stopPolling();
    if (!window.api?.getSimulationState) {
      return;
    }
    pollingRef.current = setInterval(() => {
      refreshSessionState(sessionId);
    }, POLL_INTERVAL_MS);
  };

  const loadScenarios = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!electronApiAvailable || !window.api.getAllScenarios) {
        setError("Electron API not available. Please run this in Electron.");
        setLoading(false);
        return;
      }

      const result = await window.api.getAllScenarios();

      if (result.success) {
        setScenarios(result.scenarios || []);
      } else {
        setError(result.error || "Failed to load scenarios");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleScenarioClick = async (scenarioId) => {
    setStartError(null);
    try {
      if (!window.api || !window.api.getScenario) {
        setError("Electron API not available.");
        return;
      }

      const result = await window.api.getScenario(scenarioId);
      if (result.success) {
        setSelectedScenario(result.scenario);
      } else {
        setError(result.error || "Failed to load scenario details");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
    }
  };

  const closeScenarioDetails = () => {
    setSelectedScenario(null);
    setStartError(null);
  };

  const openImportModal = () => {
    setShowImportModal(true);
  };

  const closeImportModal = () => {
    setShowImportModal(false);
  };

  const openExportModal = () => {
    setShowExportModal(true);
  };

  const closeExportModal = () => {
    setShowExportModal(false);
  };

  const loadNotes = async (sessionId) => {
    if (!window.api?.getNotes || !sessionId) {
      return;
    }
    try {
      const response = await window.api.getNotes(sessionId);
      if (response.success) {
        setNotes(response.notes || []);
        setNoteError(null);
      } else {
        setNoteError(response.error || "Unable to fetch notes");
      }
    } catch (err) {
      setNoteError(err.message || "Unable to fetch notes");
    }
  };

  const handleStartScenario = async (scenario) => {
    if (!scenario) {
      setStartError("Select a scenario to start.");
      return false;
    }
    setStartError(null);
    setSessionError(null);

    const parsedUserId = Number.parseInt(userIdInput, 10);
    if (!Number.isFinite(parsedUserId) || parsedUserId <= 0) {
      setStartError("Enter a valid numeric user ID.");
      return false;
    }

    if (!window.api?.startSimulation) {
      setStartError("Simulation API unavailable in this environment.");
      return false;
    }

    setIsStarting(true);
    try {
      const response = await window.api.startSimulation({
        scenarioId: scenario.id,
        userId: parsedUserId,
      });

      if (response.success) {
        sessionUserIdRef.current = parsedUserId;
        setActiveScenario(scenario);
        setActiveSession({
          sessionId: response.sessionId,
          state: response.state,
          userId: parsedUserId,
        });
        setNotes([]);
        setNoteContent("");
        setNoteError(null);
        setDoseInputs({});
        setSelectedScenario(null);
        startPolling(response.sessionId);
        await loadNotes(response.sessionId);
        return true;
      }

      setStartError(response.error || "Unable to start simulation");
      return false;
    } catch (err) {
      setStartError(err.message || "Unable to start simulation");
      return false;
    } finally {
      setIsStarting(false);
    }
  };

  const handleAddNote = async (event) => {
    event?.preventDefault?.();
    if (!activeSession?.sessionId) {
      setNoteError("Start a scenario before adding notes.");
      return;
    }
    if (!noteContent.trim()) {
      setNoteError("Enter a note before saving.");
      return;
    }
    if (!window.api?.addNote) {
      setNoteError("Notes API unavailable.");
      return;
    }

    setNoteSubmitting(true);
    setNoteError(null);

    try {
      const response = await window.api.addNote({
        sessionId: activeSession.sessionId,
        userId: activeSession.userId,
        content: noteContent,
        vitalsSnapshot: activeSession.state?.currentVitals,
      });

      if (response.success) {
        setNotes((prev) => [...prev, response.note]);
        setNoteContent("");
      } else {
        setNoteError(response.error || "Unable to save note");
      }
    } catch (err) {
      setNoteError(err.message || "Unable to save note");
    } finally {
      setNoteSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.api?.deleteNote || !noteId) {
      return;
    }
    setNoteDeletingId(noteId);
    setNoteError(null);

    try {
      const response = await window.api.deleteNote({
        noteId,
        userId: activeSession?.userId,
      });
      if (response.success) {
        setNotes((prev) => prev.filter((note) => note.id !== noteId));
      } else {
        setNoteError(response.error || "Unable to delete note");
      }
    } catch (err) {
      setNoteError(err.message || "Unable to delete note");
    } finally {
      setNoteDeletingId(null);
    }
  };

  const handleAdjustMedication = async (medicationId) => {
    if (!activeSession?.sessionId || !window.api?.adjustMedication) {
      return;
    }
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
        setActiveSession((prev) =>
          prev
            ? {
                ...prev,
                state: response.state,
              }
            : prev
        );
        setSessionError(null);
      } else {
        setSessionError(response.error || "Unable to adjust medication");
      }
    } catch (err) {
      setSessionError(err.message || "Unable to adjust medication");
    }
  };

  const handlePause = async () => {
    if (!activeSession?.sessionId || !window.api?.pauseSimulation) {
      return;
    }
    try {
      const response = await window.api.pauseSimulation(activeSession.sessionId);
      if (response.success) {
        setActiveSession((prev) =>
          prev
            ? {
                ...prev,
                state: response.state,
              }
            : prev
        );
        setSessionError(null);
      } else {
        setSessionError(response.error || "Unable to pause simulation");
      }
    } catch (err) {
      setSessionError(err.message || "Unable to pause simulation");
    }
  };

  const handleResume = async () => {
    if (!activeSession?.sessionId || !window.api?.resumeSimulation) {
      return;
    }
    try {
      const response = await window.api.resumeSimulation(
        activeSession.sessionId
      );
      if (response.success) {
        setActiveSession((prev) =>
          prev
            ? {
                ...prev,
                state: response.state,
              }
            : prev
        );
        setSessionError(null);
      } else {
        setSessionError(response.error || "Unable to resume simulation");
      }
    } catch (err) {
      setSessionError(err.message || "Unable to resume simulation");
    }
  };

  const handleEnd = async () => {
    if (!activeSession?.sessionId || !window.api?.endSimulation) {
      return;
    }
    try {
      const response = await window.api.endSimulation(activeSession.sessionId);
      if (response.success) {
        setActiveSession((prev) =>
          prev
            ? {
                ...prev,
                state: response.state,
              }
            : prev
        );
        setSessionError(null);
        stopPolling();
      } else {
        setSessionError(response.error || "Unable to end simulation");
      }
    } catch (err) {
      setSessionError(err.message || "Unable to end simulation");
    }
  };
  useEffect(() => {
    loadScenarios();
  }, []);

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

  useEffect(() => {
    if (activeSession?.sessionId) {
      loadNotes(activeSession.sessionId);
    } else {
      setNotes([]);
    }
  }, [activeSession?.sessionId]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="scenarios-loading">
          <p>Loading scenarios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="scenarios-error">
          <p>Error: {error}</p>
          <button onClick={loadScenarios} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const activeVitals = activeSession?.state
    ? buildVitalSummary(activeSession.state.currentVitals)
    : [];
  const activeMedications = activeSession?.state?.medications || [];
  const patientDetails = activeScenario?.definition?.patient || null;
  const targetStatus = activeSession?.state?.targetStatus;

  return (
    <div className="page-container">
      <div className="scenario-actions">
        <button type="button" onClick={openExportModal}>Export</button>
        <button type="button" onClick={openImportModal}>Import</button>
      </div>
      <div className="scenarios-header">
        <h1>Available Scenarios</h1>
        <p className="scenarios-subtitle">
          Select a scenario to begin practicing with simulated patient cases
        </p>
      </div>

      {scenarios.length === 0 ? (
        <div className="scenarios-empty">
          <p>
            No scenarios available. Scenarios will appear here once created.
          </p>
        </div>
      ) : (
        <div className="scenarios-grid">
          {scenarios.map((scenario) => {
            const definition = scenario.definition || {};
            const metadata = definition.metadata || {};
            const patient = definition.patient || {};

            return (
              <div
                key={scenario.id}
                className="scenario-card"
                onClick={() => handleScenarioClick(scenario.id)}
              >
                <div className="scenario-card-header">
                  <h3>{scenario.name}</h3>
                  {metadata.difficulty && (
                    <span
                      className={`difficulty-badge difficulty-${metadata.difficulty.toLowerCase()}`}
                    >
                      {metadata.difficulty}
                    </span>
                  )}
                </div>

                {patient.name && (
                  <div className="scenario-patient-info">
                    <p className="patient-name">
                      <strong>Patient:</strong> {patient.name}
                    </p>
                    {patient.age && patient.gender && (
                      <p className="patient-demo">
                        {patient.age} years old, {patient.gender}
                      </p>
                    )}
                  </div>
                )}

                {patient.primaryDiagnosis && (
                  <div className="scenario-diagnosis">
                    <p>
                      <strong>Diagnosis:</strong> {patient.primaryDiagnosis}
                    </p>
                  </div>
                )}

                {metadata.specialty && (
                  <div className="scenario-specialty">
                    <p>
                      <strong>Specialty:</strong> {metadata.specialty}
                    </p>
                  </div>
                )}

                {metadata.estimatedDuration && (
                  <div className="scenario-duration">
                    <p>
                      <strong>Duration:</strong> {metadata.estimatedDuration}
                    </p>
                  </div>
                )}

                {metadata.tags && metadata.tags.length > 0 && (
                  <div className="scenario-tags">
                    {metadata.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="scenario-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="scenario-card-footer">
                  <button className="scenario-button">View Details</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeSession?.state && (
        <section className="simulation-panel">
          <div className="simulation-header">
            <div>
              <h2>Active Simulation</h2>
              {activeScenario && (
                <p className="simulation-subtitle">
                  {activeScenario.name}
                  {patientDetails?.name ? ` - Patient ${patientDetails.name}` : ""}
                </p>
              )}
            </div>
            <div className="simulation-meta">
              <span className="session-pill">
                Session #{activeSession.sessionId}
              </span>
              {activeSession.state.status && (
                <span className="session-pill session-status">
                  {activeSession.state.status.toUpperCase()}
                </span>
              )}
              {typeof activeSession.state.tickCount === "number" && (
                <span className="session-pill">
                  Tick: {activeSession.state.tickCount}
                </span>
              )}
              {typeof activeSession.state.tickIntervalMs === "number" && (
                <span className="session-pill">
                  Interval: {activeSession.state.tickIntervalMs}ms
                </span>
              )}
            </div>
          </div>

          {targetStatus?.configured && (
            <div
              className={`target-banner ${targetStatus.met ? "met" : ""}`}
            >
              <strong>{targetStatus.description || "Scenario target"}</strong>
              <div className="target-progress">
                Progress: {Math.min(
                  targetStatus.consecutiveTicks || 0,
                  targetStatus.holdTicksRequired || 0
                )}
                /{targetStatus.holdTicksRequired || 0} ticks in range
              </div>
            </div>
          )}

          {activeVitals.length > 0 && (
            <div className="vitals-grid">
              {activeVitals.map((vital) => (
                <div className="vital-card" key={vital.label}>
                  <span>{vital.label}</span>
                  <strong>{vital.value}</strong>
                </div>
              ))}
            </div>
          )}

          {activeMedications.length > 0 && (
            <div className="medications-panel">
              <h3>Medication Titration</h3>
              {activeMedications.map((med) => {
                const medState = activeSession.state.medicationState?.[med.id];
                return (
                  <div key={med.id} className="medication-row">
                    <div>
                      <strong>{med.name}</strong>
                      {med.dosage ? ` - ${med.dosage}` : ""}
                      {medState?.unit ? ` (${medState.unit})` : ""}
                      {typeof medState?.dose === "number" && (
                        <p className="medication-meta">
                          Current Dose: {medState.dose} {medState.unit || ""}
                        </p>
                      )}
                      {typeof medState?.min === "number" &&
                        typeof medState?.max === "number" && (
                          <p className="medication-meta">
                            Range: {medState.min} - {medState.max} {medState.unit || ""}
                          </p>
                        )}
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
                        <button onClick={() => handleAdjustMedication(med.id)}>
                          Apply
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="notes-panel">
            <h3>Simulation Notes</h3>
            <form className="note-form" onSubmit={handleAddNote}>
              <textarea
                value={noteContent}
                onChange={(event) => setNoteContent(event.target.value)}
                rows={3}
                placeholder="Document care actions, assessments, or next steps."
              />
              <button type="submit" disabled={noteSubmitting || !noteContent.trim()}>
                {noteSubmitting ? "Saving..." : "Add Note"}
              </button>
            </form>
            {noteError && <div className="notes-error">{noteError}</div>}
            <div className="notes-list">
              {notes.length === 0 ? (
                <p className="notes-empty">No notes recorded.</p>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="note-item">
                    <div className="note-meta">
                      <span>Session #{note.sessionId}</span>
                      <span>{formatNoteTimestamp(note.createdAt)}</span>
                    </div>
                    <p>{note.content}</p>
                    {activeSession?.userId === note.userId && (
                      <div className="note-actions">
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(note.id)}
                          disabled={noteDeletingId === note.id}
                        >
                          {noteDeletingId === note.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="simulation-controls">
            <button type="button" className="pause" onClick={handlePause}>
              Pause
            </button>
            <button type="button" className="resume" onClick={handleResume}>
              Resume
            </button>
            <button type="button" className="end" onClick={handleEnd}>
              End
            </button>
          </div>

          {activeSession.state.completionReason && (
            <div className="completion-banner">
              {activeSession.state.completionReason}
            </div>
          )}

          {sessionError && <div className="simulation-error">{sessionError}</div>}
        </section>
      )}

      {selectedScenario && (
        <ScenarioDetailsModal
          scenario={selectedScenario}
          onClose={closeScenarioDetails}
          onStartScenario={handleStartScenario}
          isStarting={isStarting}
          userIdInput={userIdInput}
          onUserIdChange={setUserIdInput}
          startError={startError}
        />
      )}

      {showImportModal && (
        <ImportModal
          onClose={closeImportModal}
          onImportSuccess={loadScenarios}
        />
      )}

      {showExportModal && <ExportModal onClose={closeExportModal} />}
    </div>
  );
}
function ScenarioDetailsModal({
  scenario,
  onClose,
  onStartScenario,
  isStarting,
  userIdInput,
  onUserIdChange,
  startError,
}) {
  const definition = scenario.definition || {};
  const patient = definition.patient || {};
  const vitals = definition.vitals?.current || {};
  const medications = definition.medications || [];
  const orders = definition.orders || [];
  const learningObjectives = definition.learningObjectives || [];
  const metadata = definition.metadata || {};

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{scenario.name}</h2>
          <button className="modal-close" onClick={onClose} type="button">
            &times;
          </button>
        </div>

        <div className="modal-body">
          {/* Patient Information */}
          <section className="scenario-section">
            <h3>Patient Information</h3>
            <div className="scenario-details-grid">
              {patient.name && (
                <div>
                  <strong>Name:</strong> {patient.name}
                </div>
              )}
              {patient.age && (
                <div>
                  <strong>Age:</strong> {patient.age} years old
                </div>
              )}
              {patient.gender && (
                <div>
                  <strong>Gender:</strong> {patient.gender}
                </div>
              )}
              {patient.mrn && (
                <div>
                  <strong>MRN:</strong> {patient.mrn}
                </div>
              )}
              {patient.room && (
                <div>
                  <strong>Room:</strong> {patient.room}
                </div>
              )}
              {patient.primaryDiagnosis && (
                <div>
                  <strong>Primary Diagnosis:</strong> {patient.primaryDiagnosis}
                </div>
              )}
              {patient.attendingPhysician && (
                <div>
                  <strong>Attending:</strong> {patient.attendingPhysician}
                </div>
              )}
            </div>

            {patient.allergies && patient.allergies.length > 0 && (
              <div className="allergies-section">
                <strong>Allergies:</strong>
                <ul>
                  {patient.allergies.map((allergy, index) => (
                    <li key={index}>
                      {allergy.substance} - {allergy.reaction} ({allergy.severity})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Vital Signs */}
          {vitals && Object.keys(vitals).length > 0 && (
            <section className="scenario-section">
              <h3>Current Vital Signs</h3>
              <div className="scenario-details-grid">
                {vitals.bloodPressure && (
                  <div>
                    <strong>Blood Pressure:</strong>{" "}
                    {vitals.bloodPressure.systolic}/{vitals.bloodPressure.diastolic}{" "}
                    {vitals.bloodPressure.unit || "mmHg"}
                  </div>
                )}
                {vitals.heartRate && (
                  <div>
                    <strong>Heart Rate:</strong> {vitals.heartRate} bpm
                  </div>
                )}
                {vitals.respiratoryRate && (
                  <div>
                    <strong>Respiratory Rate:</strong> {vitals.respiratoryRate} /min
                  </div>
                )}
                {vitals.temperature && (
                  <div>
                    <strong>Temperature:</strong> {vitals.temperature}
                    {vitals.temperatureUnit || "F"}
                  </div>
                )}
                {vitals.oxygenSaturation && (
                  <div>
                    <strong>O2 Saturation:</strong> {vitals.oxygenSaturation}%
                  </div>
                )}
                {vitals.painLevel !== undefined && (
                  <div>
                    <strong>Pain Level:</strong> {vitals.painLevel}/10
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Medications */}
          {medications.length > 0 && (
            <section className="scenario-section">
              <h3>Active Medications ({medications.length})</h3>
              <div className="medications-list">
                {medications.map((med, index) => (
                  <div key={med.id || index} className="medication-item">
                    <strong>{med.name}</strong> - {med.dosage} {med.route}
                    {med.frequency && `, ${med.frequency}`}
                    {med.indication && (
                      <span className="med-indication"> ({med.indication})</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Orders */}
          {orders.length > 0 && (
            <section className="scenario-section">
              <h3>Provider Orders ({orders.length})</h3>
              <div className="orders-list">
                {orders.map((order, index) => (
                  <div key={order.id || index} className="order-item">
                    <div className="order-header">
                      <strong>{order.type}:</strong> {order.description}
                    </div>
                    <div className="order-meta">
                      Ordered by {order.orderedBy} - Priority: {order.priority} - Status: {order.status}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Learning Objectives */}
          {learningObjectives.length > 0 && (
            <section className="scenario-section">
              <h3>Learning Objectives</h3>
              <ul className="objectives-list">
                {learningObjectives.map((objective, index) => (
                  <li key={index}>{objective}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Metadata */}
          {metadata && (
            <section className="scenario-section">
              <h3>Scenario Information</h3>
              <div className="scenario-details-grid">
                {metadata.difficulty && (
                  <div>
                    <strong>Difficulty:</strong> {metadata.difficulty}
                  </div>
                )}
                {metadata.estimatedDuration && (
                  <div>
                    <strong>Estimated Duration:</strong> {metadata.estimatedDuration}
                  </div>
                )}
                {metadata.specialty && (
                  <div>
                    <strong>Specialty:</strong> {metadata.specialty}
                  </div>
                )}
              </div>
              {metadata.tags && metadata.tags.length > 0 && (
                <div className="scenario-tags">
                  {metadata.tags.map((tag, index) => (
                    <span key={index} className="scenario-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        <div className="modal-footer">
          <div className="start-scenario-controls">
            <label htmlFor="scenario-user-id">
              Enter your user ID to launch this simulation
            </label>
            <input
              id="scenario-user-id"
              type="number"
              min="1"
              value={userIdInput}
              onChange={(event) => onUserIdChange(event.target.value)}
              placeholder="e.g., 1"
            />
            <p className="start-scenario-hint">
              Used to link notes and session history to your account.
            </p>
            {startError && <p className="start-error">{startError}</p>}
          </div>
          <div className="modal-actions">
            <button className="modal-button secondary" onClick={onClose} type="button">
              Close
            </button>
            <button
              className="modal-button primary"
              type="button"
              onClick={() => onStartScenario?.(scenario)}
              disabled={isStarting}
            >
              {isStarting ? "Starting..." : "Start Scenario"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
function ImportModal({ onClose, onImportSuccess }) {
  const [filePath, setFilePath] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = async () => {
    try {
      if (!window.api || !window.api.showOpenDialog) {
        setMessage(
          "Error: File dialog API is not available. Please run this in Electron."
        );
        return;
      }

      const result = await window.api.showOpenDialog({
        properties: ["openFile"],
        filters: [
          { name: "Database Files", extensions: ["db", "sqlite", "sqlite3"] },
        ],
      });

      if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
        setFilePath(result.filePaths[0]);
        setMessage("");
      }
    } catch (err) {
      setMessage(`Error selecting file: ${err.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      if (!window.api || !window.api.importFile) {
        setMessage(
          "Error: Electron API is not available. Please run this in Electron."
        );
        setIsLoading(false);
        return;
      }

      if (!filePath) {
        setMessage("Please select a file to import.");
        setIsLoading(false);
        return;
      }

      const result = await window.api.importFile(filePath);

      if (result.success) {
        setMessage("Import successful! Scenarios have been imported.");
        setTimeout(() => {
          onImportSuccess();
          onClose();
        }, 1500);
      } else {
        setMessage(result.error || "Import failed. Please try again.");
      }
    } catch (err) {
      setMessage(`Error importing file: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Import Scenarios</h2>
          <button className="modal-close" onClick={onClose} type="button">
            &times;
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "var(--ehr-spacing-lg)" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "var(--ehr-spacing-sm)",
                  color: "var(--ehr-text-primary)",
                }}
              >
                Database File Path
              </label>
              <div style={{ display: "flex", gap: "var(--ehr-spacing-sm)" }}>
                <input
                  type="text"
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  placeholder="Enter file path or click Browse..."
                  style={{
                    flex: 1,
                    padding: "var(--ehr-spacing-sm)",
                    borderRadius: "var(--ehr-radius-md)",
                    border: "1px solid var(--ehr-border)",
                    backgroundColor: "var(--ehr-bg-primary)",
                    color: "var(--ehr-text-primary)",
                  }}
                />
                <button
                  type="button"
                  onClick={handleFileSelect}
                  className="modal-button secondary"
                  style={{ whiteSpace: "nowrap" }}
                >
                  Browse...
                </button>
              </div>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--ehr-text-secondary)",
                  marginTop: "var(--ehr-spacing-xs)",
                }}
              >
                Select a .db, .sqlite, or .sqlite3 file to import scenarios
                from.
              </p>
            </div>

            {message && (
              <div
                style={{
                  padding: "var(--ehr-spacing-md)",
                  borderRadius: "var(--ehr-radius-md)",
                  backgroundColor: message.includes("success")
                    ? "rgba(16, 185, 129, 0.1)"
                    : "rgba(239, 68, 68, 0.1)",
                  color: message.includes("success")
                    ? "var(--ehr-success)"
                    : "var(--ehr-error)",
                  marginBottom: "var(--ehr-spacing-md)",
                }}
              >
                {message}
              </div>
            )}
          </form>
        </div>

        <div className="modal-footer">
          <div className="modal-actions">
            <button className="modal-button secondary" onClick={onClose} type="button">
              Cancel
            </button>
            <button
              className="modal-button primary"
              onClick={handleSubmit}
              disabled={isLoading || !filePath}
              type="button"
            >
              {isLoading ? "Importing..." : "Import"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExportModal({ onClose }) {
  const [filePath, setFilePath] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = async () => {
    try {
      if (!window.api || !window.api.showSaveDialog) {
        setMessage(
          "Error: File dialog API is not available. Please run this in Electron."
        );
        return;
      }

      const result = await window.api.showSaveDialog({
        filters: [
          { name: "Database Files", extensions: ["db", "sqlite", "sqlite3"] },
        ],
        defaultPath: "ehr_scenarios.db",
      });

      if (!result.canceled && result.filePath) {
        setFilePath(result.filePath);
        setMessage("");
      }
    } catch (err) {
      setMessage(`Error selecting file: ${err.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      if (!window.api || !window.api.exportData) {
        setMessage(
          "Error: Electron API is not available. Please run this in Electron."
        );
        setIsLoading(false);
        return;
      }

      if (!filePath) {
        setMessage("Please select a location to save the export file.");
        setIsLoading(false);
        return;
      }

      const result = await window.api.exportData(filePath);

      if (result.success) {
        setMessage("Export successful! Scenarios have been exported.");
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setMessage(result.error || "Export failed. Please try again.");
      }
    } catch (err) {
      setMessage(`Error exporting file: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Export Scenarios</h2>
          <button className="modal-close" onClick={onClose} type="button">
            &times;
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "var(--ehr-spacing-lg)" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "var(--ehr-spacing-sm)",
                  color: "var(--ehr-text-primary)",
                }}
              >
                Save Location
              </label>
              <div style={{ display: "flex", gap: "var(--ehr-spacing-sm)" }}>
                <input
                  type="text"
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  placeholder="Enter file path or click Browse..."
                  style={{
                    flex: 1,
                    padding: "var(--ehr-spacing-sm)",
                    borderRadius: "var(--ehr-radius-md)",
                    border: "1px solid var(--ehr-border)",
                    backgroundColor: "var(--ehr-bg-primary)",
                    color: "var(--ehr-text-primary)",
                  }}
                />
                <button
                  type="button"
                  onClick={handleFileSelect}
                  className="modal-button secondary"
                  style={{ whiteSpace: "nowrap" }}
                >
                  Browse...
                </button>
              </div>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--ehr-text-secondary)",
                  marginTop: "var(--ehr-spacing-xs)",
                }}
              >
                Choose where to save the exported scenarios database file.
              </p>
            </div>

            {message && (
              <div
                style={{
                  padding: "var(--ehr-spacing-md)",
                  borderRadius: "var(--ehr-radius-md)",
                  backgroundColor: message.includes("success")
                    ? "rgba(16, 185, 129, 0.1)"
                    : "rgba(239, 68, 68, 0.1)",
                  color: message.includes("success")
                    ? "var(--ehr-success)"
                    : "var(--ehr-error)",
                  marginBottom: "var(--ehr-spacing-md)",
                }}
              >
                {message}
              </div>
            )}
          </form>
        </div>

        <div className="modal-footer">
          <div className="modal-actions">
            <button className="modal-button secondary" onClick={onClose} type="button">
              Cancel
            </button>
            <button
              className="modal-button primary"
              onClick={handleSubmit}
              disabled={isLoading || !filePath}
              type="button"
            >
              {isLoading ? "Exporting..." : "Export"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Scenarios;

