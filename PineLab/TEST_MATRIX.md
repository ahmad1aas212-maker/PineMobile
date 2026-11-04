# PineLab compatibility and acceptance tests

This is a test plan, not a claim that these features already work.

## Language and execution
- [ ] Pine v5 and v6 version declarations
- [ ] series history references and bar indexing
- [ ] `var` and `varip`
- [ ] conditional calls to stateful `ta.*` functions
- [ ] functions, scopes, loops, arrays, maps, matrices, UDTs, methods
- [ ] `na` propagation and type conversion
- [ ] compiler errors show source location
- [ ] runtime errors do not crash the app

## Built-in namespaces
- [ ] math
- [ ] ta
- [ ] color
- [ ] str
- [ ] input
- [ ] timeframe and session
- [ ] request.security
- [ ] strategy namespace (if included in the first compatibility target)

## Visual output
- [ ] plot and plot.style variants
- [ ] hline
- [ ] plotshape and plotchar
- [ ] barcolor and bgcolor
- [ ] fill
- [ ] line objects
- [ ] label objects
- [ ] box objects
- [ ] table objects
- [ ] object update/delete lifecycle
- [ ] drawings remain anchored to bars/times while zooming and scrolling

## Chart and replay
- [ ] synthetic OHLC values are deterministic for a fixed seed
- [ ] candle OHLC invariants: high >= max(open, close), low <= min(open, close)
- [ ] timeframe aggregation preserves first open, maximum high, minimum low, last close, summed volume
- [ ] replay advances exactly one bar
- [ ] replay reset returns identical outputs
- [ ] chart resize/orientation does not offset indicator drawings
- [ ] multiple indicators do not unexpectedly alter candle scale

## Android/offline
- [ ] project imports in Code Assist 3.36.1
- [ ] Gradle build succeeds
- [ ] app installs and opens on Android 15
- [ ] all core assets are local
- [ ] airplane-mode acceptance passes
- [ ] no network permission required for core features
- [ ] memory use and long-history performance measured on a mid-range phone

## Compatibility reporting

Each test is classified as:
- PASS: output matches expected reference
- PARTIAL: feature works with documented limitations
- FAIL: incorrect output or crash
- UNSUPPORTED: explicit diagnostic is shown

Never mark a feature PASS based only on the script compiling.
