const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
	cut: (inputs) => ipcRenderer.send('cut', inputs),
	onCutDone: (cb) => ipcRenderer.on('cut-done', cb),
});
