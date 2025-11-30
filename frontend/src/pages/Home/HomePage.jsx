import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../Auth/AuthContext.jsx";
import { buildVitalSummary } from "../../utils/simulationFormatting.js";
import ScenarioGrid from "./components/ScenarioGrid.jsx";
import ScenarioDetailsModal from "./components/ScenarioDetailsModal.jsx";
import ActiveSimulationPanel from "./components/ActiveSimulationPanel.jsx";
import ImportModal from "./components/ImportModal.jsx";
import ExportModal from "./components/ExportModal.jsx";
import "./HomePage.css";

const POLL_INTERVAL_MS = 2500;

function HomePage() {
  const { user } = useAuth();

  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [activeScenario, setActiveScenario] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [sessionError, setSessionError] = useState(null);
  const [startError, setStartError] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [doseInputs, setDoseInputs] = useState({});
  const [notes, setNotes] = useState([]);
  const [noteContent, setNoteContent] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [noteError, setNoteError] = useState(null);
  const [noteDeletingId, setNoteDeletingId] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [deletingScenarioId, setDeletingScenarioId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

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
        setActiveSession((previous) => ({
          sessionId,
          state: response.state,
          userId: previous?.userId ?? sessionUserIdRef.current ?? null,
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
    pollingRef.current = setInterval(
      () => refreshSessionState(sessionId),
      POLL_INTERVAL_MS
    );
  };

  const loadScenarios = useCallback(async () => {
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
  }, [electronApiAvailable]);

  const handleScenarioClick = async (scenarioId) => {
    setStartError(null);
    try {
      if (!window.api?.getScenario) {
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

  const handleDeleteScenario = async (scenarioId) => {
    if (!window.confirm("Are you sure you want to delete this scenario? This action cannot be undone.")) {
      return;
    }

    setDeletingScenarioId(scenarioId);
    setDeleteError(null);
    try {
      if (!window.api?.deleteScenario) {
        setDeleteError("Electron API not available.");
        setDeletingScenarioId(null);
        return;
      }
      const result = await window.api.deleteScenario(scenarioId);
      if (result.success) {
        // Close modal if the deleted scenario is currently selected
        if (selectedScenario?.id === scenarioId) {
          setSelectedScenario(null);
        }
        // Refresh scenarios list
        await loadScenarios();
      } else {
        setDeleteError(result.error || "Failed to delete scenario");
      }
    } catch (err) {
      setDeleteError(err.message || "An unexpected error occurred");
    } finally {
      setDeletingScenarioId(null);
    }
  };

  const closeScenarioDetails = () => {
    setSelectedScenario(null);
    setStartError(null);
  };

  const openImportModal = () => setShowImportModal(true);
  const closeImportModal = () => setShowImportModal(false);
  const openExportModal = () => setShowExportModal(true);
  const closeExportModal = () => setShowExportModal(false);

  const loadNotes = useCallback(async (sessionId) => {
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
  }, []);

  const handleStartScenario = async (scenario) => {
    if (!scenario) {
      setStartError("Select a scenario to start.");
      return false;
    }
    setStartError(null);
    setSessionError(null);

    const parsedUserId = Number.parseInt(user?.id, 10);
    if (!Number.isFinite(parsedUserId) || parsedUserId <= 0) {
      setStartError("You must be signed in with a valid user.");
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

  const handleDoseInputChange = (medicationId, value) => {
    setDoseInputs((previous) => ({
      ...previous,
      [medicationId]: value,
    }));
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
        setNotes((previous) => [...previous, response.note]);
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
        setNotes((previous) => previous.filter((note) => note.id !== noteId));
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
        setActiveSession((previous) =>
          previous
            ? {
                ...previous,
                state: response.state,
              }
            : previous
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
        setActiveSession((previous) =>
          previous
            ? {
                ...previous,
                state: response.state,
              }
            : previous
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
        setActiveSession((previous) =>
          previous
            ? {
                ...previous,
                state: response.state,
              }
            : previous
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
        setActiveSession((previous) =>
          previous
            ? {
                ...previous,
                state: response.state,
              }
            : previous
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
  }, [loadScenarios]);

  useEffect(() => () => stopPolling(), []);

  useEffect(() => {
    if (!activeSession?.state?.medicationState) {
      setDoseInputs({});
      return;
    }
    setDoseInputs((previous) => {
      const next = {};
      Object.entries(activeSession.state.medicationState).forEach(
        ([id, medState]) => {
          next[id] =
            previous[id] ??
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
  }, [activeSession?.sessionId, loadNotes]);

  const activeVitals = useMemo(
    () =>
      activeSession?.state
        ? buildVitalSummary(activeSession.state.currentVitals)
        : [],
    [activeSession?.state]
  );

  const activeMedications = activeSession?.state?.medications || [];
  const patientDetails = activeScenario?.definition?.patient || null;
  const targetStatus = activeSession?.state?.targetStatus;

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
          <button onClick={loadScenarios} className="retry-button" type="button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="scenario-actions">
        <button type="button" onClick={openExportModal}>
          Export
        </button>
        <button type="button" onClick={openImportModal}>
          Import
        </button>
      </div>

      <div className="scenarios-header">
        <h1>Simulation Home</h1>
        <p className="scenarios-subtitle">
          Select a scenario to begin practicing with simulated patient cases
        </p>
      </div>

      {scenarios.length === 0 ? (
        <div className="scenarios-empty">
          <p>No scenarios available. Scenarios will appear here once created.</p>
        </div>
      ) : (
        <ScenarioGrid scenarios={scenarios} onSelect={handleScenarioClick} />
      )}

      {activeSession?.state && (
        <ActiveSimulationPanel
          activeScenario={activeScenario}
          activeSession={activeSession}
          activeVitals={activeVitals}
          activeMedications={activeMedications}
          patientDetails={patientDetails}
          targetStatus={targetStatus}
          doseInputs={doseInputs}
          onDoseChange={handleDoseInputChange}
          onAdjustMedication={handleAdjustMedication}
          notes={notes}
          noteContent={noteContent}
          onNoteContentChange={setNoteContent}
          onAddNote={handleAddNote}
          onDeleteNote={handleDeleteNote}
          noteSubmitting={noteSubmitting}
          noteError={noteError}
          noteDeletingId={noteDeletingId}
          onPause={handlePause}
          onResume={handleResume}
          onEnd={handleEnd}
          sessionError={sessionError}
        />
      )}

      {selectedScenario && (
        <ScenarioDetailsModal
          scenario={selectedScenario}
          onClose={closeScenarioDetails}
          onStartScenario={handleStartScenario}
          onDeleteScenario={handleDeleteScenario}
          isStarting={isStarting}
          startError={startError}
          currentUser={user}
          isDeleting={deletingScenarioId === selectedScenario.id}
          deleteError={deleteError}
        />
      )}

      {showImportModal && (
        <ImportModal onClose={closeImportModal} onImportSuccess={loadScenarios} />
      )}
      {showExportModal && <ExportModal onClose={closeExportModal} />}
    </div>
  );
}

export default HomePage;
