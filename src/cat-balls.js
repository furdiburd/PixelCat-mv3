(function(global) {
  'use strict';

  global.PixelCatBalls = function(ctx) {
    const ballPhysics = {
      ball_baseball:   { img: ctx.u('assets/balls/baseball.png'),   bounciness: 0.62, gravMult: 1.0,  spinRate: 900,  groundFriction: 0.90, airDrag: 0.995 },
      ball_tennis:     { img: ctx.u('assets/balls/tennis.png'),     bounciness: 0.85, gravMult: 0.75, spinRate: 1400, groundFriction: 0.88, airDrag: 0.993 },
      ball_golf:       { img: ctx.u('assets/balls/golf.png'),       bounciness: 0.45, gravMult: 1.3,  spinRate: 350,  groundFriction: 0.82, airDrag: 0.998 },
      ball_basketball: { img: ctx.u('assets/balls/basketball.png'), bounciness: 0.76, gravMult: 1.05, spinRate: 650,  groundFriction: 0.86, airDrag: 0.994 },
      ball_football:   { img: ctx.u('assets/balls/football.png'),   bounciness: 0.55, gravMult: 1.0,  spinRate: 1600, groundFriction: 0.78, airDrag: 0.993 },
      ball_volleyball: { img: ctx.u('assets/balls/valleyball.png'), bounciness: 0.88, gravMult: 0.55, spinRate: 850,  groundFriction: 0.93, airDrag: 0.990 },
      ball_bowling:    { img: ctx.u('assets/balls/bowling.png'),    bounciness: 0.22, gravMult: 2.2,  spinRate: 180,  groundFriction: 0.75, airDrag: 0.999 }
    };
    const defaultBallPhysics = ballPhysics.ball_baseball;
    let ballTimerPausedForObject = false;

    function nextBallSpawnDelay() {
      return 90 + Math.random() * 180 + (Math.random() < 0.15 ? 60 : 0);
    }

    function spawnBall(customX, customY) {
      if (ctx.activeBalls.length >= 1) return false;
      if (typeof ctx.hasActivePickup === 'function' && ctx.hasActivePickup()) return false;
      if (typeof ctx.claimActivePickup === 'function' && !ctx.claimActivePickup('ball')) return false;

      const physics = ballPhysics[ctx.activeBallId] || defaultBallPhysics;

      const el = document.createElement('div');
      el.className = 'pixel-ball';
      el.style.backgroundImage = `url("${physics.img}")`;
      document.body.appendChild(el);

      const b = {
        el,
        x: customX !== undefined ? customX : (ctx.vw / 2 + (Math.random() - 0.5) * 400),
        y: customY !== undefined ? customY : -60,
        vx: customX !== undefined ? 0 : (Math.random() - 0.5) * 600,
        vy: customY !== undefined ? 0 : 100,
        rot: 0,
        vrot: (Math.random() - 0.5) * physics.spinRate,
        onGround: false,
        isHeld: false,
        bounciness: physics.bounciness,
        gravMult: physics.gravMult,
        groundFriction: physics.groundFriction,
        airDrag: physics.airDrag,
        lifetime: 45 + Math.random() * 30,
        age: 0,
        hitCount: 0,
        exitAfter: 18 + Math.random() * 28,
        exitHitAfter: 4 + Math.floor(Math.random() * 5),
        exiting: false,
        removing: false,
        exitOnWall: false
      };

      el.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        b.isHeld = true;
        ctx.draggedBall = b;
        ctx.ballDragOffsetX = e.clientX - b.x;
        ctx.ballDragOffsetY = e.clientY - b.y;
        b.vx = 0;
        b.vy = 0;
        b.vrot = 0;
        b.onGround = false;
        ctx.targetBall = b;
        ctx.lastBallDragX = b.x;
        ctx.lastBallDragY = b.y;
        ctx.lastBallDragTs = ctx.safeNow();
        el.style.cursor = 'grabbing';
        if (typeof ctx.speakObjectInteraction === 'function') ctx.speakObjectInteraction('ball');
      });

      el.addEventListener('touchstart', (e) => {
        const t = e.touches[0];
        if (!t) return;
        e.preventDefault();
        e.stopPropagation();
        b.isHeld = true;
        ctx.draggedBall = b;
        ctx.ballDragOffsetX = t.clientX - b.x;
        ctx.ballDragOffsetY = t.clientY - b.y;
        b.vx = 0;
        b.vy = 0;
        b.vrot = 0;
        b.onGround = false;
        ctx.targetBall = b;
        ctx.lastBallDragX = b.x;
        ctx.lastBallDragY = b.y;
        ctx.lastBallDragTs = ctx.safeNow();
        el.style.cursor = 'grabbing';
        if (typeof ctx.speakObjectInteraction === 'function') ctx.speakObjectInteraction('ball');
      }, { passive: false });

      ctx.activeBalls.push(b);
      return true;
    }

    function releaseBall(ball) {
      if (!ball || ball.pickupReleased) return;
      ball.pickupReleased = true;
      if (typeof ctx.releaseActivePickup === 'function') ctx.releaseActivePickup('ball');
    }

    function removeBall(ball) {
      if (!ball || ball.removing) return;
      ball.removing = true;
      if (ctx.targetBall === ball) ctx.targetBall = null;
      if (ctx.draggedBall === ball) ctx.draggedBall = null;
      releaseBall(ball);
      if (ball.el && ball.el.isConnected) ball.el.remove();
      const idx = ctx.activeBalls.indexOf(ball);
      if (idx > -1) ctx.activeBalls.splice(idx, 1);
    }

    function sendBallOffscreen(ball, dir) {
      if (!ball || ball.removing || ball.exiting) return;
      const sideDir = dir || (ball.x < ctx.vw / 2 ? -1 : 1);
      ball.exiting = true;
      ball.isHeld = false;
      ball.onGround = false;
      ball.exitOnWall = false;
      ball.el.style.animation = 'none';
      ball.vx = sideDir * Math.max(720, Math.abs(ball.vx || 0));
      ball.vy = Math.min(ball.vy || 0, -120 - Math.random() * 160);
      ball.vrot = sideDir * Math.max(900, Math.abs(ball.vrot || 0));
      if (ctx.targetBall === ball) ctx.targetBall = null;
      if (ctx.draggedBall === ball) ctx.draggedBall = null;
    }

    function updateBalls(dt) {
      if (!ctx.catEnabled || !ctx.ballEnabled) {
        if (ctx.activeBalls.length > 0) {
          ctx.activeBalls.forEach((b) => {
            releaseBall(b);
            b.el.remove();
          });
          ctx.activeBalls.length = 0;
        }
        ballTimerPausedForObject = false;
        return;
      }

      const spawnBlocked = ctx.activeBalls.length > 0 || (typeof ctx.hasActivePickup === 'function' && ctx.hasActivePickup());
      if (spawnBlocked) {
        ballTimerPausedForObject = true;
      } else {
        if (ballTimerPausedForObject) {
          ctx.ballSpawnTimer = nextBallSpawnDelay();
          ballTimerPausedForObject = false;
        }
        ctx.ballSpawnTimer -= dt;
        if (ctx.ballSpawnTimer <= 0) {
          if (spawnBall()) {
            ctx.ballSpawnTimer = nextBallSpawnDelay();
            ballTimerPausedForObject = true;
          } else {
            ctx.ballSpawnTimer = nextBallSpawnDelay();
          }
        }
      }

      const size = ctx.sizeMultiplier || 1;
      const ballSize = 20 * size;
      const floorY = ctx.vh - ballSize;
      for (let i = ctx.activeBalls.length - 1; i >= 0; i--) {
        const b = ctx.activeBalls[i];
        if (b.removing) continue;

        if (b.exiting) {
          b.vy += ctx.GRAVITY * (b.gravMult || 1.0) * dt * 0.35;
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.rot += b.vrot * dt;
          b.el.style.transform = `translate3d(${b.x | 0}px, ${b.y | 0}px, 0) rotate(${b.rot | 0}deg)`;
          if (b.x < -80 || b.x > ctx.vw + 80 || b.y > ctx.vh + 120) {
            removeBall(b);
          }
          continue;
        }

        if (!b.isHeld) {
          b.age += dt;
          b.lifetime -= dt;
          if (b.lifetime <= 0) {
            sendBallOffscreen(b);
            continue;
          }
          if (b.lifetime < 5 && b.lifetime > 4.5) {
            b.el.style.animation = 'ballWarning 0.5s ease-in-out 10';
          }
        }

        if (b.isHeld) {
          b.rot += (b.vx * 0.05);
          b.idleTimer = 0;
        } else {
          b.vx *= (b.airDrag || 0.995);
          b.vrot *= 0.992;

          b.vy += ctx.GRAVITY * (b.gravMult || 1.0) * dt;
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.rot += b.vrot * dt;

          if (b.y >= floorY) {
            b.y = floorY;
            b.vy = -b.vy * b.bounciness;
            b.vx *= (b.groundFriction || 0.92);
            if (Math.abs(b.vy) < 60) { b.vy = 0; b.onGround = true; }
            if (Math.abs(b.vy) > 200 && Math.random() < 0.3) ctx.spawnDust(b.x + 10, b.y + 20);
          }

          if (b.x < 0) {
            if (b.exitOnWall) {
              sendBallOffscreen(b, -1);
            } else {
              b.x = 0; b.vx = Math.abs(b.vx) * 0.7; b.vrot *= -0.8;
            }
          }
          if (b.x > ctx.vw - ballSize) {
            if (b.exitOnWall) {
              sendBallOffscreen(b, 1);
            } else {
              b.x = ctx.vw - ballSize; b.vx = -Math.abs(b.vx) * 0.7; b.vrot *= -0.8;
            }
          }

          if (Math.abs(b.vx) < 5 && Math.abs(b.vy) < 5 && b.onGround) {
            b.idleTimer = (b.idleTimer || 0) + dt;
            if (b.idleTimer > 30) {
              sendBallOffscreen(b);
              continue;
            }
          } else {
            b.idleTimer = 0;
          }
        }

        const bx = Math.round(b.x);
        const by = Math.round(b.y);
        const br = b.rot.toFixed(1);
        b.el.style.transform = `translate3d(${bx}px, ${by}px, 0) rotate(${br}deg)`;
      }
    }

    return {
      spawnBall,
      updateBalls
    };
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
