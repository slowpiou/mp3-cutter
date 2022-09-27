const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { fileURLToPath } = require('node:url');
const async = require('async');
const ffmpeg = require('fluent-ffmpeg');

function createWindow() {
	let win = new BrowserWindow({
		width: 1920,
		height: 1000,
		webPreferences: {
			nodeIntegration: true,
			preload: path.join(__dirname, 'preload.js'),
		},
		skipTaskbar: true,
	});
	win.webContents.openDevTools();
	win.loadFile('index.html');
	win.setPosition(-1920, 200);
	win.maximize();

	ipcMain.on(
		'cut',
		(event, inputs) => {
			let filePath = fileURLToPath(inputs.url);
			async.eachOf(inputs.tracks, (i, key, callback) => {
				let title = i.title.length ? (key.toString() > 1 ? `${key + 1} - ${i.title}` : `0${key + 1} - ${i.title}`) : key + 1;
				ffmpeg(filePath)
					.on('error', (err) => {
						console.log('FFMpeg ERROR');
						return callback(err);
					})
					.on('end', () => {
						let file = path.join(__dirname, `assets/audio/${title}.mp3`);
						// NodeID3
						console.log(`Cutting ${key + 1} completed`);
						return callback(null);
					})
					.outputOptions(['-c copy', `-ss ${i.sh}:${i.sm}:${i.ss}`, `-to ${i.eh}:${i.em}:${i.es}`])
					.save(path.join(__dirname, `assets/audio/${title}.mp3`));
			});
		},
		function (err) {
			if (err) return console.log(err);
			console.log('Cuttings Completed');
		}
	);
}

app.on('ready', () => {
	createWindow();
});
