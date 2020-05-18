import React, { useState, useEffect, Fragment } from 'react';
import './App.css';
import { ipcRenderer } from 'electron';
import './peer-puppet';

function App() {
	const [ localCode, setLocalCode ] = useState('');
	const [ remoteCode, setRemoteCode ] = useState('');
	const [ controls, setControl ] = useState('');

	const startControl = (remoteCode) => {
		ipcRenderer.send('control', remoteCode);
	};

	//0-unconnect
	//1-control
	//2-controlled
	const handleControlState = (e, name, type) => {
		let text = '';
		if (type === 1) {
			text = `Control ${name}`;
		} else if (type === 2) {
			text = `Controlled by ${name}`;
		} else {
			text = '';
		}
		setControl(text);
	};

	const login = async () => {
		let code = await ipcRenderer.invoke('login');
		console.log('code is', code);
		setLocalCode(code);
	};

	useEffect(() => {
		login();
		ipcRenderer.on('control-state-change', handleControlState);
		return () => {
			ipcRenderer.removeListener('control-state-change', handleControlState);
		};
	}, []);

	return (
		<div className="App">
			{controls === '' ? (
				<Fragment>
					<div>YOUR CONTROL CODE {localCode}</div>
					<input
						type="text"
						value={remoteCode}
						onChange={(e) => {
							setRemoteCode(e.target.value);
						}}
					/>
					<button onClick={() => startControl(remoteCode)}>SUMBIT</button>
				</Fragment>
			) : (
				<div>{controls}</div>
			)}
		</div>
	);
}

export default App;
