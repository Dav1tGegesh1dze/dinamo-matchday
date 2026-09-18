import Phaser from 'phaser';
import { startRun } from '../lib/run.js';
import { getLang, setLang, t } from '../lib/i18n.js';
import { isMuted, toggleMute } from '../lib/sound.js';

const INPUT_STYLE =
  'display:block; width: 480px; margin: 0 0 14px; padding: 10px 16px; font-size: 28px; text-align: center; ' +
  'border: 3px solid #ffffff; border-radius: 8px; background: #ffffff; color: #0b3d91; outline: none; box-sizing: border-box;';

// [field id, validator on the trimmed value, error string key]
const RULES = [
  ['name', (v) => v.length >= 2 && v.length <= 20, 'errName'],
  ['phone', (v) => /^\+?\d{9,15}$/.test(v), 'errPhone'],
  ['email', (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'errEmail'],
];

export default class NameEntryScene extends Phaser.Scene {
  constructor() {
    super('NameEntry');
  }

  create() {
    const { width, height } = this.scale;
    this.add.image(width / 2, height / 2, 'bg');
    this.add.image(width / 2, 90, 'crest');
    this.add.text(width / 2, 180, t('title'), { fontSize: '56px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

    const form = this.add.dom(width / 2, 370).createFromHTML(
      ['name', 'phone', 'email']
        .map((id) => `<input id="${id}" maxlength="${id === 'name' ? 20 : 40}" placeholder="${t(`${id}Placeholder`)}" style="${INPUT_STYLE}">`)
        .join(''),
    );
    this.inputs = Object.fromEntries(RULES.map(([id]) => [id, form.node.querySelector(`#${id}`)]));
    this.inputs.name.focus();

    this.error = this.add.text(width / 2, 505, '', { fontSize: '24px', color: '#ffd500' }).setOrigin(0.5);
    this.startButton = this.add
      .text(width / 2, 570, t('start'), { fontSize: '40px', color: '#ffffff', backgroundColor: '#e30613', padding: { x: 40, y: 14 } })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.tryStart());

    Object.values(this.inputs).forEach((input) => {
      input.addEventListener('input', () => this.refreshButton());
      input.addEventListener('keydown', (event) => event.key === 'Enter' && this.tryStart());
    });
    this.refreshButton();

    this.addLangToggle(width - 40, height - 40);
    this.addMuteToggle(40, height - 40);
  }

  values() {
    const values = Object.fromEntries(RULES.map(([id]) => [id, this.inputs[id].value.trim()]));
    values.phone = values.phone.replace(/[\s-]/g, '');
    return values;
  }

  firstInvalid() {
    const values = this.values();
    return RULES.find(([id, valid]) => !valid(values[id]));
  }

  refreshButton() {
    const invalid = this.firstInvalid();
    this.startButton.setAlpha(invalid ? 0.4 : 1);
    if (!invalid) this.error.setText('');
  }

  tryStart() {
    const invalid = this.firstInvalid();
    if (invalid) {
      this.error.setText(t(invalid[2]));
      this.inputs[invalid[0]].focus();
      return;
    }
    if (!this.scale.isFullscreen) this.scale.startFullscreen();
    startRun(this.values());
    this.sound.play('whistle');
    this.scene.start('Maze');
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

  addMuteToggle(x, y) {
    const icon = this.add.image(x, y, isMuted() ? 'sound-off' : 'sound-on').setInteractive({ useHandCursor: true });
    icon.on('pointerdown', () => icon.setTexture(toggleMute(this) ? 'sound-off' : 'sound-on'));
  }
}
