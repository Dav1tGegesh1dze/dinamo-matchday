// The maze only ever asks for a direction: keyboard always, plus an on-screen joystick on touch devices.
const RADIUS = 50;

export function createInput(scene) {
  const keys = scene.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT');
  const stick = scene.sys.game.device.input.touch ? createJoystick(scene) : null;
  return {
    getAxis() {
      if (stick && stick.active) return { x: stick.x, y: stick.y };
      const x = (keys.D.isDown || keys.RIGHT.isDown ? 1 : 0) - (keys.A.isDown || keys.LEFT.isDown ? 1 : 0);
      const y = (keys.S.isDown || keys.DOWN.isDown ? 1 : 0) - (keys.W.isDown || keys.UP.isDown ? 1 : 0);
      const length = Math.hypot(x, y) || 1;
      return { x: x / length, y: y / length };
    },
  };
}

function createJoystick(scene) {
  const cx = 110;
  const cy = scene.scale.height - 110;
  const stick = { active: false, x: 0, y: 0 };
  scene.add.image(cx, cy, 'joystick-base').setDepth(1000).setScrollFactor(0);
  const knob = scene.add.image(cx, cy, 'joystick-knob').setDepth(1001).setScrollFactor(0);
  let pointerId = null;

  const release = () => {
    pointerId = null;
    stick.active = false;
    knob.setPosition(cx, cy);
  };
  scene.input.on('pointerdown', (pointer) => {
    if (pointerId === null && Math.hypot(pointer.x - cx, pointer.y - cy) <= RADIUS * 1.6) pointerId = pointer.id;
  });
  scene.input.on('pointermove', (pointer) => {
    if (pointer.id !== pointerId) return;
    const dx = pointer.x - cx;
    const dy = pointer.y - cy;
    const length = Math.min(Math.hypot(dx, dy), RADIUS) || 1;
    const angle = Math.atan2(dy, dx);
    stick.x = (Math.cos(angle) * length) / RADIUS;
    stick.y = (Math.sin(angle) * length) / RADIUS;
    stick.active = true;
    knob.setPosition(cx + stick.x * RADIUS, cy + stick.y * RADIUS);
  });
  scene.input.on('pointerup', (pointer) => pointer.id === pointerId && release());
  return stick;
}
