"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var path = require("node:path");
var nextServer;
function createWindow() {
    var win = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            //   preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
        },
    });
    // Handle your API Route Downloads
    win.webContents.session.on("will-download", function (event, item) {
        // This intercepts your API download route
        // You can set a default path or let Electron prompt 'Save As'
        console.log("Downloading: ".concat(item.getFilename()));
    });
    win.webContents.openDevTools();
    // Load the local Next.js server
    var startUrl = "http://127.0.0.1:3000";
    var loadURLWithRetry = function () {
        win.loadURL(startUrl).catch(function (err) {
            console.log("Next.js server is booting up. Retrying in 1 second...");
            setTimeout(loadURLWithRetry, 1000);
        });
    };
    loadURLWithRetry();
}
var isProd = process.env.NODE_ENV === "production";
electron_1.app.whenReady().then(function () {
    // 1. Start Next.js as a Utility Process
    var serverPath = isProd
        ? path.join(electron_1.app.getAppPath().replace("app.asar", "app.asar.unpacked"), ".next/standalone/server.js")
        : path.join(electron_1.app.getAppPath(), ".next/standalone/server.js");
    nextServer = electron_1.utilityProcess.fork(serverPath, [], {
        env: __assign(__assign({}, process.env), { PORT: "3000", NODE_ENV: "production", UPLOADTHING_TOKEN: "eyJhcGlLZXkiOiJza19saXZlX2JjMjQ4OGE4N2ZhMGQ2MDJkMTA0YzFjZDI5ZmVjYjFjOTljM2ZiZTY0NTUzYWU1ZWFhN2Q2N2U5YjBiNmQwM2EiLCJhcHBJZCI6InQ3c251dm5lYjkiLCJyZWdpb25zIjpbInNlYTEiXX0=" }),
        stdio: "inherit",
    });
    nextServer.on("spawn", function () {
        // 2. Open window once server is live
        createWindow();
    });
});
electron_1.app.on("window-all-closed", function () {
    if (nextServer)
        nextServer.kill();
    if (process.platform !== "darwin")
        electron_1.app.quit();
});
