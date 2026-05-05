// 
//  PIXELCAT PORTAL SYSTEM - Teleportation with smooth animations
// 

(function(global) {
  'use strict';

  global.PixelCatPortals = function(ctx) {
    const PORTAL_SHEET_GREEN = ctx.u('assets/animations/green-portal.png');
    const PORTAL_SHEET_PURPLE = ctx.u('assets/animations/purple-portal.png');
    const PORTAL_CELL = 64;  // Portal sprite is 64x64
    const PORTAL_SCALE = 1.5;
    const PORTAL_SIZE = PORTAL_CELL * PORTAL_SCALE; // 96px
    const HALF_PORTAL = PORTAL_SIZE / 2; // 48px
    // Pushing to 48px (Exactly HALF_PORTAL). Center is now precisely on the screen boundary.
    const SPRITE_PAD = 48; // px of transparent padding on each side (scaled)
    
    // Animation frames: Row 0 = idle (8 frames), Row 1 = opening (8 frames), Row 2 = closing (8 frames)
    const PORTAL_ANIMS = {
      idle: { row: 0, frames: 8, fps: 8 },
      opening: { row: 1, frames: 8, fps: 12 },
      closing: { row: 2, frames: 8, fps: 12 }
    };

    let activePortals = [];
    let portalPairId = 0;

    function createPortal(x, y, color, pairId, placement) {
      const el = document.createElement('div');
      el.className = 'pixel-portal';
      el.style.position = 'fixed';
      el.style.left = '0px';
      el.style.top = '0px';
      el.style.width = (PORTAL_CELL * PORTAL_SCALE) + 'px';
      el.style.height = (PORTAL_CELL * PORTAL_SCALE) + 'px';
      el.style.zIndex = '9999985';
      el.style.pointerEvents = 'none';
      el.style.backgroundImage = `url("${color === 'green' ? PORTAL_SHEET_GREEN : PORTAL_SHEET_PURPLE}")`;
      el.style.backgroundSize = `${8 * PORTAL_CELL * PORTAL_SCALE}px ${3 * PORTAL_CELL * PORTAL_SCALE}px`;
      el.style.backgroundRepeat = 'no-repeat';
      el.style.imageRendering = 'pixelated';
      
      document.body.appendChild(el);

      const portal = {
        el,
        x,
        y,
        color,
        pairId,
        placement, // 'ground', 'left', 'right', 'ceiling'
        state: 'opening',
        animAccum: 0,
        curFrame: 0,
        linkedPortal: null,
        isActive: false
      };

      return portal;
    }

    function spawnPortalPair() {
      const margin = 100;
      
      // Correct formula for all placements: center = edge ± (HALF_PORTAL - SPRITE_PAD)
      // This ensures the visible oval edge is EXACTLY flush with the screen boundary.
      //
      // Portal 1 (green) always on the ground — horizontal oval flat on the floor.
      const groundX = margin + Math.random() * (ctx.vw - margin * 2);
      const groundY = ctx.vh - HALF_PORTAL + SPRITE_PAD; // visible oval bottom = vh
      
      // Portal 2 (purple) on left wall, right wall, or ceiling.
      const placements = ['left', 'right', 'ceiling'];
      const placement2 = placements[Math.floor(Math.random() * placements.length)];
      
      let x2, y2;
      
      switch (placement2) {
        case 'left':
          // Vertical oval flush with left edge: visible oval left = 0
          x2 = HALF_PORTAL - SPRITE_PAD;
          y2 = margin + Math.random() * (ctx.vh - margin * 2 - 100);
          break;
        case 'right':
          // Vertical oval flush with right edge: visible oval right = vw
          x2 = ctx.vw - HALF_PORTAL + SPRITE_PAD;
          y2 = margin + Math.random() * (ctx.vh - margin * 2 - 100);
          break;
        case 'ceiling':
          x2 = margin + Math.random() * (ctx.vw - margin * 2);
          // Horizontal oval flush with ceiling: visible oval top = 0
          y2 = HALF_PORTAL - SPRITE_PAD;
          break;
      }

      const id = portalPairId++;
      const portal1 = createPortal(groundX, groundY, 'green', id, 'ground');
      const portal2 = createPortal(x2, y2, 'purple', id, placement2);

      portal1.linkedPortal = portal2;
      portal2.linkedPortal = portal1;

      activePortals.push(portal1, portal2);

      // Schedule portal removal after 30-60 seconds (portals are rare & precious)
      const lifetime = 30000 + Math.random() * 30000;
      ctx.addTimeout(() => {
        closePortalPair(portal1, portal2);
      }, lifetime);
    }

    function closePortalPair(portal1, portal2) {
      if (portal1 && portal1.state !== 'closing') {
        portal1.state = 'closing';
        portal1.curFrame = 0;
        portal1.animAccum = 0;
        portal1.isActive = false;
      }
      if (portal2 && portal2.state !== 'closing') {
        portal2.state = 'closing';
        portal2.curFrame = 0;
        portal2.animAccum = 0;
        portal2.isActive = false;
      }
    }

    function updatePortals(dt) {
      for (let i = activePortals.length - 1; i >= 0; i--) {
        const portal = activePortals[i];
        
        // Update animation
        portal.animAccum += dt * 1000;
        const animDef = PORTAL_ANIMS[portal.state];
        const msPerFrame = 1000 / animDef.fps;
        
        if (portal.animAccum >= msPerFrame) {
          portal.animAccum -= msPerFrame;
          portal.curFrame++;
          
          if (portal.curFrame >= animDef.frames) {
            if (portal.state === 'opening') {
              // Transition to idle after opening
              portal.state = 'idle';
              portal.curFrame = 0;
              portal.isActive = true;
            } else if (portal.state === 'closing') {
              // Remove portal after closing animation
              portal.el.remove();
              activePortals.splice(i, 1);
              continue;
            } else {
              // Loop idle animation
              portal.curFrame = 0;
            }
          }
        }

        // Update sprite position
        const bgX = -portal.curFrame * PORTAL_CELL * PORTAL_SCALE;
        const bgY = -animDef.row * PORTAL_CELL * PORTAL_SCALE;
        portal.el.style.backgroundPosition = `${bgX}px ${bgY}px`;
        
        // Rotation: ground/ceiling need 90° so the vertical oval becomes a horizontal
        // "hole" on the floor/ceiling. Walls stay at 0° so the oval stays upright like a doorway.
        let rotation = 0;
        switch (portal.placement) {
          case 'ground':  rotation = 90;  break; // Flat horizontal oval on floor
          case 'ceiling': rotation = 90;  break; // Flat horizontal oval on ceiling
          case 'left':    rotation = 0;   break; // Vertical oval emerging from left wall
          case 'right':   rotation = 0;   break; // Vertical oval emerging from right wall
        }
        
        // Center the element around portal.x, portal.y
        const px = Math.round(portal.x - HALF_PORTAL);
        const py = Math.round(portal.y - HALF_PORTAL);
        
        portal.el.style.transform = `translate3d(${px}px, ${py}px, 0) rotate(${rotation}deg)`;
      }
    }

    function checkCatPortalCollision(catX, catY) {
      for (let i = 0; i < activePortals.length; i++) {
        const portal = activePortals[i];
        
        if (!portal.isActive || !portal.linkedPortal || !portal.linkedPortal.isActive) {
          continue;
        }

        const dx = catX - portal.x;
        const dy = catY - portal.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Adjust collision radius based on placement
        let collisionRadius = 50;
        if (portal.placement === 'left' || portal.placement === 'right') {
          collisionRadius = 60; // Slightly larger for wall portals
        } else if (portal.placement === 'ceiling') {
          collisionRadius = 55;
        }
        
        // Check if cat is close enough to portal
        if (dist < collisionRadius) {
          return portal;
        }
      }
      return null;
    }

    function teleportCat(portal) {
      if (!portal.linkedPortal || !portal.linkedPortal.isActive) {
        return null;
      }
      
      const destination = portal.linkedPortal;
      let targetX = destination.x;
      let targetY = destination.y;

      // Spawn cat at the visible oval's inner edge + a small gap.
      // inner_edge = HALF_PORTAL - SPRITE_PAD = 48 - 36 = 12px from center, then add gap.
      const INNER = HALF_PORTAL - SPRITE_PAD; // = 12px
      switch (destination.placement) {
        case 'ground':
          targetY = destination.y - INNER - 10;
          break;
        case 'ceiling':
          targetY = destination.y + INNER + 60;
          break;
        case 'left':
          targetX = destination.x + INNER + 60;
          break;
        case 'right':
          targetX = destination.x - INNER - 60;
          break;
      }
      
      return {
        x: targetX,
        y: targetY,
        portal: destination
      };
    }

    function cleanup() {
      for (let i = activePortals.length - 1; i >= 0; i--) {
        if (activePortals[i].el && activePortals[i].el.isConnected) {
          activePortals[i].el.remove();
        }
      }
      activePortals = [];
    }

    return {
      spawnPortalPair,
      updatePortals,
      checkCatPortalCollision,
      teleportCat,
      cleanup,
      get activePortals() { return activePortals; }
    };
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
