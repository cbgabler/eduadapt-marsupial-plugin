const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('api', {
  message: () => 'test',
});
