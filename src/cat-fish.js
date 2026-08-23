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

    let ufoActive = false;

    function spawnUFO() {
      if (ufoActive) return false;
      if (typeof ctx.claimActivePickup === 'function' && !ctx.claimActivePickup('fish')) return false;

      ufoActive = true;
      const el = document.createElement('div');
      el.className = 'pixel-ufo';
      el.style.backgroundImage = `url("${ctx.u('assets/animations/ufo.png')}")`;
      
      const startLeft = Math.random() < 0.5;
      const startX = startLeft ? -100 : ctx.vw + 100;
      const endX = startLeft ? ctx.vw + 100 : -100;
      const dropX = ctx.vw * 0.15 + Math.random() * (ctx.vw * 0.7);
      
      let x = startX;
      let y = 40 + Math.random() * 40;
      let hasDropped = false;
      let time = 0;

      el.style.left = x + 'px';
      el.style.top = y + 'px';
      document.body.appendChild(el);

      const speedX = startLeft ? 180 : -180;

      let lastTime = performance.now();
      function updateUFO(now) {
        if (!el.isConnected || !ufoActive) return;
        const dt = (now - lastTime) / 1000;
        lastTime = now;
        
        if (dt < 0.2) {
          time += dt;
          x += speedX * dt;
          const currentY = y + Math.sin(time * 2.5) * 20;
          
          el.style.left = x + 'px';
          el.style.top = currentY + 'px';

          if (!hasDropped) {
            if ((startLeft && x >= dropX) || (!startLeft && x <= dropX)) {
              hasDropped = true;
              spawnFishTreat(x + 17, currentY + 49, true);
            }
          }

          if ((startLeft && x > endX) || (!startLeft && x < endX)) {
            el.remove();
            ufoActive = false;
            return;
          }
        }
        requestAnimationFrame(updateUFO);
      }
      
      requestAnimationFrame((now) => { lastTime = now; updateUFO(now); });
      return true;
    }

    function spawnFishTreat(customX, customY, isFromUfo = false) {
      if (ctx.activeFishes.length >= 1) return false;
      if (!isFromUfo && typeof ctx.hasActivePickup === 'function' && ctx.hasActivePickup()) return false;

      if (!isFromUfo && customX === undefined && Math.random() < 0.2 && !ctx.isFrog) {
        return spawnUFO();
      }

      if (!isFromUfo && typeof ctx.claimActivePickup === 'function' && !ctx.claimActivePickup('fish')) return false;

      const isFly = !isFromUfo && !!ctx.isFrog;
      const el = document.createElement('div');
      el.className = isFly ? 'pixel-fly' : 'pixel-fish';
      if (isFly) {
        el.style.backgroundImage = `url("${ctx.u('assets/animations/frog/fly.png')}")`;
      } else {
        el.style.backgroundImage = fishImgUrls[(Math.random() * 3) | 0];
      }
      document.body.appendChild(el);

      const fromSide = Math.random() < 0.5;
      const isLeft = Math.random() < 0.5;
      
      const flyFromTop = isFly && Math.random() < 0.6;
      const flyStartX = flyFromTop
        ? (ctx.vw * 0.15 + Math.random() * (ctx.vw * 0.7))
        : (isLeft ? -20 : ctx.vw + 20);
      const flyStartY = flyFromTop ? -20 : Math.max(50, ctx.vh - 200 + (Math.random() - 0.5) * 80);
      const flyInitVx = flyFromTop ? (Math.random() - 0.5) * 80 : ((isLeft ? 1 : -1) * (120 + Math.random() * 80));
      const flyInitVy = flyFromTop ? (70 + Math.random() * 50) : (Math.random() - 0.5) * 60;
      const initialX = customX !== undefined ? customX : (isFly ? flyStartX : (fromSide ? (isLeft ? -20 : ctx.vw + 20) : (ctx.vw * 0.1 + Math.random() * (ctx.vw * 0.8))));
      const initialY = customY !== undefined ? customY : (isFly ? flyStartY : (fromSide ? (Math.random() * (ctx.vh * 0.5)) : -40));
      const initialVx = customX !== undefined ? 0 : (isFly ? flyInitVx : (fromSide ? ((isLeft ? 1 : -1) * (150 + Math.random() * 150)) : (Math.random() - 0.5) * 100));
      const initialVy = customY !== undefined ? 0 : (isFly ? flyInitVy : (fromSide ? -100 - Math.random() * 200 : 0));
      
      const firstWaypointY = Math.max(50, ctx.vh - 80 - Math.random() * 140);

      const f = {
        el,
        isFly,
        x: isFly ? flyStartX : initialX,
        y: initialY,
        vx: initialVx,
        vy: initialVy,
        rot: 0,
        vrot: isFly ? 0 : (Math.random() - 0.5) * 720,
        onGround: false,
        stuckTimer: 0,
        isHeld: false,
        animTimer: 0,
        animFrame: 0,
        targetX: ctx.vw * (0.15 + Math.random() * 0.7),
        targetY: isFly ? firstWaypointY : Math.max(60, ctx.vh - 120 + (Math.random() - 0.5) * 50),
        retargetTimer: 1.5 + Math.random() * 2.0
      };

      el.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        f.isHeld = true;
        f.manualSpawned = true;
        f.userInteracted = true;
        f.persistentChase = true;
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
        f.manualSpawned = true;
        f.userInteracted = true;
        f.persistentChase = true;
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
      if (ctx.autoFishSpawnEnabled && !ctx.isSkeleton) {
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
        if (f.isFly) {
          f.animTimer = (f.animTimer || 0) + dt;
          if (f.animTimer >= 0.05) {
            f.animTimer = 0;
            f.animFrame = 1 - (f.animFrame || 0);
            f.el.style.backgroundPosition = f.animFrame === 0 ? "0 0" : "0 100%";
          }
        }
        if (f.isHeld) {
          f.stuckTimer = 0;
          f.rot *= 0.85;
        } else if (f.isFly) {
          f.retargetTimer -= dt;
          if (f.panicTimer > 0) f.panicTimer -= dt;
          if (f.escapeCooldown > 0) f.escapeCooldown -= dt;

          if (ctx.feetX !== undefined && ctx.feetY !== undefined && (f.panicTimer || 0) <= 0 && (f.escapeCooldown || 0) <= 0) {
            const distToPet = Math.hypot(f.x - ctx.feetX, f.y - ctx.feetY);
            if (distToPet < 130 && Math.random() < 0.04) {
              f.panicTimer = 0.7 + Math.random() * 0.4;
              f.escapeCooldown = 6.0 + Math.random() * 5.0; 
              const fleeRight = f.x >= ctx.feetX;
              f.targetX = fleeRight ? Math.min(ctx.vw - 40, f.x + 180 + Math.random() * 100) : Math.max(40, f.x - 180 - Math.random() * 100);
              f.targetY = Math.max(50, ctx.vh - 200 - Math.random() * 50);
              f.retargetTimer = f.panicTimer;
            }
          }

          const distToTarget = Math.hypot(f.targetX - f.x, f.targetY - f.y);
          if ((f.retargetTimer <= 0 && (f.panicTimer || 0) <= 0) || distToTarget < 40) {
            f.targetX = 80 + Math.random() * Math.max(100, ctx.vw - 160);
            
            const goHigh = Math.random() < 0.3;
            const minH = goHigh ? Math.max(50, ctx.vh - 380) : Math.max(50, ctx.vh - 160);
            const maxH = goHigh ? Math.max(minH + 60, ctx.vh - 160) : Math.max(minH + 30, ctx.vh - 40);
            f.targetY = minH + Math.random() * (maxH - minH);
            f.retargetTimer = 1.2 + Math.random() * 2.5;
          }
          const dx = f.targetX - f.x;
          const dy = f.targetY - f.y;
          const len = Math.hypot(dx, dy) || 1;
          const speed = ((f.panicTimer || 0) > 0) ? (320 + Math.random() * 100) : (160 + Math.random() * 60);
          const tvx = (dx / len) * speed + (Math.random() - 0.5) * 90;
          const tvy = (dy / len) * speed + (Math.random() - 0.5) * 90;
          f.vx += (tvx - f.vx) * Math.min(1, dt * 5.0);
          f.vy += (tvy - f.vy) * Math.min(1, dt * 5.0);
          f.x += f.vx * dt;
          f.y += f.vy * dt;

          if (f.x < 30) { f.x = 30; f.vx = Math.abs(f.vx); }
          if (f.x > ctx.vw - 30) { f.x = ctx.vw - 30; f.vx = -Math.abs(f.vx); }
          if (f.y < 25) { f.y = 25; f.vy = Math.abs(f.vy); }
          if (f.y > ctx.vh - 30) { f.y = ctx.vh - 30; f.vy = -Math.abs(f.vy); }
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
        if (f.isFly) {
          const fx = Math.round(f.x - 16 * size);
          const fy = Math.round(f.y - 16 * size);
          const flip = f.vx < -5 ? -1 : 1;
          const tilt = (f.vy * 0.08).toFixed(1);
          f.el.style.transform = `translate3d(${fx}px, ${fy}px, 0) scaleX(${flip}) rotate(${tilt}deg)`;
        } else {
          const fx = Math.round(f.x - 8 * size);
          const fy = Math.round(f.y - 14 * size);
          const fr = f.rot.toFixed(1);
          f.el.style.transform = `translate3d(${fx}px, ${fy}px, 0) rotate(${fr}deg)`;
        }
      }
    }

    return {
      spawnFishTreat,
      updateFishes
    };
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
