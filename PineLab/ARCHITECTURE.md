# PineLab architecture

## 1. Android shell

- Kotlin Android application.
- One Activity hosts a local WebView.
- All HTML, CSS, JavaScript, fonts, chart code, and engine bundles are packaged under app assets.
- WebView loads only local assets; no CDN or network request is needed for core operation.
- JavaScript bridge is narrow: import/export scripts, persist preferences, and expose Android diagnostics only.

## 2. Chart and data

- Chart library candidate: TradingView Lightweight Charts, bundled locally.
- Synthetic OHLCV generator creates deterministic datasets from a seed so test results can be reproduced.
- Timeframe aggregation derives higher intervals from the base synthetic series; aggregation must preserve OHLCV rules.
- Replay controller advances the visible last bar and recalculates indicators according to the engine's execution model.
- Chart state and script outputs are separate. Indicator drawings must be mapped from bar/time coordinates to chart coordinates, never pinned to screen pixels.

Lightweight Charts is a chart-rendering library, not the Pine runtime. PineLab must implement the mapping layer for plots, markers, fills, and drawing objects.

## 3. Pine execution

- Engine candidate: Resin (Apache-2.0), isolated behind `PineEngineAdapter`.
- The Android UI must not depend directly on Resin internals.
- Integration spike must determine how to bundle Resin's TypeScript implementation for an embedded JavaScript runtime. Its CLI documentation requires Node 22.18+, so the CLI itself is not assumed to run inside Android WebView.
- No runtime CDN imports.
- Each script gets an execution context containing symbol, timeframe, OHLCV series, bar index, and user inputs.
- Engine results are normalized into a stable PineLab output model.

## 4. Normalized output model

The adapter should normalize at least:
- plot series and plot styles
- hline values
- plotshape/plotchar markers
- barcolor and bgcolor
- fill regions
- labels, lines, boxes, and tables
- input definitions
- compiler and runtime diagnostics

Every output carries bar/time coordinates and pane/scale metadata where available. Drawing-object lifecycle (create/update/delete) must be preserved.

## 5. Replay semantics

- Historical calculation: execute bars in chronological order.
- Replay: advance one bar at a time; do not move drawings independently of their bar/time anchors.
- Realtime simulation: update the current synthetic bar separately from confirmed historical bars.
- Intrabar behavior and bar-close confirmation must be explicit; the UI must distinguish provisional from confirmed output.
- `request.security` and higher-timeframe calculations require separate aggregated contexts, not a visual approximation.

## 6. Persistence

- Scripts stored locally in app-private storage.
- Per-script enabled state and input values persisted.
- Synthetic datasets and replay cursor can be reset to known fixtures.
- Export/import uses plain text Pine files and a documented JSON format for test data.

## 7. Offline acceptance

After first installation, enable airplane mode and verify:
1. app opens
2. chart renders
3. synthetic data can be regenerated
4. built-in Pine examples execute
5. editor can save and reopen scripts
6. replay advances
7. no external host requests are attempted
