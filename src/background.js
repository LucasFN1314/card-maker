'use strict'

import { app, protocol, BrowserWindow, ipcMain } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
const { download } = require("electron-dl");
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const isDevelopment = process.env.NODE_ENV !== 'production';
const isLinux = true;

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

async function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {

      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      //nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      //contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION
      nodeIntegration: !true,
      contextIsolation: !false,
      preload: path.join(__dirname, 'preload.js'),
    }

  })
  console.log("HERE", path.join(__dirname, 'preload.js'));

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }

  return win;
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS3_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  let win = await createWindow();
  let Linux = isLinux;

  ipcMain.on("download", async (event, info) => {
    try {
      const data = info.url.replace(/^data:image\/\w+;base64,/, "");
      const buf = Buffer.from(data, "base64");

      let out = `${process.env.FILE_SAVE_DIRECTORY}${info.properties.name}.png`;
      console.log(`${info.properties.name}`)
      if(!Linux && info.properties.directory) {
        out = `${info.properties.directory}${info.properties.name}.png`;
      }

      await fsPromises.writeFile(out, buf);
      event.sender.send("downloadComplete");
    }
    catch (e) { console.log(e); }

  });

  ipcMain.on("getList", async (event, info) => {
    fs.readFile(`${process.env.FILE_LIST_DIRECTORY}${process.env.FILE_LIST_NAME}`, 'utf8', function (err, data) {
      win.webContents.send("getListResponse", {data: data});
    });
  });

  ipcMain.on("isLinux", async () => {
    win.webContents.send("isLinuxResponse", {data: Linux});
  });

  process.env.FILE_SAVE_DIRECTORY = "./files/";
  process.env.FILE_LIST_DIRECTORY = "./data/";
  process.env.FILE_LIST_NAME = "invitados.txt";
})
// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}

