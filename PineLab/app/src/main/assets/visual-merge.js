(() => {
'use strict';

const COLLECTIONS = [
  'shapes', 'chars', 'arrows', 'candles', 'plotbars',
  'hlines', 'drawings', 'bgcolors', 'barcolors', 'plots'
];

function mergeIndicatorOutputs(outputs) {
  const merged = { plots: [], viz: {} };
  for (const key of COLLECTIONS) merged.viz[key] = [];
  merged.viz.fills = [];

  let plotOffset = 0;
  let hlineOffset = 0;

  for (const output of outputs || []) {
    const ownPlots = Array.isArray(output && output.plots) ? output.plots : [];
    const ownViz = output && output.viz ? output.viz : {};

    merged.plots.push(...ownPlots);

    for (const key of COLLECTIONS) {
      const value = ownViz[key];
      if (Array.isArray(value)) merged.viz[key].push(...value);
      else if (value != null) merged.viz[key].push(value);
    }

    for (const fill of Array.isArray(ownViz.fills) ? ownViz.fills : []) {
      const copy = { ...fill };
      for (const side of ['a', 'b']) {
        const ref = fill && fill[side];
        if (!ref || !Number.isFinite(Number(ref.index))) continue;
        const offset = ref.kind === 'plot' ? plotOffset
          : ref.kind === 'hline' ? hlineOffset : 0;
        copy[side] = { ...ref, index: Number(ref.index) + offset };
      }
      merged.viz.fills.push(copy);
    }

    plotOffset += ownPlots.length;
    hlineOffset += Array.isArray(ownViz.hlines) ? ownViz.hlines.length
      : ownViz.hlines == null ? 0 : 1;
  }

  return merged;
}

globalThis.PineLabVisualMerge = mergeIndicatorOutputs;
})();
