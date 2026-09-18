const KEY = 'dinamo-mute';

export function isMuted() {
  return localStorage.getItem(KEY) === '1';
}

export function applyMute(scene) {
  scene.sound.mute = isMuted();
}

export function toggleMute(scene) {
  localStorage.setItem(KEY, isMuted() ? '0' : '1');
  applyMute(scene);
  return isMuted();
}
