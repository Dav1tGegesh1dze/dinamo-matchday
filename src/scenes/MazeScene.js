import Phaser from 'phaser';
import { showPlaceholder } from './placeholder.js';

export default class MazeScene extends Phaser.Scene {
  constructor() {
    super('Maze');
  }

  create() {
    showPlaceholder(this, 'Maze', 'Question');
  }
}
