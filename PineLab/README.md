# PineLab Android

An independent Android application for running and inspecting Pine Script indicators against a local synthetic OHLC chart.

**This is a new project directory and branch.** It does not reuse the PineMobile application source.

## Product goals

- Offline-first: charting, synthetic data, editor, replay, and indicator execution must work without a network connection.
- Synthetic chart is the default data source; no broker login or market feed is required.
- Android-native shell with local WebView assets for the chart/editor UI.
- Pine Script v5/v6 execution through a dedicated engine adapter.
- Clear compiler/runtime diagnostics with line and column where available.
- Multiple scripts, per-script enable/disable, chart timeframes, and bar-by-bar replay.
- No remote CDN dependencies at runtime.

## Compatibility policy

Pine Script is a proprietary language/runtime with a large API surface. PineLab will target broad practical compatibility, but will not claim complete TradingView parity. Every implemented feature must have a test. Unsupported features must produce an explicit diagnostic rather than silently doing nothing.

The selected engine candidate is [Resin](https://github.com/nullarch/resin). Its own README reports strong Pine v5/v6 coverage and also explicitly identifies areas not fully verified, including arbitrary drawing output. We will integrate it behind an adapter and validate it against a local compatibility suite before treating it as dependable.

## Build status

Current milestone: project foundation and compatibility design.

- [x] Independent branch created: `pinelab-independent`
- [x] Independent project directory created
- [x] Engine and chart-library licensing/constraints reviewed
- [ ] Android Gradle shell
- [ ] Offline chart renderer and synthetic OHLC generator
- [ ] Pine engine bundle and adapter
- [ ] Pine editor, diagnostics, and saved scripts
- [ ] Replay and multi-timeframe data context
- [ ] Compatibility test suite
- [ ] Build verification in Code Assist

## Important

This repository branch is not yet a finished Android app or installable APK. Do not treat the foundation commit as a tested build.
