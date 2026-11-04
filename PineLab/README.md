# PineLab Android

An independent Android application for running Pine Script against a local synthetic OHLC chart.

## Current implemented milestone

- Native Android/Kotlin shell hosting local WebView assets.
- Synthetic OHLCV data generator with reproducible seed.
- Arabic interface, chart canvas, symbol/timeframe selectors.
- Bar replay controls: step, play, reset, and cursor slider.
- Latest candle sits near the right side (about 80% across the plot), leaving future blank space ahead; it is not locked to the center.
- Touch/mouse drag pans the chart horizontally and vertically; mouse wheel zooms the price scale. Fit resets the view; fullscreen expands the chart.
- Replay supports selectable speeds (0.25x–10x) and a user-defined replay start point; reset returns to that point.
- Chart history spans ten calendar days so 5m and 15m tests cover the same period.
- Saved indicators have independent per-indicator run/stop controls in a dedicated list.
- Pine editor with local save/restore.
- Resin 0.3.0 transpiler/runtime bundled into the APK during CI from its upstream TypeScript source.
- Pine execution returns plot series and captured visualization metadata.
- Initial renderer for Pine plot styles (line, area, histogram, columns, circles, cross, stepline), shapes/chars/arrows, plotcandle/plotbar, hlines, fills, background/bar colors, and line/box/label objects including line extension and dash styles.
- `request.security` test feeds for other symbols on higher timeframes (15m through monthly) and deterministic lower-timeframe subdivisions when the requested interval divides the chart interval.
- `ticker.heikinashi` requests receive Heikin-Ashi transformed synthetic OHLC feeds; regression test covers the previous completed daily HA OHLC pattern on a 5m chart.
- Bar Replay re-executes enabled indicators at each selected historical bar.
- CI smoke test executes a Pine v6 EMA script against 80 synthetic bars, then builds the Android debug APK.
- Core runtime has no INTERNET permission and no CDN dependency.

## Downloading the current build

Open the GitHub Actions run for this branch and download the `pinelab-debug-apk` artifact. The artifact is a ZIP containing the debug APK.

## Engine and compatibility

Resin 0.3.0 is licensed Apache-2.0. The build checks out its upstream source, bundles it locally, and includes the license in the APK assets. Upstream: https://github.com/nullarch/resin

The engine is a Pine v5/v6 compiler/runtime, not TradingView itself. It does not guarantee identical output for every script. Known upstream limitations include:
- `polyline`, `linefill`, `alert`, and `alertcondition` are no-ops.
- Resin executes a closed historical dataset; it does not provide tick-by-tick realtime execution.
- `request.security` is supported using synthetic feeds generated from the chart's own OHLCV path; higher-timeframe feeds are aggregated and divisible lower timeframes are subdivided deterministically. These are test data, not real symbol prices, and are not a substitute for real exchange feeds.
- Resin captures `table.new` handles, but its table cell/set/clear operations are currently no-ops; visible table contents are not implemented.
- `polyline`, `linefill`, `alert`, and `alertcondition` are no-ops in Resin.
- Drawing renderer coordinates/styles are initial approximations; some drawing/viz outputs and Pine v5-only semantic differences are not verified against TradingView.
- The PineLab renderer is still being expanded and must be validated on a physical Android device for coordinate accuracy, scrolling, zooming, and long scripts.

## Build status

The CI workflow verifies:
1. bundling Resin for local WebView execution,
2. executing a v6 EMA smoke test on synthetic OHLCV,
3. JavaScript syntax,
4. Android debug APK compilation.

The latest CI run (04-11-2026) passed the TA, visual primitive, multi-symbol `request.security` (1m/60m/daily), table-handle capture, JavaScript syntax, and Android debug APK build checks. A successful CI build does not replace on-device UI testing or full TradingView parity testing.
