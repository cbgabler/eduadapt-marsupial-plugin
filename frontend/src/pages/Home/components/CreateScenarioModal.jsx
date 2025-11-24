function CreateScenarioModal({ onClose, onCreateSuccess }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Scenario</h2>
          <button className="modal-close" onClick={onClose} type="button">
            &times;
          </button>
        </div>

        <div className="modal-body">
          <p>Scenario creation form will be implemented here.</p>
        </div>

        <div className="modal-footer">
          <div className="modal-actions">
            <button className="modal-button secondary" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="modal-button primary" type="button" disabled>
              Create Scenario
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateScenarioModal;
