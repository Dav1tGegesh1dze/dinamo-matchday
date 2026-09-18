import Phaser from 'phaser';
import { run, startRun } from '../lib/run.js';
import { save, getRanked, exportJson, reset } from '../lib/leaderboard.js';
import { formatTime } from '../lib/hud.js';
import { t } from '../lib/i18n.js';

const RETURN_MS = 15000;
const TOP = 10;
const ROW_H = 38;
const ROW_STYLE = { fontSize: '28px', color: '#ffffff' };
const ADMIN_TAPS = 5;
const ADMIN_TAP_WINDOW_MS = 3000;
const ADMIN_BUTTON = { fontSize: '30px', color: '#ffffff', backgroundColor: '#e30613', padding: { x: 24, y: 12 } };

export default class ResultScene extends Phaser.Scene {
  constructor() {
    super('Result');
  }

  create() {
    const { width, height } = this.scale;
    this.sound.stopByKey('crowd');
    this.add.image(width / 2, height / 2, 'bg');
    const attempt = {
      name: run.name,
      phone: run.phone,
      email: run.email,
      timeMs: run.finishedAt - run.startedAt,
      stageReached: run.stage,
      scored: run.scored,
      date: new Date().toISOString(),
    };
    save(attempt);

    const subtitle = run.scored ? `${t('yourTime')}: ${formatTime(attempt.timeMs)}` : `${t('outAt')}: ${t(`stage${run.stage}`)}`;
    const headline = run.scored ? t('goal') : run.name;
    this.add.text(width / 2, 60, headline, { fontSize: '56px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setInteractive().on('pointerdown', () => this.adminTap());
    this.add.text(width / 2, 125, subtitle, { fontSize: '34px', color: '#ffd500' }).setOrigin(0.5);

    this.add.text(width / 2, 190, t('leaderboard'), { fontSize: '30px', color: '#7f9bd1', fontStyle: 'bold' }).setOrigin(0.5);
    const ranked = getRanked();
    if (ranked.length === 0) {
      this.add.text(width / 2, 240, t('noScores'), ROW_STYLE).setOrigin(0.5);
    }
    const own = ranked.findIndex((a) => a.date === attempt.date);
    ranked.slice(0, TOP).forEach((a, i) => this.addRow(i, a, 240 + i * ROW_H, i === own));
    if (own >= TOP) this.addRow(own, attempt, 240 + (TOP + 0.5) * ROW_H, true);

    this.time.delayedCall(RETURN_MS, () => this.scene.start('NameEntry'));
    this.addRetry(width - 150, 60);
    this.addAdminKeys();
  }

  // Same registered player, new run straight into the maze.
  addRetry(x, y) {
    const retry = () => {
      startRun(run);
      this.sound.play('whistle');
      this.scene.start('Maze');
    };
    this.add
      .text(x, y, t('retry'), { fontSize: '30px', color: '#ffffff', backgroundColor: '#e30613', padding: { x: 24, y: 12 } })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', retry);
    this.input.keyboard.on('keydown-ENTER', retry);
  }

  // Hidden admin access, only on this screen: Ctrl+Shift+E exports, Ctrl+Shift+X resets,
  // or tap the headline 5 times (touch devices) to open a panel with both.
  addAdminKeys() {
    const combo = (event) => event.ctrlKey && event.shiftKey;
    this.input.keyboard.on('keydown-E', (event) => combo(event) && exportJson());
    this.input.keyboard.on('keydown-X', (event) => combo(event) && this.confirmReset());
    this.adminTaps = 0;
  }

  adminTap() {
    this.adminTaps += 1;
    this.time.delayedCall(ADMIN_TAP_WINDOW_MS, () => (this.adminTaps = Math.max(0, this.adminTaps - 1)));
    if (this.adminTaps === ADMIN_TAPS) this.showAdminPanel();
  }

  showAdminPanel() {
    const { width, height } = this.scale;
    this.add.text(width / 2 - 140, height - 60, 'Export JSON', ADMIN_BUTTON).setOrigin(0.5).setInteractive().on('pointerdown', exportJson);
    this.add.text(width / 2 + 140, height - 60, 'Reset board', ADMIN_BUTTON).setOrigin(0.5).setInteractive().on('pointerdown', () => this.confirmReset());
  }

  confirmReset() {
    if (window.confirm(t('confirmReset'))) {
      reset();
      this.scene.start('NameEntry');
    }
  }

  addRow(index, attempt, y, mine) {
    const { width } = this.scale;
    const style = mine ? { ...ROW_STYLE, color: '#ffd500', fontStyle: 'bold' } : ROW_STYLE;
    this.add.text(width / 2 - 260, y, `${index + 1}.`, style).setOrigin(1, 0.5);
    this.add.text(width / 2 - 230, y, attempt.name, style).setOrigin(0, 0.5);
    this.add.text(width / 2 + 260, y, formatTime(attempt.timeMs), style).setOrigin(1, 0.5);
  }
}
