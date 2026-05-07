<p align="center">
  <img src="https://i.ibb.co/DHtcMPT9/banners.png" alt="PixelCat" width="100%" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Firefox-supported-orange?style=for-the-badge&logo=firefox-browser&logoColor=white"/>
  <img src="https://img.shields.io/badge/Version-1.0-informational?style=for-the-badge"/>
  <a href="https://ko-fi.com/pixelcats">
    <img src="https://ko-fi.com/img/githubbutton_sm.svg" height="28"/>
  </a>
</p>

<br/>

> A pixel-art cat companion that lives on every YouTube page — with animations, collectibles, combat, quests, and a full progression system. Everything runs locally. Nothing leaves your browser.

<br/>

## ❯ `features.ts`

```ts
const PixelCatFeatures = {
  animations: ["idle", "walk", "run", "jump", "sleep", "sit", "attack"],

  collectibles: {
    coins: "Collectible coins drop across the page",
    fish: "Feed fish to gain XP",
    balls: ["baseball", "basketball", "tennis", "football", "golf"]
  },

  enemies: {
    spiders: "Enemy spiders crawl in and the cat fights them"
  },

  unlocks: {
    portals: "Green and purple portals for teleporting around the page",
    mischief: "The cat can interact with YouTube UI elements",
    companionMode: "Add a second cat companion",
    loyalFollow: "The cat can follow your cursor"
  },

  speechBubbles: ["English", "French", "Arabic"]
};
```

<br/>

## ❯ `skill_unlocks`

<p align="center">
  <img src="https://img.shields.io/badge/2-Balls-ff9a3c?style=for-the-badge&label=Level&labelColor=0d1117"/>
  <img src="https://img.shields.io/badge/3-Spiders-e05252?style=for-the-badge&label=Level&labelColor=0d1117"/>
  <img src="https://img.shields.io/badge/4-Size%20Control-4ecbff?style=for-the-badge&label=Level&labelColor=0d1117"/>
  <img src="https://img.shields.io/badge/5-Companion-0075ca?style=for-the-badge&label=Level&labelColor=0d1117"/>
  <img src="https://img.shields.io/badge/6-Mischief-ff69b4?style=for-the-badge&label=Level&labelColor=0d1117"/>
  <img src="https://img.shields.io/badge/7-Portals-8A2BE2?style=for-the-badge&label=Level&labelColor=0d1117"/>
</p>


## ❯ `privacy`

```ts
const Privacy = {
  tracking: false,
  analytics: false,
  telemetry: false,
  networkRequests: false,
  storage: "browser.storage",
  accountRequired: false,
  serverRequired: false
};
```

<br/>

## ❯ `install_developer_mode`

```bash
1. Go to about:debugging → This Firefox
2. Click "Load Temporary Add-on"
3. Select manifest.json
```

<br/>

<p align="center">
  Made with 🧡 by <b>IMAD EL KHAIDER</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Author-IMAD%20EL%20KHAIDER-blueviolet?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Version-1.0-blue?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/License-MIT-lightgrey?style=for-the-badge"/>
</p>
