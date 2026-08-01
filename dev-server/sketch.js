export const settings = {
    dimensions: "A4", //in units; can also be "A4" for example.
    dpi: 300, // e.g. for print
    units: "mm", // centimeters
    animate: false,
    clear: false,
};
// file will be calles prefix-custom-seed-date-count.png
export const exportSettings = {
    prefix: "prefix",
    custom: "custom",
    // seed: seed,
    suffix: "suffix",
};

const sketch = () => {
    return ({ context, width, height, time }) => {
        context.fillRect(
            width / 2 - width / 10,
            height / 2 - height / 10,
            width / 5,
            height / 5,
        );
    };
};

export default sketch;
