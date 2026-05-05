(function(global) {
  'use strict';

  global.PixelCatCoins = function(ctx) {
    let coinDropTimer = 20 + Math.random() * 20;
    const activeCoinDrops = [];
    const activeCoinPopups = new Set();

    const COIN_TYPES = [
      { id: 'red_round',    row: 2, value: 3,  weight: 70, color: '#ef4444' },
      { id: 'silver_round', row: 5, value: 10, weight: 24, color: '#d1d5db' },
      { id: 'gold_round',   row: 7, value: 25, weight: 6,  color: '#fbbf24' }
    ];
    const COIN_TOTAL_WEIGHT = COIN_TYPES.reduce((s, c) => s + c.weight, 0);
    const coinSheetUrl = ctx.u('assets/animations/coins_sheet.png');

    function scheduleTimeout(fn, ms) {
      return typeof ctx.addTimeout === 'function' ? ctx.addTimeout(fn, ms) : setTimeout(fn, ms);
    }

    function nextCoinDropDelay() {
      if (ctx.hasShopBoost('lucky_charm') && Math.random() < 0.35) {
        return 35 + Math.random() * 45;
      }
      return 60 + Math.random() * 60;
    }

    function getPetCoinReward() {
      return 1 + (ctx.hasShopBoost('toy_feather') ? 2 : 0);
    }

    function getFishCoinReward() {
      return ctx.hasShopBoost('treat_gold') ? 4 : 2;
    }

    function getCoinCatchRange() {
      const size = Math.max(1, ctx.sizeMultiplier || 1);
      const scaleBonusX = (size - 1) * 26;
      const scaleBonusY = (size - 1) * 32;
      return ctx.hasShopBoost('coin_magnet')
        ? { x: 42 + scaleBonusX, y: 62 + scaleBonusY }
        : { x: 32 + scaleBonusX, y: 55 + scaleBonusY };
    }

    function getMagnetRange() {
      return ctx.hasShopBoost('coin_magnet') ? 460 : 0;
    }

    function getMagnetStrength() {
      return ctx.hasShopBoost('coin_magnet') ? 1450 : 0;
    }

    function applyCoinMagnet(c, dt, floorY) {
      const magnetRange = getMagnetRange();
      const magnetStrength = getMagnetStrength();
      if (magnetRange <= 0 || magnetStrength <= 0) {
        c.magnetized = false;
        return false;
      }

      const coinCenterX = c.x + 8;
      const coinCenterY = c.y + 8;
      const targetX = ctx.feetX;
      const targetY = c.onGround ? c.y + 8 : Math.min(floorY, ctx.feetY - 22);
      const distX = targetX - coinCenterX;
      const distY = targetY - coinCenterY;
      const dist = Math.sqrt(distX * distX + distY * distY);

      if (dist >= magnetRange || dist <= 0.001) {
        c.magnetized = false;
        return false;
      }

      c.magnetized = true;

      const dirX = distX / dist;
      const dirY = distY / dist;
      const force = magnetStrength * 0.35;

      c.vx += dirX * force * dt;
      if (!c.onGround) {
        c.vy += dirY * force * dt;
      }

      const homeSpeed = c.onGround ? 340 : 420;
      const homeStep = Math.min(dist, homeSpeed * dt);
      c.x += dirX * homeStep;
      if (!c.onGround) {
        c.y += dirY * homeStep;
      }

      const maxMagnetSpeed = c.onGround ? 360 : 560;
      const speed = Math.sqrt(c.vx * c.vx + c.vy * c.vy);
      if (speed > maxMagnetSpeed) {
        c.vx = (c.vx / speed) * maxMagnetSpeed;
        c.vy = (c.vy / speed) * maxMagnetSpeed;
      }

      return true;
    }

    function pickCoinType() {
      let r = Math.random() * COIN_TOTAL_WEIGHT;
      for (const ct of COIN_TYPES) {
        r -= ct.weight;
        if (r <= 0) return ct;
      }
      return COIN_TYPES[0];
    }

    function spawnCoinDrop() {
      if (activeCoinDrops.length >= 1) return false;
      if (typeof ctx.hasActivePickup === 'function' && ctx.hasActivePickup()) return false;
      if (typeof ctx.claimActivePickup === 'function' && !ctx.claimActivePickup('coin')) return false;
      const coinType = pickCoinType();

      const el = document.createElement('div');
      el.className = 'pixel-coin-drop';
      el.style.backgroundImage = `url("${coinSheetUrl}")`;
      el.style.setProperty('--coin-row', `-${coinType.row * 16 * (ctx.sizeMultiplier || 1)}px`);

      const shadow = document.createElement('div');
      shadow.className = 'pixel-coin-shadow';
      shadow.style.position = 'fixed';
      shadow.style.width = '12px';
      shadow.style.height = '4px';
      shadow.style.background = 'rgba(0,0,0,0.3)';
      shadow.style.borderRadius = '50%';
      shadow.style.zIndex = '999998';
      shadow.style.pointerEvents = 'none';

      document.body.appendChild(el);
      document.body.appendChild(shadow);

      const x = 60 + Math.random() * (ctx.vw - 120);
      const coinObj = {
        el,
        shadow,
        x,
        y: -30,
        vx: (Math.random() - 0.5) * 80,
        vy: 20 + Math.random() * 30,
        onGround: false,
        lifetime: 20,
        caught: false,
        jumpDone: false,
        row: coinType.row,
        value: coinType.value,
        color: coinType.color
      };
      el.style.transform = `translate3d(${x | 0}px, -30px, 0)`;
      activeCoinDrops.push(coinObj);
      return true;
    }

    function releaseCoinDrop(c) {
      if (!c || c.pickupReleased) return;
      c.pickupReleased = true;
      if (typeof ctx.releaseActivePickup === 'function') ctx.releaseActivePickup('coin');
    }

    function showCoinPopup(x, y, amount, color, row) {
      const pop = document.createElement('div');
      pop.className = 'coin-popup';
      const size = ctx.sizeMultiplier || 1;

      const spriteEl = document.createElement('span');
      spriteEl.style.cssText = [
        'display:inline-block',
        `width:${16 * size}px`,
        `height:${16 * size}px`,
        'vertical-align:middle',
        `background-image:url("${coinSheetUrl}")`,
        `background-size:${80 * size}px ${128 * size}px`,
        `background-position:0px -${(row || 0) * 16 * size}px`,
        'image-rendering:pixelated',
        'margin-right:3px',
        'animation:coinSheetAnim 0.6s steps(5,end) infinite'
      ].join(';');

      const textEl = document.createElement('span');
      textEl.style.verticalAlign = 'middle';
      textEl.textContent = `${amount}`;
      pop.appendChild(spriteEl);
      pop.appendChild(textEl);
      pop.style.setProperty('--x', (x | 0) + 'px');
      pop.style.setProperty('--y', (y | 0) + 'px');
      if (color) pop.style.color = color;
      document.body.appendChild(pop);
      activeCoinPopups.add(pop);
      scheduleTimeout(() => {
        activeCoinPopups.delete(pop);
        if (pop.isConnected) pop.remove();
      }, 1200);
    }

    function updateCoinDrops(dt) {
      coinDropTimer -= dt;
      if (coinDropTimer <= 0 && ctx.catEnabled && !ctx.isCompanion) {
        if (spawnCoinDrop()) {
          coinDropTimer = nextCoinDropDelay();
        } else {
          coinDropTimer = 3 + Math.random() * 5;
        }
      }

      const size = ctx.sizeMultiplier || 1;
      const coinSize = 16 * size;
      const floorY = ctx.vh - coinSize;
      for (let i = activeCoinDrops.length - 1; i >= 0; i--) {
        const c = activeCoinDrops[i];
        if (c.caught) continue;
        const magnetActive = applyCoinMagnet(c, dt, floorY);

        if (!c.onGround) {
          c.vy += ctx.GRAVITY * dt * (magnetActive ? 0.28 : 1);
          
          c.x += c.vx * dt;
          c.y += c.vy * dt;

          if (c.y >= floorY) {
            c.y = floorY;
            c.vy = -c.vy * 0.5;
            c.vx *= 0.7;
            if (Math.abs(c.vy) < 40) {
              c.onGround = true;
              c.vy = 0;
              c.vx = 0;
            }
          }

          if (c.x < 10) { c.x = 10; c.vx = -c.vx * 0.5; }
          if (c.x > ctx.vw - (10 + coinSize)) { c.x = ctx.vw - (10 + coinSize); c.vx = -c.vx * 0.5; }
        } else if (magnetActive) {
          if (c.x < 10) c.x = 10;
          if (c.x > ctx.vw - (10 + coinSize)) c.x = ctx.vw - (10 + coinSize);
        }

        c.lifetime -= dt;
        c.el.style.setProperty('--coin-row', `-${c.row * 16 * size}px`);
        c.el.style.transform = `translate3d(${Math.round(c.x)}px, ${Math.round(c.y)}px, 0)`;

        if (c.shadow) {
          const distToGround = Math.max(0, floorY - c.y);
          const shadowScale = Math.max(0.2, 1 - (distToGround / 200));
          const shadowAlpha = Math.max(0, 0.3 * shadowScale);
          c.shadow.style.background = `rgba(0,0,0,${shadowAlpha})`;
          c.shadow.style.transform = `translate3d(${Math.round(c.x + 2)}px, ${Math.round(floorY + 14)}px, 0) scale(${shadowScale})`;
        }

        const distX = Math.abs(ctx.feetX - (c.x + 8));
        const distY = Math.abs(ctx.feetY - (c.y + 8));

        if (!c.jumpDone && c.onGround && distX < 75 && ctx.state === 'coinchase') {
          c.jumpDone = true;
          ctx.velY = -320;
          ctx.onGround = false;
          ctx.isJumping = true;
          ctx.setAnimLocked('jump', 350);
        }

        const catchRange = getCoinCatchRange();
        if (distX < catchRange.x && distY < catchRange.y && (ctx.state === 'coinchase' || !ctx.criticalStates.has(ctx.state))) {
          c.caught = true;
          c.el.style.transition = 'opacity 0.3s, transform 0.3s';
          c.el.style.opacity = '0';
          c.el.style.transform = `translate3d(${c.x | 0}px, ${(c.y - 40) | 0}px, 0) scale(0.5)`;
          if (c.shadow) {
            c.shadow.style.transition = 'opacity 0.2s';
            c.shadow.style.opacity = '0';
          }
          releaseCoinDrop(c);
          activeCoinDrops.splice(i, 1);
          scheduleTimeout(() => {
            if (c.el.isConnected) c.el.remove();
            if (c.shadow && c.shadow.isConnected) c.shadow.remove();
          }, 350);

          const reward = c.value || 5;
          ctx.awardCoins(reward);
          ctx.recordQuestEvent('coins_collected', 1);
          ctx.coinChaseTarget = null;
          ctx.setAnimLocked('paw', 450);

          if (ctx.state === 'coinchase') ctx.go('sit');
          continue;
        }

        if (c.lifetime <= 0) {
          c.el.style.transition = 'opacity 0.4s';
          c.el.style.opacity = '0';
          if (c.shadow) c.shadow.style.opacity = '0';
          releaseCoinDrop(c);
          activeCoinDrops.splice(i, 1);
          scheduleTimeout(() => {
            if (c.el.isConnected) c.el.remove();
            if (c.shadow && c.shadow.isConnected) c.shadow.remove();
          }, 450);
          if (ctx.coinChaseTarget === c) ctx.coinChaseTarget = null;
          if (ctx.state === 'coinchase') ctx.go('sit');
        }
      }

      if (activeCoinDrops.length > 0 && !ctx.criticalStates.has(ctx.state) && !ctx.isDragging) {
        ctx.coinChaseTarget = activeCoinDrops[0];
      } else if (activeCoinDrops.length === 0) {
        ctx.coinChaseTarget = null;
      }
    }

    function cleanupCoinEffects() {
      activeCoinDrops.splice(0).forEach((c) => {
        releaseCoinDrop(c);
        if (c.el && c.el.isConnected) c.el.remove();
        if (c.shadow && c.shadow.isConnected) c.shadow.remove();
      });
      activeCoinPopups.forEach((pop) => {
        if (pop.isConnected) pop.remove();
      });
      activeCoinPopups.clear();
      ctx.coinChaseTarget = null;
    }

    return {
      getPetCoinReward,
      getFishCoinReward,
      spawnCoinDrop,
      updateCoinDrops,
      showCoinPopup,
      cleanupCoinEffects
    };
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
