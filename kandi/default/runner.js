import sketch, { settings, exportSettings } from "./sketch.js";
import paperSizes from "./paper-sizes.js";
import validUnits from "./units.js";

const ws = new WebSocket("ws://localhost:3000");
ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === "reload") location.reload();
};
const canvas = document.querySelector("#sketch");
// 1. Resolve dimensions based on provided settings object
let dpi = 96; // Default
let units = "px"; // Default
const MIL2PIX = 25.4;
let dimensions = [];

// Check if dpi is defined in settings
if (settings.hasOwnProperty("dpi")) {
    if (Number.isInteger(settings.dpi)) {
        dpi = settings.dpi;
    } else {
        dpi = Math.round(settings.dpi);
        console.warn("DPI setting is not an integer value.");
    }
}
// Check if units is defined in settings

if (settings.hasOwnProperty("units")) {
    if (
        typeof settings.units === "string" ||
        settings.units instanceof String
    ) {
        if (validUnits.hasOwnProperty(settings.units)) {
            units = settings.units;
        }
    } else {
        throw new Error(
            "Defined units parameter in the settings object is not a valid units type.",
        );
    }
}

// Check if dimensions are defined in settings
let baseUnits = "";
if (settings.hasOwnProperty("dimensions")) {
    if (
        typeof settings.dimensions === "string" ||
        settings.dimensions instanceof String
    ) {
        // Should be a template
        if (paperSizes.hasOwnProperty(settings.dimensions)) {
            // Exists so find dimensions in base units
            dimensions = [
                paperSizes[settings.dimensions].width,
                paperSizes[settings.dimensions].height,
            ];
            // Find base units for later rescaling based on conversion possibly to defined units
            baseUnits = paperSizes[settings.dimensions].units;
        } else {
            throw new Error(
                "Defined dimensions parameter in the settings object is not a valid paper size.",
            );
        }
    } else if (
        Array.isArray(settings.dimensions) &&
        settings.dimensions.length === 2
    ) {
        if (
            typeof settings.dimensions[0] === "number" &&
            typeof settings.dimensions[1] === "number"
        ) {
            dimensions = settings.dimensions;
            baseUnits = units;
        } else {
            throw new Error(
                "Provided values in the dimensions array are not of type Number.",
            );
        }
    } else {
        throw new Error(
            "The provided dimensions field in the settings object has the wrong type.",
        );
    }
} else {
    throw new Error("No dimensions are provided in the settings object.");
}
// Actually resolve/rescale dimensions based on provided DPI and units
if (units === "px" && baseUnits === "px") {
    // pure pixel dimensions, no conversion needed
} else {
    const sourceUnits = baseUnits === "" ? units : baseUnits;
    const toMM = validUnits[sourceUnits].factor;
    const eqMillimeters = [dimensions[0] * toMM, dimensions[1] * toMM];
    dimensions = [
        (eqMillimeters[0] / MIL2PIX) * dpi,
        (eqMillimeters[1] / MIL2PIX) * dpi,
    ];
}
const width = dimensions[0];
const height = dimensions[1];
canvas.width = width;
canvas.height = height;
const context = canvas.getContext("2d");
const render = sketch();

const loop = (timestamp) => {
    if (settings.clear) {
        context.clearRect(0, 0, width, height);
    }
    render({ context, width, height, time: timestamp });
    requestAnimationFrame(loop);
};
if (settings.animate) {
    requestAnimationFrame(loop);
} else {
    render({ context, width, height });
}

// Utility functions
//
const fitToViewport = () => {
    const padding = 0.9;
    const scaleX = (window.innerWidth * padding) / canvas.width;
    const scaleY = (window.innerHeight * padding) / canvas.height;
    const scale = Math.min(scaleX, scaleY);
    canvas.style.transform = `translate(-50%, -50%) scale(${scale})`;
};

fitToViewport();
window.addEventListener("resize", fitToViewport);

// Exporting an image
let prefix = null;
let custom = null;
let seed = null;
let today = new Date();
let date =
    today.getFullYear().toString() +
    (today.getMonth() + 1).toString().padStart(2, "0") +
    today.getDate().toString().padStart(2, "0");
let suffix = null;
let ext = ".png";

if (exportSettings.hasOwnProperty("prefix")) {
    if (typeof exportSettings.prefix === "string") {
        prefix = exportSettings.prefix;
    } else {
        throw new Error(
            "Prefix defined in export settings object has not the type of String.",
        );
    }
}

if (exportSettings.hasOwnProperty("custom")) {
    if (typeof exportSettings.custom === "string") {
        custom = exportSettings.custom;
    } else {
        throw new Error(
            "Custom input defined in export settings object has not the type of String.",
        );
    }
}

if (exportSettings.hasOwnProperty("seed")) {
    if (typeof exportSettings.seed === "string") {
        seed = exportSettings.seed;
    } else {
        throw new Error(
            "Seed input defined in export settings object has not the type of String.",
        );
    }
}

if (exportSettings.hasOwnProperty("suffix")) {
    if (typeof exportSettings.suffix === "string") {
        suffix = exportSettings.suffix;
    } else {
        throw new Error(
            "Suffix input defined in export settings object has not the type of String.",
        );
    }
}

window.onkeydown = keyListener;
window.onkeyup = keyListener;
let exportKeys = {};
let exportCount = 0;
let imageData = "";
function keyListener(event) {
    exportKeys[event.key] = event.type == "keydown";
    // console.log(`${event.key}`);
    // console.log(exportKeys);
    if (exportKeys["Control"] && exportKeys["s"]) {
        event.preventDefault();
        exportCount++;
        const count = exportCount.toString().padStart(3, "0");
        let exportName = "";
        if (prefix !== null) {
            exportName += prefix + "-";
        }
        if (custom !== null) {
            exportName += custom + "-";
        }
        if (seed !== null) {
            exportName += seed + "-";
        }
        exportName += date;
        if (suffix !== null) {
            exportName += "-" + suffix + "-" + count + ext;
        } else {
            exportName += count + ext;
        }
        imageData = canvas.toDataURL().split(",")[1];
        ws.send(
            JSON.stringify({
                type: "export",
                filename: exportName,
                data: imageData,
            }),
        );
    }
}
