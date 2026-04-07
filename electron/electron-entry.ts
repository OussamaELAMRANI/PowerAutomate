import { BrowserWindow, app, utilityProcess } from "electron";
import * as path from "node:path";
import type { UtilityProcess } from "electron";

let nextServer: UtilityProcess;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      //   preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
  });

  // Handle your API Route Downloads
  win.webContents.session.on("will-download", (event, item) => {
    // This intercepts your API download route
    // You can set a default path or let Electron prompt 'Save As'
    console.log(`Downloading: ${item.getFilename()}`);
  });

  win.webContents.openDevTools()

  // Load the local Next.js server

  const startUrl = "http://127.0.0.1:3000";

  const loadURLWithRetry = () => {
    win.loadURL(startUrl).catch((err) => {
      console.log("Next.js server is booting up. Retrying in 1 second...");
      setTimeout(loadURLWithRetry, 1000);
    });
  };

  loadURLWithRetry();
}
const isProd = process.env.NODE_ENV === "production";
app.whenReady().then(() => {
  // 1. Start Next.js as a Utility Process

  const serverPath = isProd
    ? path.join(
        app.getAppPath().replace("app.asar", "app.asar.unpacked"),
        ".next/standalone/server.js",
      )
    : path.join(app.getAppPath(), ".next/standalone/server.js");

  nextServer = utilityProcess.fork(serverPath, [], {
    env: {
      ...process.env,
      PORT: "3000",
      NODE_ENV: "production",
      UPLOADTHING_TOKEN:
        "eyJhcGlLZXkiOiJza19saXZlX2JjMjQ4OGE4N2ZhMGQ2MDJkMTA0YzFjZDI5ZmVjYjFjOTljM2ZiZTY0NTUzYWU1ZWFhN2Q2N2U5YjBiNmQwM2EiLCJhcHBJZCI6InQ3c251dm5lYjkiLCJyZWdpb25zIjpbInNlYTEiXX0=",
    },
    stdio: "inherit",
  });

  nextServer.on("spawn", () => {
    // 2. Open window once server is live
    createWindow();
  });
});

app.on("window-all-closed", () => {
  if (nextServer) nextServer.kill();
  if (process.platform !== "darwin") app.quit();
});
