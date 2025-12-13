const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let mainWindow;
let tray = null;
let pyProc = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // 不自動顯示，啟動時放在系統列
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');

  // 當使用者選擇在系統列開啟視窗時顯示
  mainWindow.on('close', (e) => {
    // 當按關閉時，預設行為是最小化到系統列
    if (!app.isQuiting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

// Handle IPC request to read data
ipcMain.handle('read-data', async () => {
  try {
    // 從 backend 資料夾讀取記錄檔
    const dataPath = path.join(__dirname, '..', 'backend', 'data.json');
    const data = fs.readFileSync(dataPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data:', error);
    return [];
  }
});

function createTray() {
  const iconPath = path.join(__dirname, '..', 'imgs', 'icon.png');
  let icon = null;
  try {
    icon = nativeImage.createFromPath(iconPath);
  } catch (e) {
    console.warn('Tray icon load failed:', e);
  }

  tray = new Tray(icon || undefined);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      }
    },
    {
      label: 'Quit',
      click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);
  tray.setToolTip('App Usage Analyzer');
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => {
    mainWindow.show();
    mainWindow.focus();
  });
}

function startPythonBackground() {
  // 指向 backend 的 project.py
  const scriptPath = path.join(__dirname, '..', 'backend', 'project.py');

  // 使用系統上的 python 或 py（Windows）。你可以改為完整 python 執行檔路徑。
  // 優先使用 backend/.venv 的 python（若存在），否則 fallback 到系統 python
  const venvPythonWin = path.join(__dirname, '..', 'backend', '.venv', 'Scripts', 'python.exe');
  const venvPythonUnix = path.join(__dirname, '..', 'backend', '.venv', 'bin', 'python');
  let pythonCmd = process.platform === 'win32' ? 'py' : 'python3';
  if (fs.existsSync(venvPythonWin)) {
    pythonCmd = venvPythonWin;
  } else if (fs.existsSync(venvPythonUnix)) {
    pythonCmd = venvPythonUnix;
  }

  try {
    pyProc = spawn(pythonCmd, [scriptPath], {
      cwd: path.dirname(scriptPath),
      stdio: ['ignore', 'pipe', 'pipe']
    });

    pyProc.stdout.on('data', (data) => {
      console.log(`[py stdout] ${data.toString()}`);
    });
    pyProc.stderr.on('data', (data) => {
      console.error(`[py stderr] ${data.toString()}`);
    });
    pyProc.on('exit', (code, signal) => {
      console.log(`Python process exited: code=${code}, signal=${signal}`);
      pyProc = null;
    });
  } catch (err) {
    console.error('Failed to start python process:', err);
  }
}

app.whenReady().then(() => {
  // 設定開機自動啟動（若你不想預設啟用，可把 openAtLogin 設為 false 或移除此段）
  try {
    app.setLoginItemSettings({
      openAtLogin: true,
      path: process.execPath,
      args: []
    });
  } catch (e) {
    console.warn('setLoginItemSettings failed:', e);
  }

  createWindow();
  createTray();
  startPythonBackground();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  // 嘗試結束 python 子程序
  if (pyProc) {
    try {
      pyProc.kill();
    } catch (e) {
      console.warn('Error killing python process:', e);
    }
  }
});
