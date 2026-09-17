import { run } from './run.js';

export function formatTime(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const tenths = Math.floor((ms % 1000) / 100);
  return `${minutes}:${String(seconds).padStart(2, '0')}.${tenths}`;
}

export function createTimer(scene) {
  const text = scene.add
    .text(scene.scale.width - 24, 20, '', { fontSize: '36px', color: '#ffffff', fontStyle: 'bold' })
    .setOrigin(1, 0)
    .setDepth(1000);
  scene.events.on('update', () => text.setText(formatTime(Date.now() - run.startedAt)));
  return text;
}

export function flashMessage(scene, message, duration, nextKey) {
  const { width, height } = scene.scale;
  scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6).setDepth(999);
  scene.add.text(width / 2, height / 2, message, { fontSize: '72px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(1000);
  scene.time.delayedCall(duration, () => scene.scene.start(nextKey));
}
