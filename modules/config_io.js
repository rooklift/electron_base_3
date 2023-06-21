"use strict";

// Remember this will run twice in 2 different processes, so don't autosave etc.
// Remember that global.user_data_path must be set in the Renderer before requiring this.

const electron = require("electron");
const fs = require("fs");
const path = require("path");

exports.filename = "config.json";

// To avoid using "remote", we rely on the main process passing userData location in the query...

exports.filepath = electron.app ?
		path.join(electron.app.getPath("userData"), exports.filename) :			// in Main process
		path.join(global.user_data_path, exports.filename);						// in Renderer process

// ---------------------------------------------------------------------------------------------------------------------------

global.config = {};

exports.defaults = {
	"width": 1024,
	"height": 768,
	"maxed": false,
	"foo": true,
	"bar": 1,
};

// ---------------------------------------------------------------------------------------------------------------------------

let errortext = "";

exports.error = () => {
	return errortext;
};

// ---------------------------------------------------------------------------------------------------------------------------

exports.load = () => {

	try {
		if (fs.existsSync(exports.filepath)) {
			let raw_read = fs.readFileSync(exports.filepath, "UTF-8");
			if (raw_read.length < 100 && raw_read.trim() === "") {
				raw_read = "{}";
			}
			Object.assign(config, JSON.parse(raw_read));
		}
		errortext = "";
	} catch (err) {
		console.log(`While loading ${exports.filename}:`);
		console.log(err.toString());
		errortext = err.toString();
	}

	// Copy default values for any missing keys into the config...
	// We use a copy so that any objects that are assigned are not the default objects.

	let defaults_copy = JSON.parse(JSON.stringify(exports.defaults));

	for (let key of Object.keys(defaults_copy)) {
		if (!config.hasOwnProperty(key)) {
			config[key] = defaults_copy[key];
		}
	}
};

exports.save = () => {

	// Don't save if the load failed. Let the user fix their
	// broken config file, don't overwrite it with a fresh one.

	if (errortext) {
		return;
	}

	// Make a copy of the defaults. Doing it this way seems to
	// ensure the final JSON string has the same ordering...

	let out = JSON.parse(JSON.stringify(exports.defaults));

	// Adjust that copy, but only for keys present in both.

	for (let key of Object.keys(config)) {
		if (out.hasOwnProperty(key)) {
			out[key] = config[key];
		}
	}

	try {
		fs.writeFileSync(exports.filepath, JSON.stringify(out, null, "\t"));
	} catch (err) {
		console.log(err.toString());
	}
};
