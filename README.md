<div align="center">

<img src="assets/cat_idle.gif" width="80" alt="PixelCat" />

# PixelCat for YouTube

**A pixel-art cat companion that lives on YouTube — walks, fights, levels up, and causes chaos.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Firefox](https://img.shields.io/badge/Firefox-Extension-orange?logo=firefox-browser&logoColor=white)](https://www.mozilla.org/firefox/)
[![Chrome](https://img.shields.io/badge/Chrome-Extension-yellow?logo=google-chrome&logoColor=white)](https://www.google.com/chrome/)
[![Status](https://img.shields.io/badge/Status-Active-brightgreen)]()

<br/>

[✨ Features](#features) · [🚀 Install](#install) · [🏗️ Build](#build) · [🤝 Contributing](#contributing) · [📄 License](#license)

</div>

---

## What is PixelCat?

PixelCat is a Firefox and Chrome extension that injects a tiny animated pixel-art cat onto YouTube pages. Your cat walks, runs, jumps, sleeps, chases coins, catches fish, hunts spiders, earns XP, levels up, unlocks skills, and reacts to the page in real time.

All progress is saved locally in your browser — no accounts, no servers, no data collection.

---

## Features

| Category | Details |
|---|---|
| 🐱 **Animations** | Idle, walk, run, jump, sleep, attack — fluid sprite-based movement |
| 🪙 **Collectibles** | Coins, fish, balls, spiders, portals — spawned randomly on page |
| ⚔️ **Combat** | Spider enemies appear and your cat fights them |
| 🌟 **Progression** | XP system, level-ups, unlockable skills |
| 📋 **Quests** | Daily and milestone quests to complete |
| 🏆 **Achievements** | Unlock badges for milestones |
| 💬 **Speech Bubbles** | Cat reacts to what's happening on screen |
| 🧑‍🤝‍🧑 **Companion Mode** | Extended interaction behaviors |
| 🎭 **Page Mischief** | Cat interacts with YouTube UI elements |
| 🌐 **Browser Support** | Firefox and Chrome, dual-manifest build |

---

## Install

### Firefox (Developer / Temporary)

1. Open `about:debugging` in Firefox
2. Click **This Firefox**
3. Click **Load Temporary Add-on...**
4. Select the `manifest.firefox.json` file from the project folder

### Chrome (Developer / Unpacked)

1. Open `chrome://extensions`
2. Enable **Developer mode** (toggle top-right)
3. Click **Load unpacked**
4. Select the Chrome build folder

> For a permanent install, package it with `web-ext` (Firefox) or Chrome's zip uploader in the Developer Dashboard.

---

## Build

This project uses two separate manifest files for browser compatibility:

```
manifest.firefox.json   → Firefox build
manifest.chrome.json    → Chrome build
```

For each release, copy the correct manifest to `manifest.json` in the build folder:

```bash
# Firefox build
cp manifest.firefox.json dist/manifest.json

# Chrome build
cp manifest.chrome.json dist/manifest.json
```

Or use the included build script:

```bash
bash build-browsers.sh
```

> Never ship a build with both manifests active at the same time. Each browser package must contain exactly one `manifest.json`.

---

## Project Structure

```
pixelcat-youtube/
├── assets/             # Sprites, icons, sounds
├── src/                # Core extension logic
├── ui/                 # Popup UI and settings
├── manifest.firefox.json
├── manifest.chrome.json
├── build-browsers.sh
├── README.md
└── LICENSE
```

---

## Privacy

PixelCat runs **entirely locally** in your browser.

- No personal data is collected
- No analytics or tracking
- No network requests to external servers
- Game progress (coins, XP, skills, achievements) is stored locally using `browser.storage`

---

## Contributing

Contributions are welcome. Here are some good areas to help with:

- Bug fixes and browser compatibility
- New animations or sprite frames
- New quests, enemies, or collectibles
- Game balancing
- UI/UX improvements
- Translations

To contribute:

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

Copyright © 2026 Imad El Khaider

---

<div align="center">
  Made with ☕ in Casablanca
</div>
