import Phaser from 'phaser';
import { startRun } from '../lib/run.js';
import { getLang, setLang, t } from '../lib/i18n.js';

const INPUT_STYLE =
  'width: 480px; padding: 12px 16px; font-size: 32px; text-align: center; ' +
  'border: 3px solid #ffffff; border-radius: 8px; background: #ffffff; color: #0b3d91; outline: none;';

export default class NameEntryScene extends Phaser.Scene {
  constructor() {
    super('NameEntry');
  }

  create() {
    const { width, height } = this.scale;
    this.add.image(width / 2, height / 2, 'bg');
    this.add.image(width / 2, height / 2 - 260, 'crest');

    this.add.text(width / 2, height / 2 - 160, t('title'), { fontSize: '64px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

    const input = this.add.dom(width / 2, height / 2 - 20, 'input', INPUT_STYLE).node;
    input.maxLength = 20;
    input.placeholder = t('namePlaceholder');
    input.focus();

    const startButton = this.add
      .text(width / 2, height / 2 + 90, t('start'), {
        fontSize: '40px',
        color: '#ffffff',
        backgroundColor: '#e30613',
        padding: { x: 40, y: 14 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const tryStart = () => {
      const name = input.value.trim();
      if (!name) return;
      startRun(name);
      this.scene.start('Maze');
    };
    const refreshButton = () => startButton.setAlpha(input.value.trim() ? 1 : 0.4);
    refreshButton();
    input.addEventListener('input', refreshButton);
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') tryStart();
    });
    startButton.on('pointerdown', tryStart);

    this.addLangToggle(width - 40, height - 40);
  }

  addLangToggle(x, y) {
    const make = (offsetX, lang) =>
      this.add
        .text(x + offsetX, y, lang.toUpperCase(), {
          fontSize: '28px',
          color: getLang() === lang ? '#ffffff' : '#7f9bd1',
          fontStyle: getLang() === lang ? 'bold' : 'normal',
        })
        .setOrigin(1, 1)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          setLang(lang);
          this.scene.restart();
        });
    make(0, 'en');
    this.add.text(x - 60, y, '|', { fontSize: '28px', color: '#7f9bd1' }).setOrigin(1, 1);
    make(-80, 'ka');
  }
}
