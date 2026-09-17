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
    this.load.image('pitch', 'pitch.png');
    this.load.image('board', 'board.png');
    this.load.image('ball', 'ball.png');
  }

  create() {
    this.scene.start('NameEntry');
  }
}
