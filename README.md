# PixelCat for YouTube 🐱

A playful pixel cat browser extension for YouTube.

PixelCat adds a small animated pixel-art cat companion to YouTube. The cat walks, runs, jumps, idles, sleeps, chases coins, catches fish, plays with balls, fights spiders, earns XP, levels up, unlocks skills, and reacts to the page.

## Features

- Pixel-art cat companion on YouTube
- Walking, running, jumping, sleeping, and idle animations
- Coins, fish, balls, spiders, and portals
- XP and level progression
- Unlockable skills
- Quests and achievements
- Companion mode
- Page mischief interactions
- Speech bubbles
- Firefox and Chrome support

## Browser Support

PixelCat supports both Firefox and Chrome using separate manifests:

- `manifest.firefox.json`
- `manifest.chrome.json`

Each browser build should contain only one active `manifest.json`.

## Install for Development

### Firefox

1. Open `about:debugging`
2. Click **This Firefox**
3. Click **Load Temporary Add-on**
4. Select the extension `manifest.json` from the Firefox build folder

### Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the Chrome build folder

## Building

This project includes browser-specific manifests.

For release builds, create separate packages for:

- Firefox
- Chrome

Do not upload both browser manifests as the active `manifest.json` at the same time.

Example structure:

```text
pixelcat-youtube/
├─ assets/
├─ src/
├─ ui/
├─ manifest.firefox.json
├─ manifest.chrome.json
├─ build-browsers.sh
├─ README.md
├─ LICENSE
└─ .gitignore
