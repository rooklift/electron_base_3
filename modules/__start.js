"use strict";

const {ipcRenderer} = require("electron");
const stringify = require("./stringify");

ipcRenderer.on("renderer_globals", (event, o) => {
	for (let [key, value] of Object.entries(o)) {
		global[key] = value;
		console.log(`${key}: ${value}`);
	}
	startup();
});

ipcRenderer.send("renderer_started", null);			// Causes main to send us the renderer_globals message

function startup() {

	const config_io = require("./config_io");		// Creates global.config
	config_io.load();								// Populates global.config

	global.alert = (msg) => {
		ipcRenderer.send("alert", stringify(msg));
	};

	global.hub = require("./hub");

	require("./__start_handlers");
	require("./__start_spinners");

	if (config_io.error()) {
		alert("Config file failed to load. It will not be written to. You should fix this.");
	}

	ipcRenderer.send("renderer_ready", null);
}
