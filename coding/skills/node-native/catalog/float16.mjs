// IEEE 754 half-precision floats: arrays, rounding, DataView access.
const values = [1.337, 2.5, -0, 65504, 65520, 1e-8, 6e-8, Number.NaN, -Infinity];
const written = (write) => {
  const view = new DataView(new ArrayBuffer(4));
  write(view);
  return [...new Uint8Array(view.buffer)];
};

export default {
  apis: ['js:Float16Array', 'js:Math.f16round', 'js:DataView.prototype.getFloat16', 'js:DataView.prototype.setFloat16'],
  reviewedAt: 'v26.13.0',
  replaces: {
    '@petamoriken/float16@3.9.3': {
      Float16Array: {
        native: () => [...new Float16Array(values)],
        package: ({ Float16Array: Polyfill }) => [...new Polyfill(values)],
      },
      f16round: {
        native: () => values.map(Math.f16round),
        package: ({ f16round }) => values.map(f16round),
      },
      hfround: {
        native: () => values.map(Math.f16round),
        package: ({ hfround }) => values.map(hfround),
      },
      setFloat16: {
        native: () => [written((view) => view.setFloat16(0, 1.337)), written((view) => view.setFloat16(2, -2.5, true))],
        package: ({ setFloat16 }) => [written((view) => setFloat16(view, 0, 1.337)), written((view) => setFloat16(view, 2, -2.5, true))],
      },
      getFloat16: {
        native: () => {
          const view = new DataView(new Uint8Array([0x3d, 0x59, 0x59, 0x3d]).buffer);
          return [view.getFloat16(0), view.getFloat16(2, true)];
        },
        package: ({ getFloat16 }) => {
          const view = new DataView(new Uint8Array([0x3d, 0x59, 0x59, 0x3d]).buffer);
          return [getFloat16(view, 0), getFloat16(view, 2, true)];
        },
      },
    },
  },
};
