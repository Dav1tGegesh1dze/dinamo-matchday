import Phaser from 'phaser';
import { run } from '../lib/run.js';
import { createTimer } from '../lib/hud.js';

const PLAYER_END = { x: 420, y: 420 };

export default class CutsceneScene extends Phaser.Scene {
  constructor() {
    super('Cutscene');
  }

  create() {
    const { width, height } = this.scale;
    this.add.image(width / 2, height / 2, 'pitch');

    const player = this.add.sprite(-40, 560, 'player').play('player-walk');
    const board = this.add.container(width / 2, height + 100, [
      this.add.image(0, 0, 'board'),
      this.add.text(0, -40, 'OUT  9', { fontSize: '28px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5),
      this.add.text(0, 40, `IN  ${run.name}`, { fontSize: '28px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5),
    ]);
    const ball = this.add.image(width + 40, PLAYER_END.y, 'ball');

    this.tweens.chain({
      tweens: [
        { targets: player, x: PLAYER_END.x, y: PLAYER_END.y, duration: 1600, ease: 'Sine.easeInOut', onComplete: () => player.anims.stop().setFrame(0) },
        { targets: board, y: 160, duration: 700, ease: 'Back.easeOut', hold: 1200 },
        { targets: board, y: height + 100, duration: 500, ease: 'Back.easeIn' },
        { targets: ball, x: PLAYER_END.x + 30, angle: -720, duration: 900, ease: 'Cubic.easeOut', hold: 500 },
      ],
      onComplete: () => this.scene.start('Pitch'),
    });

    createTimer(this);
  }
}
