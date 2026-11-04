import { transpile, run, VERSION } from "./vendor/resin/src/index.ts";

function syntheticFeed(chartBars, symbol) {
  const name = String(symbol || "SYNTH").toUpperCase();
  const first = chartBars.close[0] || 1;
  const target = name.includes("XAU") ? 2350 :
    name.includes("BTC") ? 65000 :
    (name.includes("US100") || name.includes("NASDAQ")) ? 18000 :
    name.includes("USDJPY") ? 150 :
    name.includes("GBPUSD") ? 1.27 :
    name.includes("EURUSD") ? 1.08 :
    name.includes("DXY") ? 104 : first;
  const ratio = target / first;
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const drift = ((hash % 17) - 8) * 0.000004;
  const open = [], high = [], low = [], close = [], volume = [], time = chartBars.time;
  let previous = target;
  for (let i = 0; i < chartBars.close.length; i++) {
    const baseOpen = chartBars.open[i] || chartBars.close[i];
    const baseClose = chartBars.close[i];
    const basePrev = i ? chartBars.close[i - 1] : baseOpen;
    const change = basePrev ? (baseClose - basePrev) / Math.abs(basePrev) : 0;
    const o = i ? previous : target * (baseOpen / first);
    const c = o * (1 + change + drift + Math.sin((i + hash % 97) / 13) * 0.00008);
    const spread = Math.max(Math.abs(c) * 0.00025, Math.abs((chartBars.high[i] - chartBars.low[i]) * ratio));
    open.push(o); close.push(c);
    high.push(Math.max(o, c) + spread * 0.5);
    low.push(Math.min(o, c) - spread * 0.5);
    volume.push(chartBars.volume ? chartBars.volume[i] || 0 : 0);
    previous = c;
  }
  return { open, high, low, close, volume, time };
}

function execute(source, bars, chartTf, inputs = {}, symbol = "SYNTH") {
  try {
    const compiled = transpile(source, {
      chartTf: String(chartTf || "5"),
      syminfo: {
        mintick: 0.01, pricescale: 100, minmove: 1, mincontract: 1,
        pointvalue: 1, timezone: "UTC", type: "stock",
        prefix: "", ticker: String(symbol || "SYNTH")
      }
    });
    if (!compiled.ok) return { ok: false, errors: compiled.errors, version: VERSION };
    const security = {};
    const requested = compiled.securitySymbols || [];
    for (const requestedSymbol of requested) {
      const key = String(requestedSymbol);
      if (key && key.toUpperCase() !== String(symbol).toUpperCase()) {
        security[key] = syntheticFeed(bars, key);
      }
    }
    const result = run(compiled, bars, { inputs, security });
    return { ok: true, version: VERSION, plots: result.plots, viz: result.viz || null, finalVarState: result.finalVarState };
  } catch (error) {
    return { ok: false, errors: [String(error && error.message || error)], version: VERSION };
  }
}
globalThis.PineLabEngine = { execute, version: VERSION };
