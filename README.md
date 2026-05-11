<p align="center">
  <img src="https://i.ibb.co/DHtcMPT9/banners.png" alt="PixelCat" width="100%" />
</p>
<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Firefox-supported-orange?style=for-the-badge&logo=firefox-browser&logoColor=white"/>
  <img src="https://img.shields.io/badge/Chrome%20-Supported-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white"/>
  <img src="https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge"/>
</p>
<p align="center">
  <a href="https://ko-fi.com/pixelcats" target="_blank">
    <img src="https://img.shields.io/badge/Support%20Me-Ko--fi-7B5EA7?style=for-the-badge&logo=ko-fi&logoColor=white&labelColor=5A3E8A"/>
  </a>
</p>
<br/>

> A pixel-art pet companion for YouTube and Google, with cats, foxes, animations, collectibles, bubbles, quests, and a full progression system. More supported websites may be added over time. Everything runs locally. Nothing leaves your browser.

<br/>

## ❯ `features.ts`
```ts
const PixelCat = {
  animations: ["idle", "walk", "run", "jump", "sleep", "sit", "attack"],
  collectibles: ["coins", "fish", "balls"],
  enemies: ["spiders"],
  extras: ["portals", "quests", "achievements", "shop", "stats"],
  skins: ["white", "orange", "rainbow"],
  languages: ["English", "French", "Arabic"],
  privacy: "local-only"
};
```
<br/>

## ❯ `skill_unlocks`
<p align="center">
  <img src="https://img.shields.io/badge/Level%202-Speech%20%26%20Balls-ff9a3c?style=for-the-badge&labelColor=1a1a1a"/>
  <img src="https://img.shields.io/badge/Level%203-Rainbow%20Skin%20%26%20Spiders-e05252?style=for-the-badge&labelColor=1a1a1a"/>
  <img src="https://img.shields.io/badge/Level%204-Size%20Control-4ecbff?style=for-the-badge&labelColor=1a1a1a"/>
  <img src="https://img.shields.io/badge/Level%205-Companion-0075ca?style=for-the-badge&labelColor=1a1a1a"/>
  <img src="https://img.shields.io/badge/Level%206-Mischief-ff69b4?style=for-the-badge&labelColor=1a1a1a"/>
  <img src="https://img.shields.io/badge/Level%207-Portals-8A2BE2?style=for-the-badge&labelColor=1a1a1a"/>
</p>

## ❯ `privacy`
```ts
const Privacy = {
  tracking: false,
  analytics: false,
  telemetry: false,
  remoteCode: false,
  networkRequests: false,
  accountRequired: false,
  serverRequired: false,
  storage: "browser.storage.local"
};
```
<br/>

## ❯ `install_developer_mode`
```bash
Firefox:
1. Go to about:debugging → This Firefox
2. Click "Load Temporary Add-on"
3. Select manifest.json from the Firefox build

Chrome:
1. Go to chrome://extensions
2. Enable Developer mode
3. Click "Load unpacked"
4. Select the extracted Chrome MV3 build folder
```
<br/>

## ❯ `changelog_2.5`
```ts
const Version_2_5 = {
  added: ["Rainbow skin", "popup info buttons", "more speech reactions"],
  fixed: ["quests", "stats", "auto-spawn overlap", "animation direction"],
  improved: ["smoothness", "hyper mode", "local progress handling"]
};
```
<br/>

<p align="center">
  <img src="https://i.ibb.co/ZpY2kxtH/Myname.png" alt="Made by IMAD EL KHAIDER" width="100%" />
</p>
<p align="center">
  <img src="https://img.shields.io/badge/Author-IMAD%20EL%20KHAIDER-blueviolet?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Version-2.5-blue?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/License-MIT-lightgrey?style=for-the-badge"/>
</p>
