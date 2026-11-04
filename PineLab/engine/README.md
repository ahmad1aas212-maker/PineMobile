# Embedded Pine engine

The Android app bundles the Resin library into `app/src/main/assets/resin-engine.js` during CI.

- Upstream: https://github.com/nullarch/resin
- Version pinned: 0.3.0
- License: Apache-2.0 (upstream LICENSE is copied into this directory)
- The runtime bundle is generated locally during the build; the installed app does not fetch code.

The entry point exposes `PineLabEngine.execute(source, bars, chartTf, inputs)`.
It returns compiler/runtime errors or normalized `plots` and `viz` output.

This integration must be validated on Android WebView because Resin's generated code uses JavaScript `Function` construction. The Android app currently has no restrictive CSP, but this must be checked on-device before claiming support.
