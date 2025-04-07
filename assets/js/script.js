// const shaft = document.getElementById('shaft');

// Fishing Game
// Fish behavior component
AFRAME.registerComponent('fish', {
  schema: {
    speed: { type: 'number', default: 0.5 },
    range: { type: 'number', default: 3 },
    catchable: { type: 'boolean', default: true },
  },

  init: function () {
    this.originalPosition = this.el.object3D.position.clone();
    this.time = Math.random() * 1000; // Random starting time for variety
    this.caught = false;

    // Setup click handler for catching fish
    this.el.addEventListener('click', () => {
      if (this.data.catchable && !this.caught && GLOBAL_GAME_STATE.fishing) {
        this.caught = true;

        // Calculate distance to hook
        const hook = document.querySelector('#fishing-hook');
        const hookPos = hook.object3D.position;
        const fishPos = this.el.object3D.position;
        const distance = Math.sqrt(Math.pow(hookPos.x - fishPos.x, 2) + Math.pow(hookPos.y - fishPos.y, 2) + Math.pow(hookPos.z - fishPos.z, 2));

        // Only catch if close enough to hook
        if (distance < 2) {
          GLOBAL_GAME_STATE.score++;
          document.querySelector('#score-text').setAttribute('value', `Fish: ${GLOBAL_GAME_STATE.score}`);

          // Animate fish to follow hook
          this.el.setAttribute('animation', {
            property: 'position',
            to: `0 1 0`,
            dur: 2000,
            easing: 'easeInOutQuad',
          });

          // Reset fish after catch
          setTimeout(() => {
            this.el.setAttribute('position', {
              x: this.originalPosition.x + Math.random() * 5 - 2.5,
              y: this.originalPosition.y,
              z: this.originalPosition.z + Math.random() * 5 - 2.5,
            });
            this.caught = false;
          }, 2000);
        }
      }
    });
  },

  tick: function (time, deltaTime) {
    if (this.caught) return;

    this.time += deltaTime * 0.001 * this.data.speed;

    // Swimming motion
    const offset = Math.sin(this.time) * this.data.range;
    const position = this.el.object3D.position;
    position.x = this.originalPosition.x + offset;

    // Face the direction of movement
    if (Math.cos(this.time) > 0) {
      this.el.object3D.rotation.y = Math.PI * 0.5;
    } else {
      this.el.object3D.rotation.y = Math.PI * 1.5;
    }
  },
});

// Fishing rod controller
AFRAME.registerComponent('fishing-rod', {
  init: function () {
    this.isFishing = false;
    this.fishingLine = document.querySelector('#fishing-line');
    this.fishingHook = document.querySelector('#fishing-hook');

    // Setup click handler for casting/reeling
    this.el.addEventListener('click', () => {
      if (!this.isFishing) {
        this.castLine();
      } else {
        this.reelIn();
      }
    });
  },

  castLine: function () {
    this.isFishing = true;
    GLOBAL_GAME_STATE.fishing = true;

    // Animate fishing line to water
    this.fishingLine.setAttribute('visible', true);
    this.fishingHook.setAttribute('visible', true);

    const waterY = 0.1;
    const randomX = Math.random() * 10 - 5;
    const randomZ = Math.random() * 5 - 12;

    this.fishingHook.setAttribute('animation', {
      property: 'position',
      to: `${randomX} ${waterY} ${randomZ}`,
      dur: 1000,
      easing: 'easeOutQuad',
    });

    // Update fishing line
    this.updateLine();
  },

  reelIn: function () {
    this.isFishing = false;
    GLOBAL_GAME_STATE.fishing = false;

    // Animate hook back to rod
    this.fishingHook.setAttribute('animation', {
      property: 'position',
      to: '0.3 1.2 -0.5',
      dur: 1000,
      easing: 'easeInQuad',
    });

    // Update fishing line during animation
    this.updateLine();

    // Hide fishing line when reeled in
    setTimeout(() => {
      this.fishingLine.setAttribute('visible', false);
      this.fishingHook.setAttribute('visible', false);
    }, 1000);
  },

  updateLine: function () {
    const intervalId = setInterval(() => {
      if (!this.el.sceneEl.isPlaying) {
        clearInterval(intervalId);
        return;
      }

      const rodTip = { x: 0.3, y: 1.2, z: -0.5 };
      const hookPos = this.fishingHook.getAttribute('position');

      // Calculate line length and direction
      const dx = hookPos.x - rodTip.x;
      const dy = hookPos.y - rodTip.y;
      const dz = hookPos.z - rodTip.z;
      const length = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Update line to connect rod and hook
      this.fishingLine.setAttribute('geometry', {
        primitive: 'cylinder',
        height: length,
        radius: 0.01,
      });

      // Position line at midpoint between rod and hook
      this.fishingLine.setAttribute('position', {
        x: rodTip.x + dx / 2,
        y: rodTip.y + dy / 2,
        z: rodTip.z + dz / 2,
      });

      // Orient line to connect rod and hook
      const phi = Math.atan2(dx, dz);
      const theta = Math.acos(dy / length);
      this.fishingLine.setAttribute('rotation', {
        x: (theta * 180) / Math.PI,
        y: (phi * 180) / Math.PI,
        z: 0,
      });

      // Stop updating when not fishing
      if (!this.isFishing && !GLOBAL_GAME_STATE.fishing) {
        clearInterval(intervalId);
      }
    }, 50);
  },
});

// Global game state object
const GLOBAL_GAME_STATE = {
  score: 0,
  fishing: false,
};
