import Phaser from 'phaser';
import { questions, COUNTDOWN_SECONDS, POOL_BY_STAGE } from '../data/questions.js';
import { getLang } from '../lib/i18n.js';
import { createTimer } from '../lib/hud.js';
import { setStage } from '../lib/run.js';

const BUTTON_POSITIONS = [
  [400, 440],
  [880, 440],
  [400, 540],
  [880, 540],
];
const BUTTON_STYLE = { fontSize: '30px', color: '#0b3d91', fontStyle: 'bold' };
const GREEN = 0x1a9e3f;
const RED = 0xe30613;
const REVEAL_MS = 1500;
const CONFIRM_MS = 600;

// Pause `scene`, show the question for `stage` on top of it, resume and report the result.
export function askQuestion(scene, stage, onAnswered) {
  setStage(stage);
  scene.scene.get('Question').events.once('answered', (correct) => {
    scene.scene.resume();
    onAnswered(correct);
  });
  scene.scene.pause();
  scene.scene.launch('Question', { stage });
  scene.scene.bringToTop('Question');
}

// Overlay scene. Launched by askQuestion with { stage: 1..4 }; emits 'answered' (true|false) on its events, then stops.
export default class QuestionScene extends Phaser.Scene {
  constructor() {
    super('Question');
  }

  init({ stage }) {
    this.stage = stage;
  }

  create() {
    const { width, height } = this.scale;
    const lang = getLang();
    const question = Phaser.Utils.Array.GetRandom(questions[POOL_BY_STAGE[this.stage - 1]]);
    const order = Phaser.Utils.Array.Shuffle([0, 1, 2, 3]);
    const correctButton = order.indexOf(question.correct);

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    this.add.image(width / 2, 380, 'panel');
    this.add
      .text(width / 2, 250, question[lang].text, { fontSize: '40px', color: '#ffffff', fontStyle: 'bold', align: 'center', wordWrap: { width: 1000 } })
      .setOrigin(0.5);

    this.buttons = BUTTON_POSITIONS.map(([x, y], i) => {
      const button = this.add.image(x, y, 'button').setInteractive({ useHandCursor: true });
      button.on('pointerdown', () => this.answer(i, correctButton));
      button.label = this.add.text(x, y, question[lang].answers[order[i]], BUTTON_STYLE).setOrigin(0.5);
      return button;
    });

    const seconds = COUNTDOWN_SECONDS[this.stage - 1];
    const bar = this.add.image(120, 600, 'bar').setOrigin(0, 0.5).setScale(130, 1);
    this.tweens.add({ targets: bar, scaleX: 0, duration: seconds * 1000, ease: 'Linear' });
    this.countdownText = this.add.text(1160, 600, String(seconds), { fontSize: '32px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    this.countdown = this.time.addEvent({
      delay: 1000,
      repeat: seconds - 1,
      callback: () => {
        const left = this.countdown.getOverallRemainingSeconds();
        this.countdownText.setText(String(Math.ceil(left)));
        if (left <= 0) this.answer(-1, correctButton);
      },
    });

    createTimer(this);
  }

  paint(index, tint) {
    this.buttons[index].setTint(tint);
    this.buttons[index].label.setColor('#ffffff');
  }

  answer(chosen, correctButton) {
    this.countdown.remove();
    this.buttons.forEach((b) => b.disableInteractive());
    const correct = chosen === correctButton;
    this.paint(correctButton, GREEN);
    if (!correct && chosen >= 0) this.paint(chosen, RED);
    this.time.delayedCall(correct ? CONFIRM_MS : REVEAL_MS, () => {
      this.events.emit('answered', correct);
      this.scene.stop();
    });
  }
}
