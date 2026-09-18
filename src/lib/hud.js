import { run } from './run.js';

export function formatTime(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const tenths = Math.floor((ms % 1000) / 100);
  return `${minutes}:${String(seconds).padStart(2, '0')}.${tenths}`;
}

export function createTimer(scene) {
  const text = scene.add
    .text(scene.scale.width - 24, 20, '', { fontSize: '36px', color: '#ffffff', fontStyle: 'bold', backgroundColor: 'rgba(0,0,0,0.55)', padding: { x: 12, y: 4 } })
    .setOrigin(1, 0)
    .setDepth(1000);
  const onUpdate = () => text.setText(formatTime((run.finishedAt || Date.now()) - run.startedAt));
  scene.events.on('update', onUpdate);
  scene.events.once('shutdown', () => scene.events.off('update', onUpdate));
  return text;
}

export function flashMessage(scene, message, duration, nextKey) {
  const { width, height } = scene.scale;
  scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6).setDepth(999);
  scene.add.text(width / 2, height / 2, message, { fontSize: '72px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(1000);
  scene.time.delayedCall(duration, () => scene.scene.start(nextKey));
}
