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
console.log("Resin " + result.version + " smoke test passed: " + result.plots.length + " plots × " + n + " bars.");
