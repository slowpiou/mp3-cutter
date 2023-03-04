(function (Peaks) {
	/***  HTML Elements ***/
	// new Track/Segment HTML
	let newTrack = function (id, i, h, m, s) {
		let trackNumber = i.toString();
		tracksContainer.insertAdjacentHTML(
			'beforeend',
			'<div class="column is-6 new-track">' +
				`<label class="label is-title is-size-4">Track ${trackNumber.length > 1 ? trackNumber : '0' + trackNumber}</label>` +
				'<div class="columns">' +
				'<div class="column is-6">' +
				'<div class="field is-horizontal">' +
				'<div class="field-body">' +
				'<div class="field">' +
				'<p class="control is-expanded">' +
				'<input type="text" class="input" placeholder="title" />' +
				'</p>' +
				'</div>' +
				'</div>' +
				'</div>' +
				'</div>' +
				`<div class="column is-6" id="${id}">` +
				'<div class="field is-horizontal">' +
				'<div class="field-body">' +
				'<div class="field">' +
				'<p class="control">' +
				`<input type="text" class="input" readonly placeholder="hh" value="${h}"/>` +
				'</p>' +
				'</div>' +
				'<div class="field">' +
				'<p class="control">' +
				`<input type="text" class="input" readonly placeholder="mm" value="${m}" />` +
				'</p>' +
				'</div>' +
				'<div class="field">' +
				'<p class="control">' +
				`<input type="text" class="input" readonly placeholder="ss" value="${s}"/>` +
				'</p>' +
				'</div>' +
				'</div>' +
				'</div>' +
				'</div>' +
				'</div>' +
				'</div>'
		);
	};

	// Peaks elements
	const zoomviewElt = document.getElementById('zoomview-container');
	const overviewElt = document.getElementById('overview-container');
	const audioElt = document.querySelector('audio');
	// button elements
	const zoomInBtn = document.getElementById('zoom-in-button');
	const zoomOutBtn = document.getElementById('zoom-out-button');
	const addSegmentBtn = document.getElementById('add-segment-button');
	const removeSegmentBtn = document.getElementById('remove-segment-button');
	const cutBtn = document.getElementById('cut-button');
	// inputs elements
	const inputFileElt = document.getElementById('input-file');
	const fileNameElt = document.getElementById('file-name');
	const artistElt = document.getElementById('artist-input');
	const albumElt = document.getElementById('album-input');
	const yearElt = document.getElementById('year-input');
	const tracksContainer = document.getElementById('tracks-container');

	// Utils
	let getHours = (time) => {
		return Math.floor(time / 3600);
	};
	let getMinutes = (time) => {
		return Math.floor((time % 3600) / 60);
	};
	let getSeconds = (time) => {
		return Math.round(time) % 60;
	};

	inputFileElt.addEventListener('change', function (evt) {
		let file = evt.target.files[0];
		audioElt.src = file.path;
		fileNameElt.innerText = file.name;
	});

	/*** Peaks options ***/
	const options = {
		zoomview: {
			container: zoomviewElt,
			waveformColor: 'rgba(255,216,0,0.9)',
			playheadColor: '#ffffff',
			showPlayheadTime: true,
			playheadTextColor: '#ddd',
			wheelMode: 'scroll',
			axisGridlineColor: '#aaa',
			axisLabelColor: '#fff',
			timeLabelPrecision: 0,
		},
		overview: {
			container: overviewElt,
			waveformColor: 'rgba(255,255,255,0.3)',
			playheadColor: '#ffffff',
			showPlayheadTime: true,
			playheadTextColor: '#ddd',
			axisGridlineColor: '#aaa',
			axisLabelColor: '#fff',
			timeLabelPrecision: 0,
		},
		mediaElement: audioElt,
		webAudio: {
			audioContext: new AudioContext(),
		},
		segmentStartMarkerColor: '#6606ce',
		segmentEndMarkerColor: '#ffd800',
		randomizeSegmentColor: true,
		zoomLevels: [8000, 16000, 32000, 64000],
	};

	/*** Peaks Initialization ***/
	Peaks.init(options, function (err, peaks) {
		if (err) {
			console.error('Failed to initialize Peaks instance: ' + err.message);
			return;
		}

		// Zooms
		zoomInBtn.addEventListener('click', function () {
			peaks.zoom.zoomIn();
		});
		zoomOutBtn.addEventListener('click', function () {
			peaks.zoom.zoomOut();
		});

		// Add segment
		addSegmentBtn.addEventListener('click', function () {
			let segments = peaks.segments._segments;
			if (segments.length > 0) {
				peaks.segments.add({
					startTime: segments[segments.length - 1].endTime,
					endTime: segments[segments.length - 1].endTime + 60,
					labelText: `Track ${segments.length + 1}`,
					editable: true,
				});
			} else {
				peaks.segments.add({
					startTime: peaks.player.getCurrentTime(),
					endTime: peaks.player.getCurrentTime() + 60,
					labelText: `Track ${segments.length + 1}`,
					editable: true,
				});
			}
		});

		// Remove last segment
		removeSegmentBtn.addEventListener('click', function () {
			peaks.segments.removeById(peaks.segments._segments[peaks.segments._segments.length - 1].id);
		});

		// Events
		peaks.on('segments.add', (segment) => {
			newTrack(
				segment[0].id,
				peaks.segments.getSegments().length,
				getHours(segment[0].endTime),
				getMinutes(segment[0].endTime),
				getSeconds(segment[0].endTime)
			);
		});
		peaks.on('segments.remove', () => {
			tracksContainer.removeChild(tracksContainer.lastElementChild);
		});
		peaks.on('segments.dragend', (segment) => {
			let inputsContainer = document.getElementById(segment.segment.id);
			let inputElts = inputsContainer.querySelectorAll('input');
			inputElts[0].value = getHours(segment.segment.endTime);
			inputElts[1].value = getMinutes(segment.segment.endTime);
			inputElts[2].value = getSeconds(segment.segment.endTime);
		});
	});
	/*** CUT ***/
	cutBtn.addEventListener('click', function () {
		let inputs = {
			url: audioElt.src,
			artist: artistElt.value,
			album: albumElt.value,
			year: yearElt.value,
			tracks: [],
		};
		let allTrackContainers = tracksContainer.querySelectorAll('.new-track');
		inputs.tracks = [...allTrackContainers].map((t, i, tracks) => {
			let trackInputs = t.querySelectorAll('input');
			let returnedObj = {
				title: trackInputs[0].value,
				eh: trackInputs[1].value,
				em: trackInputs[2].value,
				es: trackInputs[3].value,
				sh: 0,
				sm: 0,
				ss: 0,
			};
			if (tracks[i - 1]) {
				let previousTrackInputs = tracks[i - 1].querySelectorAll('input');
				returnedObj.sh = previousTrackInputs[1].value;
				returnedObj.sm = previousTrackInputs[2].value;
				returnedObj.ss = previousTrackInputs[3].value;
			}
			return returnedObj;
		});
		window.electronAPI.cut(inputs);
	});
})(peaks);
