#!/usr/bin/env node

// Loading packages
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawn } = require("child_process");

// Variables
const cwd = process.cwd();
const defaultFilesPath = path.join(__dirname, "default");
const dataPath = path.join(__dirname, "data");
const configPath = path.join(os.homedir(), ".kandi", "config.json");
let globalConfig = {};
if (fs.existsSync(configPath)) {
    globalConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
}
let defaultOutputPath = "/mnt/d/DefaultDownloads/";
const defaultSketchName = "sketch";
const devServerPath = path.join(__dirname, "dev.js");

let isNew = false;
let sketchName = "";
let isDev = false;
let isJump = false;
let outputPath = "";
let isConfig = false;
let verbose = false;
// Parsing arguments

const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
    if (args[i] === "new") {
        isNew = true;
        sketchName = args[i + 1].toString();
    } else if (args[i] === "dev") {
        isDev = true;
        sketchName =
            args[i + 1] && !args[i + 1].startsWith("--")
                ? path.basename(args[i + 1], ".js")
                : defaultSketchName;
        if (!args[i + 1] || args[i + 1].startsWith("--")) {
            console.warn(
                `No sketch name provided, using default: '${defaultSketchName}'`,
            );
        }
    } else if (args[i] === "jump") {
        isJump = true;
        sketchName =
            args[i + 1] && !args[i + 1].startsWith("--")
                ? path.basename(args[i + 1], ".js")
                : defaultSketchName;
        if (!args[i + 1] || args[i + 1].startsWith("--")) {
            console.warn(
                `No sketch name provided, using default: '${defaultSketchName}'`,
            );
        }
    } else if (args[i] === "--output") {
        outputPath = path.resolve(args[i + 1]);
    } else if (args[i] === "--config") {
        isConfig = true;
        fs.mkdirSync(path.resolve(args[args.indexOf("--config") + 1]), {
            recursive: true,
        });
        defaultOutputPath = path.resolve(args[i + 1]);
    } else if (args[i] === "--verbose") {
        verbose = true;
    }
}

// Resolve output path based on priority
const resolvedOutputPath =
    outputPath || globalConfig.defaultOutputPath || defaultOutputPath;

// Verbose logging function
const log = verbose ? console.log : () => {};

// isNew command execution
if (isNew) {
    newSketch();
} else if (isDev) {
    runDev();
} else if (isJump) {
    newSketch();
    runDev();
} else if (isConfig) {
    const kandiDir = path.join(os.homedir(), ".kandi");
    fs.mkdirSync(kandiDir, { recursive: true });
    const newConfig = { defaultOutputPath };
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
    console.log(`Default output path set to: ${defaultOutputPath}`);
} else {
    console.error("No command specified.");
    process.exit(1);
}

// isNew Function
function newSketch() {
    const baseName = path.basename(sketchName, ".js");
    const newSketchPath = path.join(cwd, baseName);
    fs.mkdirSync(newSketchPath);
    fs.cpSync(defaultFilesPath, newSketchPath, { recursive: true });
    fs.cpSync(dataPath, newSketchPath, { recursive: true });
    fs.renameSync(
        path.join(newSketchPath, "sketch.js"),
        path.join(newSketchPath, baseName + ".js"),
    );

    const runnerPath = path.join(newSketchPath, "runner.js");
    const runnerContent = fs.readFileSync(runnerPath, "utf8");
    const updatedRunner = runnerContent.replace(
        "./sketch.js",
        `./${baseName}.js`,
    );
    fs.writeFileSync(runnerPath, updatedRunner);
    log(`Created new sketch folder at ${newSketchPath}`);
    log(`Copied default files and data files into the sketch folder.`);
}

// isDev Function
function runDev() {
    const baseName = path.basename(sketchName, ".js");
    const newSketchPath = path.join(cwd, baseName);
    const kandiConfig = {
        sketchFile: baseName + ".js",
        outputPath: resolvedOutputPath,
    };
    fs.writeFileSync(
        path.join(newSketchPath, ".kandi.json"),
        JSON.stringify(kandiConfig, null, 2),
    );
    const devProcess = spawn("node", [devServerPath], {
        cwd: newSketchPath,
        stdio: "inherit",
    });
}
