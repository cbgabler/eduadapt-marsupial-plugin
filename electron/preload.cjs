const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script loaded');

// Expose API to frontend to interact with local DB
contextBridge.exposeInMainWorld('api', {
  message: () => 'test',
  registerUser: async (userData) => {
    console.log('registerUser called with:', userData);
    try {
      const result = await ipcRenderer.invoke('register-user', userData);
      console.log('IPC result:', result);
      return result;
    } catch (error) {
      console.error('IPC error:', error);
      return { success: false, error: error.message };
    }
  },
});

console.log('API exposed to window.api');
