# PineLab Android

An independent Android application for running Pine Script against a local synthetic OHLC chart.

## Current implemented milestone

- Native Android/Kotlin shell hosting local WebView assets.
- Synthetic OHLCV data generator with reproducible seed.
- Arabic interface, chart canvas, symbol/timeframe selectors.
- Bar replay controls: step, play, reset, and cursor slider.
- Pine editor with local save/restore.
- Resin 0.3.0 transpiler/runtime bundled into the APK during CI from its upstream TypeScript source.
- Pine execution returns plot series and captured visualization metadata.
- Initial renderer for plots, shapes, hlines, fills, background/bar colors, and line/box/label objects.
- CI smoke test executes a Pine v6 EMA script against 80 synthetic bars, then builds the Android debug APK.
- Core runtime has no INTERNET permission and no CDN dependency.

## Downloading the current build

Open the GitHub Actions run for this branch and download the `pinelab-debug-apk` artifact. The artifact is a ZIP containing the debug APK.

## Engine and compatibility

Resin 0.3.0 is licensed Apache-2.0. The build checks out its upstream source, bundles it locally, and includes the license in the APK assets. Upstream: https://github.com/nullarch/resin

The engine is a Pine v5/v6 compiler/runtime, not TradingView itself. It does not guarantee identical output for every script. Known upstream limitations include:
- `polyline`, `linefill`, `alert`, and `alertcondition` are no-ops.
- Resin executes a closed historical dataset; it does not provide tick-by-tick realtime execution.
- `request.security` for other symbols needs separate OHLCV feeds; the current app only supplies its synthetic chart feed.
- Some drawing/viz outputs and Pine v5-only semantic differences are not verified against TradingView.
- The PineLab renderer is still being expanded and must be validated on a physical Android device for coordinate accuracy, scrolling, zooming, and long scripts.

## Build status

The CI workflow verifies:
1. bundling Resin for local WebView execution,
2. executing a v6 EMA smoke test on synthetic OHLCV,
3. JavaScript syntax,
4. Android debug APK compilation.

A successful CI build does not replace on-device UI testing or full TradingView parity testing.
