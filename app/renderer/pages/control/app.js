const peer = require('./peer');

let video = document.getElementById('screen-video');
function play(stream) {
	video.srcObject = stream;
	console.log('in play', stream);
	video.onloadedmetadata = function() {
		video.play();
	};
}

peer.on('add-stream', (stream) => {
	console.log('play stream');
	play(stream);
});

window.onkeydown = function(e) {
	let data = {
		keyCode: e.keyCode,
		shift: e.shiftKey,
		meta: e.metaKey,
		control: e.ctrlKey,
		alt: e.altKey
	};
	peer.emit('robot', 'key', data);
};

window.onmouseup = function(e) {
	// data {clientX, clientY, screen: {width, height}, video: {width, height}}
	let data = {};
	data.clientX = e.clientX;
	data.clientY = e.clientY;
	data.video = {
		width: video.getBoundingClientRect().width,
		height: video.getBoundingClientRect().height
	};
	peer.emit('robot', 'mouse', data);
};
