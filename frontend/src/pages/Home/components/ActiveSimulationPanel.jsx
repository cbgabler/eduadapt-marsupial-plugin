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

function ActiveSimulationPanel({
  activeScenario,
  activeSession,
  activeVitals,
  activeMedications,
  patientDetails,
  targetStatus,
  doseInputs,
  onDoseChange,
  onAdjustMedication,
  notes,
  noteContent,
  onNoteContentChange,
  onAddNote,
  onDeleteNote,
  noteSubmitting,
  noteError,
  noteDeletingId,
  onPause,
  onResume,
  onEnd,
  sessionError,
}) {
  if (!activeSession?.state) {
    return null;
  }

  return (
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
          <span className="session-pill">Session #{activeSession.sessionId}</span>
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
        <div className={`target-banner ${targetStatus.met ? "met" : ""}`}>
          <strong>{targetStatus.description || "Scenario target"}</strong>
          <div className="target-progress">
            Progress:{" "}
            {Math.min(
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
                        onDoseChange?.(med.id, event.target.value)
                      }
                    />
                    <button
                      type="button"
                      onClick={() => onAdjustMedication?.(med.id)}
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

      <div className="notes-panel">
        <h3>Simulation Notes</h3>
        <form className="note-form" onSubmit={onAddNote}>
          <textarea
            value={noteContent}
            onChange={(event) => onNoteContentChange?.(event.target.value)}
            rows={3}
            placeholder="Document care actions, assessments, or next steps."
          />
          <button
            type="submit"
            disabled={noteSubmitting || !noteContent.trim()}
          >
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
                      onClick={() => onDeleteNote?.(note.id)}
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
        <button type="button" className="pause" onClick={onPause}>
          Pause
        </button>
        <button type="button" className="resume" onClick={onResume}>
          Resume
        </button>
        <button type="button" className="end" onClick={onEnd}>
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
  );
}

export default ActiveSimulationPanel;
