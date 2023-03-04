const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
	cut: (inputs) => ipcRenderer.send('cut', inputs),
});
