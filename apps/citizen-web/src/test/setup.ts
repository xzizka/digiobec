import '@testing-library/jest-dom/vitest';

// axe-core's color-contrast check probes a canvas to detect icon ligatures;
// jsdom has no canvas implementation, so stub it to keep a11y runs quiet.
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = (() =>
    function getContext() {
      return null;
    })() as typeof HTMLCanvasElement.prototype.getContext;
}
