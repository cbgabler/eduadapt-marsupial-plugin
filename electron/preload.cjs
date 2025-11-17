const { contextBridge, ipcRenderer } = require("electron");

console.log("Preload script loaded");

// Expose API to frontend to interact with local DB
contextBridge.exposeInMainWorld("api", {
  message: () => "test",
  registerUser: async (userData) => {
    console.log("registerUser called with:", userData);
    try {
      const result = await ipcRenderer.invoke("register-user", userData);
      console.log("IPC result:", result);
      return result;
    } catch (error) {
      console.error("IPC error:", error);
      return { success: false, error: error.message };
    }
  },
  getAllScenarios: async () => {
    try {
      return await ipcRenderer.invoke("get-all-scenarios");
    } catch (error) {
      console.error("IPC error:", error);
      return { success: false, error: error.message };
    }
  },
  getScenario: async (scenarioId) => {
    try {
      return await ipcRenderer.invoke("get-scenario", scenarioId);
    } catch (error) {
      console.error("IPC error:", error);
      return { success: false, error: error.message };
    }
  },
  // Fix
  // importFile: () => {
  //   try {
  //     return ipcRenderer.invoke("");
  //   } catch (error) {
  //     console.error("IPC error:", error);
  //     return { success: false, error: error.message}
  //   }
  // }
});

console.log("API exposed to window.api");
