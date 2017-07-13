/*
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import {app, BrowserWindow, ipcMain} from 'electron';
import url = require('url');
import path = require('path');
import {log} from './logger';

// retain a reference to the window, otherwise it gets gc-ed
let w: Electron.BrowserWindow|null = null;

function createWindow(): Electron.BrowserWindow {
  log('Creating window.');
  w = new BrowserWindow(
      {width: 1280, height: 720, icon: 'assets/app_icon.png'});
  w.loadURL(url.format({
    pathname: path.join(path.dirname(__dirname), 'index.html'),
    protocol: 'file:',
    slashes: true
  }));
  w.on('close', () => {
    // allow window to be gc-ed
    w = null;
  });
  ipcMain.on('app-focus', () => {
    log('Main process is gaining focus');
    app.focus();
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
  if (w === null) {
    log('Creating a new window');
    w = createWindow();
  }
});
