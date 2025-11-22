function ScenarioCard({ scenario, onSelect }) {
  const definition = scenario.definition || {};
  const metadata = definition.metadata || {};
  const patient = definition.patient || {};

  return (
    <div className="scenario-card" onClick={onSelect}>
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
        <button className="scenario-button" type="button" onClick={onSelect}>
          View Details
        </button>
      </div>
    </div>
  );
}

export default ScenarioCard;
