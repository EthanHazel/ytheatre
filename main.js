const { app, BrowserWindow, screen } = require("electron");
const session = require("electron").session;
const path = require("path");
const fs = require("fs");

// Default configuration
let config = {
  startInFullScreen: false,
  preferedDisplay: 1,
  defaultWidth: 1920,
  defaultHeight: 1080,
  insetTitleBar: true,
  adBlock: true,
  sponsorBlock: true,
  controllerSupport: true,
};

// Parse config.ini
function parseConfig() {
  const configPath = path.join(__dirname, "config.ini");
  if (!fs.existsSync(configPath)) return;

  const data = fs.readFileSync(configPath, "utf-8");
  const lines = data.split("\n");

  lines.forEach((line) => {
    const [key, value] = line.split("=").map((item) => item.trim());
    if (key in config) {
      if (typeof config[key] === "boolean") {
        config[key] = value.toLowerCase() === "true";
      } else if (typeof config[key] === "number") {
        config[key] = parseInt(value);
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

  // Prepare preload scripts
  const preloadScripts = [path.join(__dirname, "scripts/titlebar.js")];
  if (config.controllerSupport) {
    preloadScripts.push(path.join(__dirname, "scripts/controller.js"));
  }

  // Window configuration
  const winOptions = {
    width: config.defaultWidth,
    height: config.defaultHeight,
    x:
      display.bounds.x +
      Math.round((display.bounds.width - config.defaultWidth) / 2),
    y:
      display.bounds.y +
      Math.round((display.bounds.height - config.defaultHeight) / 2),
    fullscreen: config.startInFullScreen,
    webPreferences: {
      preload: path.join(__dirname, "scripts/preload.js"),
      additionalArguments: [
        config.controllerSupport ? "--controller-support" : "",
      ],
    },
  };

  // Titlebar configuration
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

  win.loadURL("https://www.youtube.com/", {
    userAgent: "GoogleTV/092754",
  });
};

app.whenReady().then(async () => {
  parseConfig(); // Load configuration

  // Load extensions conditionally
  const extensions = [];
  if (config.adBlock) extensions.push("adblock");
  if (config.sponsorBlock) extensions.push("sponsorblock");

  for (const ext of extensions) {
    await session.defaultSession.loadExtension(
      path.join(__dirname, `extensions/${ext}`),
      { allowFileAccess: true }
    );
  }

  createWindow();
});
