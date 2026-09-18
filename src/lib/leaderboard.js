const KEY = 'dinamo-leaderboard';

export function getAll() {
  return JSON.parse(localStorage.getItem(KEY) || '[]');
}

export function save(attempt) {
  localStorage.setItem(KEY, JSON.stringify([...getAll(), attempt]));
}

export function getRanked() {
  return getAll()
    .filter((a) => a.scored)
    .sort((a, b) => a.timeMs - b.timeMs);
}
