const EventEmitter = require('events');
const peer = new EventEmitter();
const { ipcRenderer } = require('electron');

// peer.on('robot', (type, data) => {
// 	console.log('robot', type, data);
// 	if (type === 'mouse') {
// 		data.screen = {
// 			width: window.screen.width,
// 			height: window.screen.height
// 		};
// 	}
//
// setTimeout(() => {
// 	ipcRenderer.send('robot', type, data);
// }, 2000);
// });

const pc = new window.RTCPeerConnection({});
const dc = pc.createDataChannel('robotchannel', { reliable: false });
dc.onopen = function() {
	peer.on('robot', (type, data) => {
		dc.send(JSON.stringify({ type, data }));
	});
};

dc.onmessage = function(event) {
	console.log('message', event);
};

dc.onerror = (e) => {
	console.log('error', e);
};

pc.onicecandidate = (e) => {
	console.log('candidate', JSON.stringify(e.candidate));
	if (e.candidate) {
		// ipcRenderer.send('forward', 'control-candidate', e.candidate);
		ipcRenderer.send('forward', 'control-candidate', JSON.stringify(e.candidate));
	}
};

let candidates = []; //缓冲池
async function addIceCandidate(candidate) {
	if (candidate) {
		candidates.push(candidate);
	}
	if (pc.remoteDescription && pc.remoteDescription.type) {
		for (let i = 0; i < candidates.length; i++) {
			await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(candidates[i])));
		}
		candidates = [];
	}
}
window.addIceCandidate = addIceCandidate;
ipcRenderer.on('candidate', (e, candidate) => {
	addIceCandidate(candidate);
});

async function createOffer() {
	let offer = await pc.createOffer({
		offerToReceiveAudio: false, //只需视频无需音频
		offerToReceiveVideo: true
	});
	await pc.setLocalDescription(offer);
	console.log('create-offer\n', JSON.stringify(pc.localDescription));
	return pc.localDescription;
}
//创建offer并传至被控制端;
createOffer().then((offer) => {
	console.log('forward', 'offer', offer);
	ipcRenderer.send('forward', 'offer', { type: offer.type, sdp: offer.sdp });
});

async function setRemote(answer) {
	await pc.setRemoteDescription(answer);
	// console.log('create-answer', pc);
}
window.setRemote = setRemote;
ipcRenderer.on('answer', (e, answer) => {
	setRemote(answer);
});

pc.ontrack = (e) => {
	console.log('addstream', e.streams[0]);
	peer.emit('add-stream', e.streams[0]);
};

module.exports = peer;
