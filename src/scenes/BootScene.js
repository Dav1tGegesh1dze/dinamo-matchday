import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    this.load.setPath('assets');
    this.load.tilemapTiledJSON('maze', 'maze.json');
    this.load.image('tiles', 'tiles.png');
    this.load.image('player', 'player.png');
    this.load.image('coach', 'coach.png');
  }

  create() {
    this.scene.start('NameEntry');
  }
}
