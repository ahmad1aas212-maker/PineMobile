import { transpile, run, VERSION } from "@nullarch/resin";

function execute(source, bars, chartTf, inputs = {}) {
  try {
    const compiled = transpile(source, {
      chartTf: String(chartTf || "5"),
      syminfo: {
        mintick: 0.01,
        pricescale: 100,
        minmove: 1,
        mincontract: 1,
        pointvalue: 1,
        timezone: "UTC",
        type: "stock",
        prefix: "PINE",
        ticker: "SYNTH"
      }
    });
    if (!compiled.ok) return { ok: false, errors: compiled.errors, version: VERSION };
    const result = run(compiled, bars, { inputs });
    return {
      ok: true,
      version: VERSION,
      plots: result.plots,
      viz: result.viz || null,
      finalVarState: result.finalVarState
    };
  } catch (error) {
    return { ok: false, errors: [String(error && error.message || error)], version: VERSION };
  }
}

globalThis.PineLabEngine = { execute, version: VERSION };
