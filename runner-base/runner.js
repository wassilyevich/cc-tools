import sketch, { settings } from "./sketch.js";
const width = settings.width;
const height = settings.height;
const canvas = document.querySelector("#sketch");
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
