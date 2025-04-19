import { app, BrowserWindow, protocol } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isDev = !app.isPackaged;

// Register a custom protocol for loading local files
function createProtocol() {
  protocol.registerFileProtocol('app', (request, callback) => {
    const url = request.url.replace('app://', '');
    try {
      return callback(path.normalize(`${__dirname}/${url}`));
    } catch (error) {
      console.error('Error loading file:', error);
      return callback({ error: -2 });
    }
  });
}

function createWindow() {
  console.log("Creating window...");

  // Disable the cache
  app.commandLine.appendSwitch('disable-http-cache');
  app.commandLine.appendSwitch('disable-gpu-cache');
  app.commandLine.appendSwitch('disable-software-rasterizer');

  // Set app data path to a temporary directory to avoid cache issues
  const tempPath = path.join(os.tmpdir(), 'gentle-scholars-portal');
  if (!fs.existsSync(tempPath)) {
    fs.mkdirSync(tempPath, { recursive: true });
  }
  app.setPath('userData', tempPath);

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  // Only open DevTools in development mode
  if (isDev) {
    win.webContents.openDevTools();
  }

  if (isDev) {
    // In development, use the Vite dev server
    console.log("Loading Vite dev server...");
    win.loadURL('http://localhost:5173');
  } else {
    // In production, use the built files
    console.log("Loading production build...");
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    console.log("Loading file:", indexPath);
    win.loadFile(indexPath);
  }

  // Handle navigation errors
  win.webContents.on('did-fail-load', (_event, code, desc) => {
    console.error("Failed to load window:", code, desc);
    if (isDev) {
      // If development server fails, try loading the built files
      console.log("Trying built files as fallback...");
      const indexPath = path.join(__dirname, 'dist', 'index.html');
      win.loadFile(indexPath);
    }
  });

  // Log when the window is ready
  win.webContents.on('did-finish-load', () => {
    console.log("Window loaded successfully");
  });
}

// Wait for the app to be ready
app.whenReady().then(() => {
  console.log("App ready!");
  
  // Register the custom protocol
  createProtocol();
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
