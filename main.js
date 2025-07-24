const { app, BrowserWindow, screen } = require("electron");
const session = require("electron").session;
const path = require("path");
const fs = require("fs");
const os = require("os");
const { autoUpdater } = require("electron-updater");

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// Base data directory in Documents
const homeDir = os.homedir();
const dataDir = path.join(homeDir, "Documents", "YTheatre");
const extensionsDir = path.join(dataDir, "extensions");
const configPath = path.join(dataDir, "config.ini");

// Ensure folders exist
fs.mkdirSync(extensionsDir, { recursive: true });

// Default configuration
let config = {
  startInFullScreen: false,
  preferedDisplay: 1,
  defaultWidth: 1920,
  defaultHeight: 1080,
  insetTitleBar: true,
};

// Parse config.ini
function parseConfig() {
  if (!fs.existsSync(configPath)) {
    const defaultConfig = `
startInFullScreen=false
preferedDisplay=1
defaultWidth=1920
defaultHeight=1080
insetTitleBar=true
`;
    fs.writeFileSync(configPath, defaultConfig.trim());
  }

  const data = fs.readFileSync(configPath, "utf-8");
  const lines = data.split(/\r?\n/);

  lines.forEach((line) => {
    const [key, value] = line.split("=").map((item) => item.trim());
    if (key in config) {
      if (typeof config[key] === "boolean") {
        config[key] = value.toLowerCase() === "true";
      } else if (typeof config[key] === "number") {
        config[key] = parseInt(value, 10);
      }
    }
  });
}

const createWindow = () => {
  // Get display configuration
  const displays = screen.getAllDisplays();
  const displayIndex = Math.max(
    0,
    Math.min(config.preferedDisplay - 1, displays.length - 1)
  );
  const display = displays[displayIndex];

  // Window configuration
  const winOptions = {
    width: config.defaultWidth,
    height: config.defaultHeight,
    icon: path.join(__dirname, "images/icon.ico"),
    x:
      display.bounds.x +
      Math.round((display.bounds.width - config.defaultWidth) / 2),
    y:
      display.bounds.y +
      Math.round((display.bounds.height - config.defaultHeight) / 2),
    fullscreen: config.startInFullScreen,
    webPreferences: {
      preload: path.join(__dirname, "scripts/inject.js"),
    },
  };

  if (config.insetTitleBar) {
    winOptions.titleBarStyle = "hidden";
    winOptions.titleBarOverlay = {
      color: "#00000000",
      symbolColor: "#f1f1f1",
      height: 40,
    };
  }

  const win = new BrowserWindow(winOptions);
  win.setMenuBarVisibility(false);

  // Load YouTube first so win.webContents exists
  win.loadURL("https://www.youtube.com/", {
    userAgent: "GoogleTV/092754",
  });
};

app.whenReady().then(async () => {
  parseConfig();
  if (fs.existsSync(extensionsDir)) {
    const extFolders = fs
      .readdirSync(extensionsDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);
    for (const ext of extFolders) {
      try {
        await session.defaultSession.extensions.loadExtension(
          path.join(extensionsDir, ext),
          { allowFileAccess: true }
        );
      } catch (err) {
        alert(`Failed to load extension ${ext}:`, err);
      }
    }
  }
  createWindow();

  autoUpdater.checkForUpdates();
});
