export const run = { name: '', startedAt: 0 };

export function startRun(name) {
  run.name = name;
  run.startedAt = Date.now();
}
