export const settings = {
    width: 200,
    height: 200,
    animate: true,
    clear: false,
};

const sketch = () => {
    return ({ context, width, height, time }) => {
        const r = Math.abs(Math.sin(time * 0.001)) * 255;
        const x = time / 100;
        context.fillStyle = `rgb(${r}, 100, 100)`;
        context.fillRect(x, height / 2, x + 30, height / 2);
    };
};

export default sketch;
