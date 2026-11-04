# Offline checklist

The Android manifest intentionally does not request INTERNET permission.

Before release, verify with airplane mode enabled:
- [ ] launch screen loads without a network
- [ ] chart canvas renders synthetic candles
- [ ] regenerate data works repeatedly
- [ ] replay step/play/pause/reset work
- [ ] script text saves and restores after app restart
- [ ] all CSS/JS/chart/engine files load from app assets
- [ ] no CDN, remote font, analytics, or telemetry request exists
- [ ] Pine execution is local and does not require a service
- [ ] import/export works with Android storage picker (future milestone)
