import { app, BrowserWindow, shell } from "electron";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import net from "net";

/* ──────────────────── Constants ──────────────────── */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const IS_PACKAGED = app.isPackaged;

let mainWindow = null;
let serverProcess = null;
let serverPort = null;

/* ──────────────────── Helpers ──────────────────── */

/** Pick a random free TCP port. */
function findFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
    srv.on("error", reject);
  });
}

/** Poll until `port` accepts a TCP connection, or `timeout` ms elapse. */
function waitForServer(port, timeout = 30_000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const socket = new net.Socket();
      socket.setTimeout(1_000);
      socket.once("connect", () => {
        socket.destroy();
        resolve();
      });
      socket.once("error", () => {
        socket.destroy();
        if (Date.now() - start > timeout) {
          reject(new Error(`Server did not start within ${timeout}ms`));
        } else {
          setTimeout(check, 250);
        }
      });
      socket.once("timeout", () => {
        socket.destroy();
        setTimeout(check, 250);
      });
      socket.connect(port, "127.0.0.1");
    };
    check();
  });
}

/**
 * Resolve the path to the standalone `server.js`.
 * - Dev/preview: <project>/electron/standalone/server.js  (populated by postbuild)
 * - Packaged:    <resources>/standalone/server.js
 */
function getServerPath() {
  if (IS_PACKAGED) {
    return path.join(process.resourcesPath, "standalone", "server.js");
  }
  return path.join(__dirname, "standalone", "server.js");
}

/* ──────────────────── Boot ──────────────────── */

async function startApp() {
  try {
    serverPort = await findFreePort();
    const serverPath = getServerPath();
    const serverDir = path.dirname(serverPath);

    console.log(`🚀 Starting Next.js server on port ${serverPort}…`);
    console.log(`   Path: ${serverPath}`);

    // ELECTRON_RUN_AS_NODE=1 makes the Electron binary behave as plain Node,
    // so we don't need a separate Node installation on the user's machine.
    serverProcess = spawn(process.execPath, [serverPath], {
      cwd: serverDir,
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: "1",
        NODE_PATH: path.join(serverDir, "node_modules"),
        PORT: String(serverPort),
        HOSTNAME: "127.0.0.1",
        NODE_ENV: "production",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    // Forward server logs so they appear in the Electron console / DevTools
    serverProcess.stdout?.on("data", (d) => process.stdout.write(d));
    serverProcess.stderr?.on("data", (d) => process.stderr.write(d));

    serverProcess.on("exit", (code, signal) => {
      console.log(`⚠ Next.js server exited (code=${code} signal=${signal})`);
      serverProcess = null;
    });

    await waitForServer(serverPort);
    console.log("✅ Server ready");

    /* ──── Create Window ──── */
    mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 800,
      minHeight: 600,
      title: "PowerAutomate",
      backgroundColor: "#f9fafb",
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
      show: false, // show only after content is painted
    });

    // Graceful show
    mainWindow.once("ready-to-show", () => mainWindow.show());

    // Open external links in the system browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: "deny" };
    });

    await mainWindow.loadURL(`http://127.0.0.1:${serverPort}`);
  } catch (err) {
    console.error("❌ Startup error:", err);
  }
}

/* ──────────────────── Lifecycle ──────────────────── */

app.whenReady().then(startApp);

app.on("activate", () => {
  // macOS: re-create window when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    startApp();
  }
});

app.on("window-all-closed", () => {
  killServer();
  if (process.platform !== "darwin") app.quit();
});

function killServer() {
  if (!serverProcess) return;
  try {
    serverProcess.kill("SIGTERM");
  } catch {
    /* already dead */
  }
  serverProcess = null;
}

process.on("exit", killServer);
process.on("SIGINT", () => { killServer(); process.exit(); });
process.on("SIGTERM", () => { killServer(); process.exit(); });
