# Pine engine integration — technical gate

## Candidate engine

Resin 0.3.0 is a serious candidate, not a drop-in Android library. Its package exports TypeScript source and declares Node >=22.18 for its documented CLI. Therefore the CLI cannot simply be called from Android, and the browser bundle has not yet been produced or tested.

Source: https://github.com/nullarch/resin

## Required integration spike

1. Pin a specific Resin commit/release and preserve its Apache-2.0 license and notices.
2. Determine whether the TypeScript source can be bundled for an embedded JavaScript runtime without Node built-ins.
3. Identify Node-specific imports and replace or isolate them only where the license and architecture permit.
4. Bundle engine code locally at build time; no CDN or remote script loading.
5. Run a fixture suite for EMA, SMA, RSI, MACD, arrays, var/varip, request.security, plots, and drawing-object lifecycle.
6. Compare outputs with known expected values and label every divergence.
7. If the engine cannot run safely in Android WebView, select a local embedded JS runtime or another implementation; do not pretend a button that only accepts source text is a Pine interpreter.

## Chart library

Lightweight Charts is a renderer, not a Pine implementation. Its current license requires attribution to TradingView in the application/page. The chart UI must include a visible TradingView attribution/link and include the required NOTICE text when the library is bundled.

Source: https://github.com/tradingview/lightweight-charts

## Release gate

No Pine version or namespace may be marked supported until:
- compile errors are surfaced,
- runtime execution succeeds on Android,
- series outputs match fixtures,
- visual outputs remain anchored correctly while zooming and replaying,
- offline mode has been tested.
