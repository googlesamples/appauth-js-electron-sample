import { app, BrowserWindow } from 'electron';
import url = require('url');
import path = require('path');
import { log } from './logger';

// retain a reference to the window, otherwise it gets gc-ed
let w: Electron.BrowserWindow | null = null;

function createWindow(): Electron.BrowserWindow {
  log('Creating window.');
  w = new BrowserWindow({ width: 1920, height: 1080 });
  w.loadURL(url.format({
    pathname: path.join(path.dirname(__dirname), 'index.html'),
    protocol: 'file:',
    slashes: true
  }));
  // open dev tools
  w.webContents.openDevTools();
  w.on('close', () => {
    // allow window to be gc-ed
    w = null;
  });
  return w;
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  log('All windows closed');
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('activate', () => {
  log('Activating');
  if (!!w) {
    w = createWindow();
  }
});
