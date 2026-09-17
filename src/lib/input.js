// The maze only ever asks for a direction. A touch joystick can be added here later
// as a second source writing into the same { x, y } without touching MazeScene.
export function createInput(scene) {
  const keys = scene.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT');
  return {
    getAxis() {
      const x = (keys.D.isDown || keys.RIGHT.isDown ? 1 : 0) - (keys.A.isDown || keys.LEFT.isDown ? 1 : 0);
      const y = (keys.S.isDown || keys.DOWN.isDown ? 1 : 0) - (keys.W.isDown || keys.UP.isDown ? 1 : 0);
      const length = Math.hypot(x, y) || 1;
      return { x: x / length, y: y / length };
    },
  };
}
