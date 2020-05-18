const WebSocket = require('ws');
const EventEmitter = require('events');
const signal = new EventEmitter();

const ws = new WebSocket('ws://127.0.0.1:8010');
ws.on('open', function open() {
	console.log('connect success');
});

ws.on('message', function incoming(message) {
	let data = JSON.parse(message);
	console.log('data', data, message);
	signal.emit(data.event, data.data);
});

function send(event, data) {
	console.log('sended', JSON.stringify({ event, data }));
	ws.send(JSON.stringify({ event, data }));
}

function invoke(event, data, answerEvent) {
	console.log('invoking');
	return new Promise((resolve, reject) => {
		console.log('event', event);
		console.log('data', data);
		send(event, data);
		signal.once(answerEvent, resolve);
		setTimeout(() => {
			reject('timeout');
		}, 5000);
	});
}
signal.send = send;
signal.invoke = invoke;

module.exports = signal;
