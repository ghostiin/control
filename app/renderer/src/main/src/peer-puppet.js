import { ipcRenderer, desktopCapturer } from 'electron';

async function getScreenStream() {
	const sources = await desktopCapturer.getSources({ types: [ 'screen' ] });
	return new Promise((resolve, reject) => {
		navigator.webkitGetUserMedia(
			{
				audio: false,
				video: {
					mandatory: {
						chromeMediaSource: 'desktop',
						chromeMediaSourceId: sources[0].id,
						maxWidth: window.screen.width,
						maxHeight: window.screen.height
					}
				}
			},
			(stream) => {
				// // console.log('add-stream', stream);
				resolve(stream);
			},
			(err) => {
				console.log(err);
			}
		);
	});
}
const pc = new window.RTCPeerConnection();

pc.onicecandidate = (e) => {
	console.log('candidate', JSON.stringify(e.candidate));
	if (e.candidate) {
		ipcRenderer.send('forward', 'puppet-candidate', e.candidate);
	}
};

let candidates = []; //缓冲池
async function addIceCandidate(candidate) {
	if (candidate) {
		candidates.push(candidate);
	}
	if (pc.remoteDescription && pc.remoteDescription.type) {
		for (let i = 0; i < candidates.length; i++) {
			await pc.addIceCandidate(new RTCIceCandidate(candidates[i]));
		}
		candidates = [];
	}
}
window.addIceCandidate = addIceCandidate;
ipcRenderer.on('offer', async (e, offer) => {
	let answer = await createAnswer(offer);
	ipcRenderer.send('forward', 'answer', { type: answer.type, sdp: answer.sdp });
});

async function createAnswer(offer) {
	let stream = await getScreenStream();
	// pc.addStream(stream);
	stream.getTracks().forEach((track) => pc.addTrack(track, stream));
	await pc.setRemoteDescription(offer);
	await pc.setLocalDescription(await pc.createAnswer());
	console.log('create answer \n', JSON.stringify(pc.localDescription));
	// send answer
	return pc.localDescription;
}
window.createAnswer = createAnswer;

// createAnswer(offer).then((answer) => {
// 	ipcRenderer.send('forward', 'answer', { type: answer.type, sdp: answer.sdp });
// });
