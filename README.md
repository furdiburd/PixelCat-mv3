<div align="center">

<img src="assets/icons/icon16.png" width="48" alt="PixelCat icon" />

# PixelCat for YouTube

A pixel-art cat companion that lives on YouTube.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Firefox](https://img.shields.io/badge/Firefox-supported-orange?logo=firefox-browser&logoColor=white)]()
[![Chrome](https://img.shields.io/badge/Chrome-supported-yellow?logo=google-chrome&logoColor=white)]()

</div>

---

Your cat walks, jumps, sleeps, chases coins, fights spiders, earns XP, levels up, and unlocks skills — all running locally in your browser with no data collected.

## Install (Developer Mode)

**Firefox**
1. Go to `about:debugging` → This Firefox
2. Click **Load Temporary Add-on**
3. Select `manifest.firefox.json`

**Chrome**
1. Go to `chrome://extensions` → Enable **Developer mode**
2. Click **Load unpacked** → Select the Chrome build folder

## Build

```bash
# Firefox
cp manifest.firefox.json dist/manifest.json

# Chrome
cp manifest.chrome.json dist/manifest.json

# Or use the build script
bash build-browsers.sh
```

## Privacy

Runs fully locally. No data collected. Progress saved with `browser.storage`.

## License

MIT © 2026 Imad El Khaider
