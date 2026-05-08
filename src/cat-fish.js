(function(global) {
  'use strict';

  global.PixelCatFish = function(ctx) {
    const fishImgUrls = [
      `url("${ctx.u('assets/fishes/fish1.png')}")`,
      `url("${ctx.u('assets/fishes/fish2.png')}")`,
      `url("${ctx.u('assets/fishes/fish3.png')}")`
    ];
    let fishTimerPausedForObject = false;

    function nextFishSpawnDelay() {
      return 45 + Math.random() * 120 + (Math.random() < 0.2 ? 60 : 0);
    }

    function spawnFishTreat(customX, customY) {
      if (ctx.activeFishes.length >= 1) return false;
      if (typeof ctx.hasActivePickup === 'function' && ctx.hasActivePickup()) return false;
      if (typeof ctx.claimActivePickup === 'function' && !ctx.claimActivePickup('fish')) return false;

      const el = document.createElement('div');
      el.className = 'pixel-fish';
      el.style.backgroundImage = fishImgUrls[(Math.random() * 3) | 0];
      document.body.appendChild(el);

      const fromSide = Math.random() < 0.5;
      const isLeft = Math.random() < 0.5;

      const f = {
        el,
        x: customX !== undefined ? customX : (fromSide ? (isLeft ? -20 : ctx.vw + 20) : (ctx.vw * 0.1 + Math.random() * (ctx.vw * 0.8))),
        y: customY !== undefined ? customY : (fromSide ? (Math.random() * (ctx.vh * 0.5)) : -40),
        vx: customX !== undefined ? 0 : (fromSide ? ((isLeft ? 1 : -1) * (150 + Math.random() * 150)) : (Math.random() - 0.5) * 100),
        vy: customY !== undefined ? 0 : (fromSide ? -100 - Math.random() * 200 : 0),
        rot: 0,
        vrot: (Math.random() - 0.5) * 720,
        onGround: false,
        stuckTimer: 0,
        isHeld: false
      };

      el.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        f.isHeld = true;
        ctx.draggedFish = f;
        ctx.fishDragOffsetX = e.clientX - f.x;
        ctx.fishDragOffsetY = e.clientY - f.y;
        f.vx = 0;
        f.vy = 0;
        f.vrot = 0;
        f.onGround = false;
        ctx.targetFish = f;
        ctx.lastFishDragX = f.x;
        ctx.lastFishDragY = f.y;
        ctx.lastFishDragTs = ctx.safeNow();
        el.style.cursor = 'grabbing';
        if (typeof ctx.speakObjectInteraction === 'function') ctx.speakObjectInteraction('fishing');
        if (ctx.state !== 'dragged') ctx.go('chasefish');
      });

      el.addEventListener('touchstart', (e) => {
        const t = e.touches[0];
        if (!t) return;
        e.preventDefault();
        e.stopPropagation();
        f.isHeld = true;
        ctx.draggedFish = f;
        ctx.fishDragOffsetX = t.clientX - f.x;
        ctx.fishDragOffsetY = t.clientY - f.y;
        f.vx = 0;
        f.vy = 0;
        f.vrot = 0;
        f.onGround = false;
        ctx.targetFish = f;
        ctx.lastFishDragX = f.x;
        ctx.lastFishDragY = f.y;
        ctx.lastFishDragTs = ctx.safeNow();
        el.style.cursor = 'grabbing';
        if (typeof ctx.speakObjectInteraction === 'function') ctx.speakObjectInteraction('fishing');
        if (ctx.state !== 'dragged') ctx.go('chasefish');
      }, { passive: false });

      el.style.cursor = 'grab';
      ctx.activeFishes.push(f);
      return true;
    }

    function releaseFish(f) {
      if (!f || f.pickupReleased) return;
      f.pickupReleased = true;
      if (typeof ctx.releaseActivePickup === 'function') ctx.releaseActivePickup('fish');
    }

    function updateFishes(dt) {
      if (!ctx.catEnabled) {
        if (ctx.activeFishes.length > 0) {
          for (let i = 0; i < ctx.activeFishes.length; i++) {
            releaseFish(ctx.activeFishes[i]);
            ctx.activeFishes[i].el.remove();
          }
          ctx.activeFishes.length = 0;
        }
        ctx.draggedFish = null;
        return;
      }

      const spawnBlocked = ctx.activeFishes.length > 0 || (typeof ctx.hasActivePickup === 'function' && ctx.hasActivePickup());
      if (ctx.autoFishSpawnEnabled) {
        if (spawnBlocked) {
          fishTimerPausedForObject = true;
        } else {
          if (fishTimerPausedForObject) {
            ctx.fishSpawnTimer = nextFishSpawnDelay();
            fishTimerPausedForObject = false;
          }
          ctx.fishSpawnTimer -= dt;
          if (ctx.fishSpawnTimer <= 0) {
            if (spawnFishTreat()) {
              ctx.fishSpawnTimer = nextFishSpawnDelay();
              fishTimerPausedForObject = true;
            } else {
              ctx.fishSpawnTimer = nextFishSpawnDelay();
            }
          }
        }
      } else {
        fishTimerPausedForObject = false;
      }

      const floorY = ctx.vh;
      for (let i = ctx.activeFishes.length - 1; i >= 0; i--) {
        const f = ctx.activeFishes[i];
        if (f.isHeld) {
          f.stuckTimer = 0;
          f.rot *= 0.85;
        } else if (!f.onGround) {
          f.vy += ctx.GRAVITY * dt;
          f.x += f.vx * dt;
          f.y += f.vy * dt;
          f.rot += f.vrot * dt;

          if (f.y >= floorY) {
            f.y = floorY;
            f.vy = -f.vy * 0.4;
            f.vx *= 0.5;
            f.vrot *= 0.5;
            if (Math.abs(f.vy) < 50) {
              f.onGround = true;
              f.vy = 0;
              f.vx = 0;
              f.vrot = 0;
              f.y = floorY;
            }
          }
        } else {
          f.stuckTimer += dt;
          if (f.stuckTimer > 45) {
            releaseFish(f);
            f.el.remove();
            ctx.activeFishes.splice(i, 1);
            continue;
          }
        }

        if (f.x < -300 || f.x > ctx.vw + 300 || f.y > ctx.vh + 300) {
          releaseFish(f);
          f.el.remove();
          ctx.activeFishes.splice(i, 1);
          continue;
        }

        const size = ctx.sizeMultiplier || 1;
        const fx = Math.round(f.x - 8 * size);
        const fy = Math.round(f.y - 14 * size);
        const fr = f.rot.toFixed(1);
        f.el.style.transform = `translate3d(${fx}px, ${fy}px, 0) rotate(${fr}deg)`;
      }
    }

    return {
      spawnFishTreat,
      updateFishes
    };
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
