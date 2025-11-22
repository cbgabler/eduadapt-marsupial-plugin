import { useState } from "react";

function ImportModal({ onClose, onImportSuccess }) {
  const [filePath, setFilePath] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isSuccessMessage = message.toLowerCase().includes("success");

  const handleFileSelect = async () => {
    try {
      if (!window.api?.showOpenDialog) {
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
      if (!result.canceled && result.filePaths?.length > 0) {
        setFilePath(result.filePaths[0]);
        setMessage("");
      }
    } catch (err) {
      setMessage(`Error selecting file: ${err.message}`);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");
    try {
      if (!window.api?.importFile) {
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
          onImportSuccess?.();
          onClose?.();
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
      <div className="modal-content" onClick={(event) => event.stopPropagation()}>
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
                  onChange={(event) => setFilePath(event.target.value)}
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
                  backgroundColor: isSuccessMessage
                    ? "rgba(16, 185, 129, 0.1)"
                    : "rgba(239, 68, 68, 0.1)",
                  color: isSuccessMessage
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

export default ImportModal;
