import Phaser from 'phaser';
import { applyMute } from '../lib/sound.js';

const CHARACTERS = ['player', 'defender', 'keeper', 'coach'];
const SOUNDS = ['whistle', 'correct', 'wrong', 'pickup', 'tackle', 'save', 'goal', 'step', 'crowd', 'maze-music'];

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    this.load.setPath('assets');
    this.load.tilemapTiledJSON('maze', 'maze.json');
    CHARACTERS.forEach((key) => this.load.spritesheet(key, `${key}.png`, { frameWidth: 32, frameHeight: 48 }));
    ['tiles', 'pitch', 'board', 'ball', 'goal', 'vision', 'boots', 'shirt', 'tape', 'panel', 'button', 'bar', 'crest', 'bg', 'sound-on', 'sound-off', 'joystick-base', 'joystick-knob'].forEach(
      (key) => this.load.image(key, `${key}.png`),
    );
    SOUNDS.forEach((key) => this.load.audio(key, `${key}.wav`));
  }

  create() {
    applyMute(this);
    this.input.mouse.disableContextMenu();
    CHARACTERS.forEach((key) =>
      this.anims.create({
        key: `${key}-walk`,
        frames: this.anims.generateFrameNumbers(key, { start: 1, end: 3 }),
        frameRate: 8,
        repeat: -1,
      }),
    );
    this.scene.start('NameEntry');
  }
}
