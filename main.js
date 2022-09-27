const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { fileURLToPath } = require('node:url');
const async = require('async');
const ffmpeg = require('fluent-ffmpeg');
const NodeID3 = require('node-id3');

function createWindow() {
	let win = new BrowserWindow({
		width: 1920,
		height: 1000,
		webPreferences: {
			nodeIntegration: true,
			preload: path.join(__dirname, 'preload.js'),
		},
	});
	// win.webContents.openDevTools();
	win.loadFile('index.html');
	win.setPosition(-1920, 200);
	win.setMenu(null);
	win.maximize();

	ipcMain.on('cut', (event, inputs) => {
		let filePath = fileURLToPath(inputs.url);
		async.eachOf(
			inputs.tracks,
			(i, key, callback) => {
				let title = i.title.length ? (key.toString() > 1 ? `${key + 1} - ${i.title}` : `0${key + 1} - ${i.title}`) : key + 1;
				let titleID3 = i.title.length ? i.title : key + 1;
				ffmpeg(filePath)
					.on('error', (err) => {
						console.log('FFMpeg ERROR');
						return callback(err);
					})
					.on('end', () => {
						let file = path.join(__dirname, `assets/audio/${title}.mp3`);

						if (inputs.album) {
							NodeID3.update({ album: inputs.album }, file);
						}
						if (inputs.year) {
							NodeID3.update({ year: inputs.year }, file);
						}
						if (inputs.artist) {
							NodeID3.update({ artist: inputs.artist, performerInfo: inputs.artist }, file);
						}
						NodeID3.update({ title: titleID3, trackNumber: key + 1 }, file);

						console.log(`Cutting ${key + 1} completed`);
						return callback(null);
					})
					.outputOptions(['-c copy', `-ss ${i.sh}:${i.sm}:${i.ss}`, `-to ${i.eh}:${i.em}:${i.es}`])
					.save(path.join(__dirname, `assets/audio/${title}.mp3`));
			},
			function (err) {
				if (err) return console.log(err);
				console.log('Cuttings Completed');
			}
		);
	});
}

app.on('ready', () => {
	createWindow();
});
