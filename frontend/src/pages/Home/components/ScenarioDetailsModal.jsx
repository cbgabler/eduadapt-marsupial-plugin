function ScenarioDetailsModal({
  scenario,
  onClose,
  onStartScenario,
  onDeleteScenario,
  isStarting,
  startError,
  currentUser,
  isDeleting,
  deleteError,
}) {
  const isInstructor = currentUser?.role === "instructor" || currentUser?.role === "admin";
  const definition = scenario.definition || {};
  const patient = definition.patient || {};
  const vitals = definition.vitals?.current || {};
  const medications = definition.medications || [];
  const orders = definition.orders || [];
  const learningObjectives = definition.learningObjectives || [];
  const metadata = definition.metadata || {};

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>{scenario.name}</h2>
          <button className="modal-close" onClick={onClose} type="button">
            &times;
          </button>
        </div>

        <div className="modal-body">
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
                      Ordered by {order.orderedBy} - Priority: {order.priority} -
                      Status: {order.status}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

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
            {currentUser ? (
              <p>
                You are signed in as <strong>{currentUser.username}</strong> (
                {currentUser.role})
              </p>
            ) : (
              <p>Please sign in to launch scenarios.</p>
            )}
            {startError && <p className="start-error">{startError}</p>}
          </div>
          <div className="modal-actions">
            {isInstructor && (
              <button
                className="modal-button"
                type="button"
                onClick={() => onDeleteScenario?.(scenario.id)}
                disabled={isDeleting}
                style={{
                  backgroundColor: "var(--ehr-error)",
                  color: "var(--ehr-text-inverse)",
                  marginRight: "auto",
                }}
              >
                {isDeleting ? "Deleting..." : "Delete Scenario"}
              </button>
            )}
            <button className="modal-button secondary" onClick={onClose} type="button">
              Close
            </button>
            <button
              className="modal-button primary"
              type="button"
              onClick={() => onStartScenario?.(scenario)}
              disabled={isStarting || isDeleting}
            >
              {isStarting ? "Starting..." : "Start Scenario"}
            </button>
          </div>
          {deleteError && (
            <div
              style={{
                padding: "var(--ehr-spacing-md)",
                borderRadius: "var(--ehr-radius-md)",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                color: "var(--ehr-error)",
                marginTop: "var(--ehr-spacing-md)",
              }}
            >
              {deleteError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ScenarioDetailsModal;
