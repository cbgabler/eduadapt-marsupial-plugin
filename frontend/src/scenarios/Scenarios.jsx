import { useState, useEffect } from "react";
import "./Scenarios.css";

function Scenarios() {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!window.api || !window.api.getAllScenarios) {
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

  return (
    <div className="page-container">
      <div className="export-buttons">
        <button onClick={openExportModal}>Export</button>
      </div>
      <div className="export-buttons">
        <button onClick={openImportModal}>Import</button>
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

      {selectedScenario && (
        <ScenarioDetailsModal
          scenario={selectedScenario}
          onClose={closeScenarioDetails}
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

function ScenarioDetailsModal({ scenario, onClose }) {
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
          <button className="modal-close" onClick={onClose}>
            ×
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
                      {allergy.substance} - {allergy.reaction} (
                      {allergy.severity})
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
                    {vitals.bloodPressure.systolic}/
                    {vitals.bloodPressure.diastolic}{" "}
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
                    <strong>Respiratory Rate:</strong> {vitals.respiratoryRate}{" "}
                    /min
                  </div>
                )}
                {vitals.temperature && (
                  <div>
                    <strong>Temperature:</strong> {vitals.temperature}°
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
                      <span className="med-indication">
                        {" "}
                        ({med.indication})
                      </span>
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
                      Ordered by {order.orderedBy} • Priority: {order.priority}{" "}
                      • Status: {order.status}
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
                    <strong>Estimated Duration:</strong>{" "}
                    {metadata.estimatedDuration}
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
          <button className="modal-button primary" onClick={onClose}>
            Close
          </button>
          <button className="modal-button secondary">Start Scenario</button>
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

      // Note: This would need to be added to preload.cjs
      // For now, we'll use a text input as a workaround
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
          <button className="modal-close" onClick={onClose}>
            ×
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
          <button className="modal-button secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="modal-button primary"
            onClick={handleSubmit}
            disabled={isLoading || !filePath}
          >
            {isLoading ? "Importing..." : "Import"}
          </button>
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

      // Note: This would need to be added to preload.cjs
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
          <button className="modal-close" onClick={onClose}>
            ×
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
          <button className="modal-button secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="modal-button primary"
            onClick={handleSubmit}
            disabled={isLoading || !filePath}
          >
            {isLoading ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Scenarios;
