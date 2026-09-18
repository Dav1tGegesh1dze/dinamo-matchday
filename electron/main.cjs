// Desktop wrapper: one fullscreen window showing the built game from dist/. Everything else
// (offline assets, localStorage results, admin export) works exactly as in the browser.
const { app, BrowserWindow } = require('electron');
const path = require('path');

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    fullscreen: true,
    autoHideMenuBar: true,
    backgroundColor: '#000000',
    webPreferences: { contextIsolation: true, sandbox: true },
  });
  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

app.on('window-all-closed', () => app.quit());
