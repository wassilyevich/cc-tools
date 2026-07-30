#!usr/bin/env node

const fs = require("fs");
const path = require("path");

// Parse arguments from process.argv
const cwd = process.cwd();
let prefix = null;
let suffix = null;
let today = new Date();
let year = today.getFullYear();
let month = today.getMonth() + 1;
let day = today.getDate();
let date =
    year.toString() +
    month.toString().padStart(2, "0") +
    day.toString().padStart(2, "0");
let dir = null;
let verbose = false;

const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
    if (args[i] === "--prefix") {
        prefix = args[i + 1];
    }
    if (args[i] === "--suffix") {
        suffix = args[i + 1];
    }
    if (args[i] === "--date") {
        date = args[i + 1];
    }
    if (args[i] === "--dir") {
        dir = path.resolve(args[i + 1]);
    }
    if (args[i] === "--verbose") {
        verbose = true;
    }
}

const targetDir = dir !== null ? dir : cwd;

const log = verbose ? console.log : () => {};
if (!fs.existsSync(targetDir)) {
    log(`${dir} does not exist.`);
    process.exit(1);
}

const renameData = { prefix, suffix, date, dir: targetDir };

const files = fs.readdirSync(targetDir);
const pngs = files.filter((file) => path.extname(file) === ".png");

log("Found .png files:");
pngs.forEach((png) => {
    log(png);
});

let skipCount = 0;
let renameCount = 0;

pngs.forEach((png) => {
    const stripped = path.basename(png, ".png");
    const parts = stripped.split("-"); // ['S', '864671', 'MAIN']
    const seed = parts[1];
    const layer = parts[2];

    if (!seed || !layer) {
        log(`Skipping ${png} — doesn't match expected pattern`);
        skipCount++;
        return;
    }

    let newName = "";
    if (renameData.prefix !== null) {
        newName += renameData.prefix + "-";
    }
    newName += seed + "-" + layer + "-" + renameData.date;
    if (renameData.suffix !== null) {
        newName += "-" + renameData.suffix + ".png";
    } else {
        newName += ".png";
    }

    log(`Renamed ${png} to --> ${newName}`);
    const oldPath = path.join(targetDir, png);
    const newPath = path.join(renameData.dir, newName);
    fs.renameSync(oldPath, newPath);
    renameCount++;
});

log("Finished script.");
log(`Renamed ${renameCount} files.`);
log(`Skipped ${skipCount} files.`);
