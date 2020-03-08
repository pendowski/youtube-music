const path = require("path");

const { getCurrentWindow } = require("electron").remote;

const { getEnabledPlugins, store } = require("./store");
const { fileExists }               = require("./plugins/utils");

const plugins = getEnabledPlugins();

plugins.forEach(plugin => {
	const pluginPath = path.join(plugin, "actions.js");
	fileExists(pluginPath, () => {
		const actions = require(pluginPath).global || {};
		Object.keys(actions).forEach(actionName => {
			global[actionName] = actions[actionName];
		});
	});
});

document.addEventListener("DOMContentLoaded", () => {
	plugins.forEach(plugin => {
		const pluginPath = path.join(plugin, "front.js");
		fileExists(pluginPath, () => {
			const run = require(pluginPath);
			run();
		});
	});

	// Add action for reloading
	global.reload = () =>
		getCurrentWindow().webContents.loadURL(store.get("url"));
});
