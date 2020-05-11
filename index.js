"use strict";
const path = require("path");
const fs = require('fs')
const YAML = require('yaml')

const electron        = require("electron");
const is              = require("electron-is");
const { autoUpdater } = require("electron-updater");

const { setApplicationMenu }       = require("./menu");
const { getEnabledPlugins, store } = require("./store");
const { fileExists, injectCSS }    = require("./plugins/utils");

const app = electron.app;

// Adds debug features like hotkeys for triggering dev tools and reload
require("electron-debug")();

// Prevent window being garbage collected
let mainWindow;
autoUpdater.autoDownload = false;

let icon = "assets/youtube-music.png";
if (process.platform == "win32") {
	icon = "assets/generated/icon.ico";
} else if (process.platform == "darwin") {
	icon = "assets/generated/icon.icns";
}

function onClosed() {
	// Dereference the window
	// For multiple windows store them in an array
	mainWindow = null;
}

function createMainWindow() {
	const windowSize      = store.get("window-size");
	const windowMaximized = store.get("window-maximized");

	const win = new electron.BrowserWindow({
		icon           : icon,
		width          : windowSize.width,
		height         : windowSize.height,
		backgroundColor: "#000",
		show           : false,
		webPreferences : {
			nodeIntegration : false,
			preload         : path.join(__dirname, "preload.js"),
			nativeWindowOpen: true,                                 // window.open return Window object(like in regular browsers), not BrowserWindowProxy
			affinity        : "main-window"                         // main window, and addition windows should work in one process
		},
		frame        : !is.macOS(),
		titleBarStyle: is.macOS() ? "hiddenInset": "default"
	});
	if (windowMaximized) {
		win.maximize();
	}

	win.webContents.loadURL(store.get("url"));
	win.on("closed", onClosed);

	injectCSS(win.webContents, path.join(__dirname, "youtube-music.css"));
	win.webContents.on("did-finish-load", () => {
		if (is.dev()) {
			console.log("did finish load");
			win.webContents.openDevTools();
		}
	});

	getEnabledPlugins().forEach(plugin => {
		console.log("Loaded plugin - " + plugin);
		const pluginPath = path.join(plugin, "back.js");
		fileExists(pluginPath, () => {
			const handle = require(pluginPath);
			handle(win);
		});
	});

	win.webContents.on("did-fail-load", () => {
		if (is.dev()) {
			console.log("did fail load");
		}
		win.webContents.loadFile(path.join(__dirname, "error.html"));
	});

	win.webContents.on("did-navigate-in-page", () => {
		const url = win.webContents.getURL();
		if (url.startsWith("https://music.youtube.com")) {
			store.set("url", url);
		}
	});

	win.webContents.on(
		"new-window",
		(e, url, frameName, disposition, options) => {
			// hook on new opened window

			// at now new window in mainWindow renderer process.
			// Also, this will automatically get an option `nodeIntegration=false`(not override to true, like in iframe's) - like in regular browsers
			options.webPreferences.affinity = "main-window";
		}
	);

	win.on("move", () => {
		let position = win.getPosition();
		store.set("window-position", { x: position[0], y: position[1] });
	});

	win.on("resize", () => {
		const windowSize = win.getSize();

		store.set("window-maximized", win.isMaximized());
		if (!win.isMaximized()) {
			store.set("window-size", { width: windowSize[0], height: windowSize[1] });
		}
	});

	win.once("ready-to-show", () => {
		win.show();
	});

	return win;
}

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}

	// Unregister all shortcuts.
	electron.globalShortcut.unregisterAll();
});

app.on("activate", () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) {
		mainWindow = createMainWindow();
	} else if (!mainWindow.isVisible()) {
		mainWindow.show();
	}
});

app.on("ready", () => {
	mainWindow = createMainWindow();
	setApplicationMenu(mainWindow);

	if (!is.dev()) {
		autoUpdater.checkForUpdatesAndNotify();
		autoUpdater.on("update-available", (info) => {
			console.log('Found new version', info)
			let appUpdatePath = path.join(process.resourcesPath, 'app-update.yml')
			if (!fs.existsSync(appUpdatePath)) {
				return // shouldn't work anyway since updater bases its data on this file
			}
			const appUpdate = YAML.parse(fs.readFileSync(appUpdatePath))
			if (appUpdate.provider != 'github') {
				console.error('Update provided by an unhandled provider')
				return // unhandled provider
			}

			let ignored = store.get('ignored_updates') || []
			if (ignored.indexOf(info.version) !== -1) {
				return // should ignore that one
			}

			const url = `https://github.com/${appUpdate.owner}/${appUpdate.repo}/releases/latest`
			const dialogOpts = {
				type   : "info",
				buttons: ["Remind me later", "Open page", "Ignore this version"],
				title  : "Application Update",
				message: "A new version is available",
				detail : 
					`A new version is available and can be downloaded at ${url}`
			};
			const result = electron.dialog.showMessageBox(dialogOpts);
			switch (result) {
				case 0:
					break;
				case 1:
					electron.shell.openExternal(url)
					break;
				case 2:
					ignored.push(info.version)
					store.set('ignored_updates', ignored)
					break;
			}
		});
	}

	// Optimized for Mac OS X
	if (process.platform === "darwin") {
		var forceQuit = false;
		app.on("before-quit", () => {
			forceQuit = true;
		});
		mainWindow.on("close", event => {
			if (!forceQuit) {
				event.preventDefault();
				mainWindow.hide();
			}
		});
	}
});
