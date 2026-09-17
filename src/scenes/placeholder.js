// Temporary scaffold: shows the scene name and advances on Space / Enter.
// Each scene replaces this with its real content as its roadmap feature lands.
export function showPlaceholder(scene, title, nextKey) {
  const { width, height } = scene.scale;
  scene.add.text(width / 2, height / 2 - 40, title, { fontSize: '64px', color: '#ffffff' }).setOrigin(0.5);
  scene.add.text(width / 2, height / 2 + 40, 'Press Space or Enter', { fontSize: '28px', color: '#cccccc' }).setOrigin(0.5);
  scene.input.keyboard.once('keydown-SPACE', () => scene.scene.start(nextKey));
  scene.input.keyboard.once('keydown-ENTER', () => scene.scene.start(nextKey));
}
