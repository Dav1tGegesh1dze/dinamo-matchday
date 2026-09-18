import Phaser from 'phaser';
import { run } from '../lib/run.js';
import { save, getRanked, exportJson, reset } from '../lib/leaderboard.js';
import { formatTime } from '../lib/hud.js';
import { t } from '../lib/i18n.js';

const RETURN_MS = 15000;
const TOP = 10;
const ROW_H = 38;
const ROW_STYLE = { fontSize: '28px', color: '#ffffff' };

export default class ResultScene extends Phaser.Scene {
  constructor() {
    super('Result');
  }

  create() {
    const { width } = this.scale;
    const attempt = {
      name: run.name,
      timeMs: run.finishedAt - run.startedAt,
      stageReached: run.stage,
      scored: run.scored,
      date: new Date().toISOString(),
    };
    save(attempt);

    const headline = run.scored ? `${t('yourTime')}: ${formatTime(attempt.timeMs)}` : `${t('outAt')}: ${t(`stage${run.stage}`)}`;
    this.add.text(width / 2, 60, run.scored ? t('goal') : run.name, { fontSize: '56px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(width / 2, 125, headline, { fontSize: '34px', color: '#ffd500' }).setOrigin(0.5);

    this.add.text(width / 2, 190, t('leaderboard'), { fontSize: '30px', color: '#7f9bd1', fontStyle: 'bold' }).setOrigin(0.5);
    const ranked = getRanked();
    if (ranked.length === 0) {
      this.add.text(width / 2, 240, t('noScores'), ROW_STYLE).setOrigin(0.5);
    }
    const own = ranked.findIndex((a) => a.date === attempt.date);
    ranked.slice(0, TOP).forEach((a, i) => this.addRow(i, a, 240 + i * ROW_H, i === own));
    if (own >= TOP) this.addRow(own, attempt, 240 + (TOP + 0.5) * ROW_H, true);

    this.time.delayedCall(RETURN_MS, () => this.scene.start('NameEntry'));
    this.addAdminKeys();
  }

  // Hidden admin combos, only on this screen: Ctrl+Shift+E exports, Ctrl+Shift+R resets.
  addAdminKeys() {
    const combo = (event) => event.ctrlKey && event.shiftKey;
    this.input.keyboard.on('keydown-E', (event) => {
      if (combo(event)) exportJson();
    });
    this.input.keyboard.on('keydown-R', (event) => {
      if (!combo(event)) return;
      event.preventDefault();
      if (window.confirm(t('confirmReset'))) {
        reset();
        this.scene.start('NameEntry');
      }
    });
  }

  addRow(index, attempt, y, mine) {
    const { width } = this.scale;
    const style = mine ? { ...ROW_STYLE, color: '#ffd500', fontStyle: 'bold' } : ROW_STYLE;
    this.add.text(width / 2 - 260, y, `${index + 1}.`, style).setOrigin(1, 0.5);
    this.add.text(width / 2 - 230, y, attempt.name, style).setOrigin(0, 0.5);
    this.add.text(width / 2 + 260, y, formatTime(attempt.timeMs), style).setOrigin(1, 0.5);
  }
}
