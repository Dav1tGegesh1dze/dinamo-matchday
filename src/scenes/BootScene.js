import Phaser from 'phaser';

const CHARACTERS = ['player', 'defender', 'keeper', 'coach'];

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    this.load.setPath('assets');
    this.load.tilemapTiledJSON('maze', 'maze.json');
    CHARACTERS.forEach((key) => this.load.spritesheet(key, `${key}.png`, { frameWidth: 32, frameHeight: 48 }));
    ['tiles', 'pitch', 'board', 'ball', 'goal', 'vision', 'boots', 'shirt', 'panel', 'button', 'bar', 'crest', 'bg'].forEach((key) =>
      this.load.image(key, `${key}.png`),
    );
  }

  create() {
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
