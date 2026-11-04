import "../app/src/main/assets/resin-engine.js";

const n = 80;
const open = [], high = [], low = [], close = [], volume = [], time = [];
let p = 2000;
for (let i = 0; i < n; i++) {
  const o = p;
  const c = o + Math.sin(i / 4) * 2 + 0.15;
  open.push(o); close.push(c);
  high.push(Math.max(o, c) + 0.8);
  low.push(Math.min(o, c) - 0.8);
  volume.push(100 + i);
  time.push(Date.UTC(2025, 0, 1) + i * 5 * 60_000);
  p = c;
}
const source = `//@version=6
indicator("PineLab smoke test", overlay=true)
fast = ta.ema(close, 9)
slow = ta.ema(close, 21)
plot(fast, "EMA 9", color=color.orange)
plot(slow, "EMA 21", color=color.aqua)
`;
const result = globalThis.PineLabEngine.execute(source, { open, high, low, close, volume, time }, "5");
if (!result.ok) throw new Error("Pine engine failed: " + (result.errors || []).join("; "));
if (!Array.isArray(result.plots) || result.plots.length !== 2) {
  throw new Error("Expected 2 plot series, got " + (result.plots || []).length);
}
for (const plot of result.plots) {
  if (!Array.isArray(plot.values) || plot.values.length !== n) {
    throw new Error("Unexpected plot length for " + plot.title);
  }
}
const visualSource = `//@version=6
indicator("PineLab visual test", overlay=true)
fast = ta.ema(close, 9)
slow = ta.ema(close, 21)
pFast = plot(fast, "Fast", color=color.orange)
pSlow = plot(slow, "Slow", color=color.aqua)
fill(pFast, pSlow, color=color.new(color.blue, 85))
hline(2000, "Reference", color=color.gray)
plotshape(ta.crossover(fast, slow), title="Cross", style=shape.triangleup, location=location.belowbar, color=color.lime)
line.new(bar_index[10], low[10], bar_index, low, color=color.red, width=2)
label.new(bar_index, high, "PineLab")
plotchar(ta.crossover(fast, slow), title="Char", char="▲", location=location.abovebar)
plotarrow(close - close[1])
plotcandle(open, high, low, close, title="Candles")
plotbar(open, high, low, close, title="Bars")
`;
const visual = globalThis.PineLabEngine.execute(visualSource, { open, high, low, close, volume, time }, "5");
if (!visual.ok) throw new Error("Pine visualization test failed: " + (visual.errors || []).join("; "));
if (!visual.viz || !visual.viz.shapes || !visual.viz.hlines || !visual.viz.fills || !visual.viz.drawings) {
  throw new Error("Expected captured Pine visualization outputs.");
}
if (visual.viz.shapes.length < 1 || visual.viz.chars.length < 1 || visual.viz.arrows.length < 1 || visual.viz.candles.length < 1 || visual.viz.plotbars.length < 1 || visual.viz.hlines.length < 1 || visual.viz.fills.length < 1 || visual.viz.drawings.length < 1) {
  throw new Error("Pine visualization output collections were unexpectedly empty.");
}
const taSource = `//@version=6
indicator("PineLab TA test")
smaValue = ta.sma(close, 14)
rsiValue = ta.rsi(close, 14)
[macdLine, signalLine, histLine] = ta.macd(close, 12, 26, 9)
atrValue = ta.atr(14)
plot(smaValue, "SMA")
plot(rsiValue, "RSI")
plot(macdLine, "MACD")
plot(signalLine, "Signal")
plot(histLine, "Histogram")
plot(atrValue, "ATR")
`;
const taResult = globalThis.PineLabEngine.execute(taSource, { open, high, low, close, volume, time }, "5");
if (!taResult.ok) throw new Error("TA functions test failed: " + (taResult.errors || []).join("; "));
if (!Array.isArray(taResult.plots) || taResult.plots.length !== 6) {
  throw new Error("Expected six TA output series; got " + (taResult.plots || []).length);
}
for (const plot of taResult.plots) {
  if (!Array.isArray(plot.values) || plot.values.length !== n) {
    throw new Error("TA output length mismatch for " + plot.title);
  }
}

const securitySource = `//@version=6
indicator("PineLab security test")
chartClose = close
otherClose = request.security("NASDAQ:MSFT", timeframe.period, close)
plot(chartClose, "Chart feed")
plot(otherClose, "Synthetic external feed")
`;
const securityResult = globalThis.PineLabEngine.execute(securitySource, { open, high, low, close, volume, time }, "5", {}, "XAUUSD");
if (!securityResult.ok) throw new Error("request.security test failed: " + (securityResult.errors || []).join("; "));
if (!Array.isArray(securityResult.plots) || securityResult.plots.length !== 2) {
  throw new Error("Expected chart and security series; got " + (securityResult.plots || []).length);
}
if (!securityResult.plots[1].values.some(Number.isFinite)) {
  throw new Error("Synthetic request.security feed returned no numeric values.");
}

const mtfSource = `//@version=6
indicator("PineLab MTF test")
chartClose = close
hourClose = request.security("NASDAQ:MSFT", "60", close)
dayClose = request.security("NASDAQ:MSFT", "D", close)
plot(chartClose, "Chart")
plot(hourClose, "60m")
plot(dayClose, "Daily")
`;
const mtfData = { open: [], high: [], low: [], close: [], volume: [], time: [] };
let mtfPrice = 2000;
for (let i = 0; i < 400; i++) {
  const o = mtfPrice, cl = o + Math.sin(i / 7) * 1.2 + 0.04;
  mtfData.open.push(o); mtfData.close.push(cl);
  mtfData.high.push(Math.max(o, cl) + 0.5); mtfData.low.push(Math.min(o, cl) - 0.5);
  mtfData.volume.push(100 + i); mtfData.time.push(Date.UTC(2025, 0, 1) + i * 5 * 60_000);
  mtfPrice = cl;
}
const mtfResult = globalThis.PineLabEngine.execute(mtfSource, mtfData, "5", {}, "XAUUSD");
if (!mtfResult.ok) throw new Error("Higher timeframe request.security failed: " + (mtfResult.errors || []).join("; "));
if (!Array.isArray(mtfResult.plots) || mtfResult.plots.length !== 3) {
  throw new Error("Expected chart, 60m and daily series; got " + (mtfResult.plots || []).length);
}
if (!mtfResult.plots[1].values.some(Number.isFinite) || !mtfResult.plots[2].values.some(Number.isFinite)) {
  throw new Error("Higher timeframe synthetic feeds returned no numeric values.");
}


const dailyHaSource = `//@version=6
indicator("PineLab Daily HA previous candle")
haTicker = ticker.heikinashi(syminfo.tickerid)
[haO, haH, haL, haC] = request.security(haTicker, "1D", [open[1], high[1], low[1], close[1]], lookahead=barmerge.lookahead_on)
plot(haO, "Previous HA Open")
plot(haH, "Previous HA High")
plot(haL, "Previous HA Low")
plot(haC, "Previous HA Close")
`;
const haData = { open: [], high: [], low: [], close: [], volume: [], time: [] };
let haPrice = 2350;
for (let i = 0; i < 2880; i++) {
  const o = haPrice, cl = o + Math.sin(i / 11) * 0.7 + 0.015;
  haData.open.push(o); haData.close.push(cl);
  haData.high.push(Math.max(o, cl) + 0.4); haData.low.push(Math.min(o, cl) - 0.4);
  haData.volume.push(100 + (i % 300)); haData.time.push(Date.UTC(2025, 0, 1) + i * 5 * 60_000);
  haPrice = cl;
}
const dailyHaResult = globalThis.PineLabEngine.execute(dailyHaSource, haData, "5", {}, "XAUUSD");
if (!dailyHaResult.ok) throw new Error("Daily HA 5m test failed: " + (dailyHaResult.errors || []).join("; "));
if (dailyHaResult.plots.length !== 4 || !dailyHaResult.plots.every(p => p.values.some(Number.isFinite))) {
  throw new Error("Daily HA previous completed candle did not return all four OHLC values on 5m.");
}
const lowerTfSource = `//@version=6
indicator("PineLab lower timeframe test")
oneMinute = request.security("NASDAQ:MSFT", "1", close)
plot(oneMinute, "1m synthetic")
`;
const lowerTfResult = globalThis.PineLabEngine.execute(lowerTfSource, { open, high, low, close, volume, time }, "5", {}, "XAUUSD");
if (!lowerTfResult.ok) throw new Error("Lower timeframe request.security failed: " + (lowerTfResult.errors || []).join("; "));
if (!lowerTfResult.plots[0].values.some(Number.isFinite)) {
  throw new Error("Lower timeframe synthetic feed returned no numeric values.");
}
const tableSource = `//@version=6
indicator("PineLab table test", overlay=true)
var t = table.new(position.top_right, 2, 2)
if barstate.islast
    table.cell(t, 0, 0, "PineLab")
    table.cell(t, 1, 0, "OK")
    table.cell(t, 0, 1, "Bars")
    table.cell(t, 1, 1, str.tostring(bar_index + 1))
`;
const tableResult = globalThis.PineLabEngine.execute(tableSource, { open, high, low, close, volume, time }, "5");
if (!tableResult.ok) throw new Error("Table capture test failed: " + (tableResult.errors || []).join("; "));
if (!tableResult.viz) throw new Error("Expected table visualization metadata.");
if (!tableResult.viz.drawings.some(d => d.kind === "table")) throw new Error("Expected a captured table handle.");
console.log("Table viz probe: " + JSON.stringify(tableResult.viz).slice(0, 2500));

const fullReplay = globalThis.PineLabEngine.execute(source, { open, high, low, close, volume, time }, "5");
const prefixLength = 37;
const prefixBars = Object.fromEntries(["open","high","low","close","volume","time"].map(k => [k, ({open,high,low,close,volume,time})[k].slice(0,prefixLength)]));
const prefixReplay = globalThis.PineLabEngine.execute(source, prefixBars, "5");
if (!fullReplay.ok || !prefixReplay.ok) throw new Error("Replay causality fixture failed to execute.");
for (let p = 0; p < fullReplay.plots.length; p++) {
  for (let i = 0; i < prefixLength; i++) {
    const a = fullReplay.plots[p].values[i], b = prefixReplay.plots[p].values[i];
    if (Number.isFinite(a) !== Number.isFinite(b) || (Number.isFinite(a) && Math.abs(a-b) > 1e-9)) {
      throw new Error("Replay prefix mismatch at plot " + p + ", bar " + i + ": future bars changed a historical value.");
    }
  }
}
const chartFeed = {open,high,low,close,volume,time};
for (const tf of ["1","15","60","D"]) {
  const feed = globalThis.PineLabEngine.syntheticFeed(chartFeed, "XAUUSD", "5", tf);
  if (!feed.close.length || feed.time.some((v,i)=>i>0&&v<=feed.time[i-1])) {
    throw new Error("Synthetic " + tf + " feed is empty or has non-monotonic timestamps.");
  }
  for (let i=0;i<feed.close.length;i++) {
    if (!(feed.high[i] >= Math.max(feed.open[i],feed.close[i]) && feed.low[i] <= Math.min(feed.open[i],feed.close[i]))) {
      throw new Error("Synthetic " + tf + " OHLC invariant failed at bar " + i);
    }
  }
}
const haFeed = globalThis.PineLabEngine.toHeikinAshi(globalThis.PineLabEngine.syntheticFeed(chartFeed,"XAUUSD","5","60"));
for(let i=0;i<haFeed.close.length;i++){
 if(!(haFeed.high[i]>=Math.max(haFeed.open[i],haFeed.close[i])&&haFeed.low[i]<=Math.min(haFeed.open[i],haFeed.close[i])))throw new Error("Heikin-Ashi OHLC invariant failed at bar "+i);
}
console.log("Resin " + result.version + " passed: TA functions, visual primitives, multi-symbol request.security, 1m/60m/D synthetic feeds, Daily Heikin-Ashi previous-day OHLC on 5m, and table handle capture.");
