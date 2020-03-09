const { app, Menu, shell } = require("electron");

const { getAllPlugins, pluginsDirectory } = require("./plugins/utils");
const { isPluginEnabled, enablePlugin, disablePlugin } = require("./store");
const path = require('path')
const fs = require('fs')

module.exports.setApplicationMenu = (window) => {
	const menuTemplate = [
		{
			label  : "Plugins",
			submenu: getAllPlugins(app).map(plugin => {
				return {
					label  : path.basename(plugin),
					type   : "checkbox",
					checked: isPluginEnabled(plugin),
					click  : item => {
						if (item.checked) {
							enablePlugin(plugin);
						} else {
							disablePlugin(plugin);
						}
					}
				};
			})
		},
		{
			label: "Develop",
			submenu: [{
				label: "Toggle Dev tools",
				type: "checkbox",
				checked: window.isDevToolsOpened(),
				click: item => {
					window.toggleDevTools()
				}
			},
			{
				label: "Open plugins folder",
				click: item => {
					const pluginPath = pluginsDirectory()
					if (!fs.existsSync(pluginPath)) {
						fs.mkdirSync(pluginPath, { recursive: true })
					}
					shell.openItem(pluginPath)
				}
			}]
		}
	];

	if (process.platform === "darwin") {
		const name = app.getName();
		menuTemplate.unshift({
			label  : name,
			submenu: [
				{ role: "about" },
				{ type: "separator" },
				{ role: "hide" },
				{ role: "hideothers" },
				{ role: "unhide" },
				{ type: "separator" },
				{
					label      : "Select All",
					accelerator: "CmdOrCtrl+A",
					selector   : "selectAll:"
				},
				{ label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
				{ label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
				{ label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
				{ type: "separator" },
				{ role: "minimize" },
				{ role: "close" },
				{ role: "quit" }
			]
		});
	}

	const menu = Menu.buildFromTemplate(menuTemplate);
	Menu.setApplicationMenu(menu);
};
