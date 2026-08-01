const http = require("http");
const fs = require("fs");
const chokidar = require("chokidar");
const path = require("path");
const WebSocket = require("ws");

const PORT = 3000;
const DIR = process.cwd();

const TYPES = {
    ".html": "text/html",
    ".js": "text/javascript",
};

const server = http.createServer((req, res) => {
    // 1. figure out which file is being requested
    // hint: req.url is the path the browser asked for e.g. '/' or '/runner.js'
    // '/' should serve index.html
    const url = req.url;
    let filePath = "";
    if (url === "/") {
        filePath = path.join(process.cwd(), "index.html");
    } else {
        filePath = path.join(process.cwd(), url);
    }

    // 2. read the file from disk
    if (!fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end("Not found");
        return;
    }
    const file = fs.readFileSync(filePath);
    const type = TYPES[path.extname(filePath)];
    // 3. send it back with the right Content-Type header

    res.writeHead(200, { "content-type": type });
    res.write(file);
    res.end();
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

// 4. create a WebSocket server that shares the http server
const wss = new WebSocket.Server({ server });

// 5. watch files and notify clients on change

chokidar
    .watch(DIR, {
        ignored: /node_modules/,
        ignoreInitial: true,
        usePolling: true,
        interval: 100,
    })
    .on("change", (filepath) => {
        if (!filepath.endsWith(".js")) return;
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: "reload" }));
            }
        });
    });
// Handle exporting image from browser

const defaultPath = "/mnt/d/DefaultDownloads/";
wss.on("connection", (client) => {
    client.on("message", (message) => {
        const msg = JSON.parse(message);
        if (msg.type === "export") {
            const buffer = Buffer.from(msg.data, "base64");
            fs.writeFileSync(path.join(defaultPath, msg.filename), buffer);
        } else if (msg.type === "reload") {
        }
    });
});
