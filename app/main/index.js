const { app } = require('electron');
const handleIPC = require('./ipc');
const { createWindow } = require('./windows/main');

app.on('ready', () => {
	createWindow();
	handleIPC();
	require('./robot.js')();
});
