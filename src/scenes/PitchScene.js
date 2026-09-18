import Phaser from 'phaser';
import { finishRun } from '../lib/run.js';
import { t } from '../lib/i18n.js';
import { createTimer, flashMessage } from '../lib/hud.js';
import { askQuestion } from './QuestionScene.js';

const START = { x: 420, y: 420 };
const GOAL = { x: 1230, y: 360 };
const SPEED = 200;
const STAGES = [
  { stage: 2, texture: 'defender', x: 700, y: 420, fail: 'tackled' },
  { stage: 3, texture: 'defender', x: 930, y: 300, fail: 'tackled' },
  { stage: 4, texture: 'keeper', x: 1180, y: 360, fail: 'saved' },
];

export default class PitchScene extends Phaser.Scene {
  constructor() {
    super('Pitch');
  }

  create() {
    const { width, height } = this.scale;
    this.add.image(width / 2, height / 2, 'pitch');
    this.add.image(GOAL.x, GOAL.y, 'goal');
    this.opponents = STAGES.map((s) => this.add.sprite(s.x, s.y, s.texture));
    this.ball = this.add.image(30, 12, 'ball');
    this.playerSprite = this.add.sprite(0, 0, 'player').play('player-walk');
    this.runner = this.add.container(START.x, START.y, [this.playerSprite, this.ball]);
    createTimer(this);
    this.next(0);
  }

  next(i) {
    if (i === STAGES.length) return this.score();
    const { stage, fail } = STAGES[i];
    const opponent = this.opponents[i];
    this.moveTo(opponent.x - 70, opponent.y, () => {
      this.playerSprite.anims.stop();
      this.playerSprite.setFrame(0);
      askQuestion(this, stage, (correct) => {
        this.playerSprite.play('player-walk');
        if (!correct) return this.lose(opponent, fail);
        if (stage === 4) finishRun(true); // the clock stops on the winning answer, not the animation
        this.beat(opponent, () => this.next(i + 1));
      });
    });
  }

  moveTo(x, y, onComplete) {
    const duration = (Phaser.Math.Distance.Between(this.runner.x, this.runner.y, x, y) / SPEED) * 1000;
    this.tweens.add({ targets: this.runner, x, y, duration, ease: 'Sine.easeInOut', onComplete });
  }

  beat(opponent, onComplete) {
    this.tweens.add({ targets: opponent, x: opponent.x - 30, duration: 250, yoyo: true, ease: 'Sine.easeInOut' });
    this.tweens.chain({
      tweens: [
        { targets: this.runner, x: opponent.x, y: opponent.y - 70, duration: 350, ease: 'Sine.easeOut' },
        { targets: this.runner, x: opponent.x + 60, y: opponent.y, duration: 350, ease: 'Sine.easeIn' },
      ],
      onComplete,
    });
  }

  lose(opponent, messageKey) {
    finishRun(false);
    this.sound.play(messageKey);
    this.playerSprite.anims.stop();
    this.tweens.add({ targets: opponent, x: this.runner.x + 30, y: this.runner.y, duration: 300, ease: 'Cubic.easeIn' });
    flashMessage(this, t(messageKey), 1500, 'Result');
  }

  score() {
    this.sound.play('goal');
    const keeper = this.opponents[STAGES.length - 1];
    this.runner.remove(this.ball);
    this.ball.setPosition(this.runner.x + 30, this.runner.y + 12);
    this.playerSprite.anims.stop();
    this.tweens.add({ targets: keeper, y: keeper.y + 90, duration: 400, ease: 'Cubic.easeOut' });
    this.tweens.add({ targets: this.ball, x: GOAL.x + 10, y: GOAL.y - 60, angle: 720, duration: 500, ease: 'Cubic.easeOut' });
    flashMessage(this, t('goal'), 2000, 'Result');
  }
}
