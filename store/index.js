const Store = require("electron-store");
const plugins = require("./plugins");
const { getAllPlugins } = require("../plugins/utils");
const { app } = require("electron");

const store = new Store({
	defaults: {
		"window-size": {
			width : 1100,
			height: 550
		},
		url    : "https://music.youtube.com",
		plugins: null
	}
});

if (store.get('plugins') === null) {
	store.set('plugins', getAllPlugins(app))
}

module.exports = {
	store            : store,
	isPluginEnabled  : plugin => plugins.isEnabled(store, plugin),
	getEnabledPlugins: () => plugins.getEnabledPlugins(store),
	enablePlugin     : plugin => plugins.enablePlugin(store, plugin),
	disablePlugin    : plugin => plugins.disablePlugin(store, plugin)
};
