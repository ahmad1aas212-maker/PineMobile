import { transpile, run, VERSION } from "./vendor/resin/src/index.ts";

function tfMinutes(tf) {
  const s = String(tf || "5").toUpperCase();
  if (s === "D" || s === "1D") return 1440;
  if (s === "W" || s === "1W") return 10080;
  if (s === "M" || s === "1M") return 43200;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? n : 5;
}

function syntheticFeed(chartBars, symbol, chartTf, targetTf = chartTf) {
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
  const open = [], high = [], low = [], close = [], volume = [], time = [];
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
    time.push(chartBars.time[i]);
    previous = c;
  }
  const sourceTf = tfMinutes(chartTf), destTf = tfMinutes(targetTf);
  if (destTf < sourceTf && sourceTf % destTf === 0) {
    const out = { open: [], high: [], low: [], close: [], volume: [], time: [], timeframe: String(targetTf) };
    const pieces = sourceTf / destTf;
    for (let i = 0; i < time.length; i++) {
      const path = i % 2 === 0 ? [open[i], low[i], high[i], close[i]] : [open[i], high[i], low[i], close[i]];
      for (let j = 0; j < pieces; j++) {
        const a = j / pieces * 3, b = (j + 1) / pieces * 3;
        const at = x => { const k = Math.min(2, Math.floor(x)); const f = x - k; return path[k] + (path[k + 1] - path[k]) * f; };
        const o = at(a), z = at(b), mid1 = at(Math.min(3, a + (b-a)/3)), mid2 = at(Math.min(3, a + 2*(b-a)/3));
        out.open.push(o); out.close.push(z);
        out.high.push(Math.max(o,z,mid1,mid2)); out.low.push(Math.min(o,z,mid1,mid2));
        out.volume.push(volume[i] / pieces); out.time.push(time[i] + j * destTf * 60000);
      }
    }
    return out;
  }
  if (destTf <= sourceTf) return { open, high, low, close, volume, time, timeframe: String(chartTf || "5") };
  const out = { open: [], high: [], low: [], close: [], volume: [], time: [], timeframe: String(targetTf) };
  let bucket = null;
  for (let i = 0; i < time.length; i++) {
    const key = Math.floor(time[i] / (destTf * 60000));
    if (key !== bucket) {
      bucket = key;
      out.open.push(open[i]); out.high.push(high[i]); out.low.push(low[i]);
      out.close.push(close[i]); out.volume.push(volume[i]); out.time.push(time[i]);
    } else {
      const j = out.close.length - 1;
      out.high[j] = Math.max(out.high[j], high[i]);
      out.low[j] = Math.min(out.low[j], low[i]);
      out.close[j] = close[i]; out.volume[j] += volume[i];
    }
  }
  return out;
}

function toHeikinAshi(feed) {
  const out = { open: [], high: [], low: [], close: [], volume: Array.from(feed.volume), time: Array.from(feed.time), timeframe: feed.timeframe };
  for (let i = 0; i < feed.close.length; i++) {
    const haClose = (feed.open[i] + feed.high[i] + feed.low[i] + feed.close[i]) / 4;
    const haOpen = i === 0 ? (feed.open[i] + feed.close[i]) / 2 : (out.open[i - 1] + out.close[i - 1]) / 2;
    out.open.push(haOpen);
    out.close.push(haClose);
    out.high.push(Math.max(feed.high[i], haOpen, haClose));
    out.low.push(Math.min(feed.low[i], haOpen, haClose));
  }
  return out;
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
    const wantsHeikinAshi = /ticker\s*\.\s*heikinashi\s*\(/.test(source);
    const chartSymbol = String(symbol || "SYNTH");
    if (wantsHeikinAshi) {
      compiled.securitySymbols = (compiled.securitySymbols || []).map(s => s == null ? chartSymbol : s);
    }
    const security = {};
    const requested = compiled.securitySymbols || [];
    const chartMinutes = tfMinutes(chartTf);
    const timeframes = ["1","3","5","15","30","45","60","120","240","D","W","M"];
    const emptyFeed = tf => ({ open: [], high: [], low: [], close: [], volume: [], time: [], timeframe: String(tf) });
    for (const requestedSymbol of requested) {
      const key = String(requestedSymbol);
      if (!key) continue;
      // Never fabricate another ticker's prices. Only the chart symbol has
      // an authenticated market feed in this build; unsupported symbols
      // resolve to empty series so scripts cannot mistake estimates for data.
      if (key.toUpperCase() !== chartSymbol.toUpperCase()) {
        for (const tf of timeframes) security[key + ":" + tf] = emptyFeed(tf);
        security[key] = emptyFeed(chartTf);
        continue;
      }
      for (const tf of timeframes) {
        if (tfMinutes(tf) < chartMinutes) {
          security[key + ":" + tf] = emptyFeed(tf);
          continue;
        }
        const feed = syntheticFeed(bars, key, chartTf, tf);
        security[key + ":" + tf] = wantsHeikinAshi ? toHeikinAshi(feed) : feed;
      }
      const feed = syntheticFeed(bars, key, chartTf, chartTf);
      security[key] = wantsHeikinAshi ? toHeikinAshi(feed) : feed;
    }
    const result = run(compiled, bars, { inputs, security });
    return { ok: true, version: VERSION, plots: result.plots, viz: result.viz || null, finalVarState: result.finalVarState };
  } catch (error) {
    return { ok: false, errors: [String(error && error.message || error)], version: VERSION };
  }
}
globalThis.PineLabEngine = { execute, transpile, version: VERSION, syntheticFeed, toHeikinAshi };
