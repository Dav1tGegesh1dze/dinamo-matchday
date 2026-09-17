import Phaser from 'phaser';
import { showPlaceholder } from './placeholder.js';
import { createTimer } from '../lib/hud.js';

export default class MazeScene extends Phaser.Scene {
  constructor() {
    super('Maze');
  }

  create() {
    showPlaceholder(this, 'Maze', 'Question');
    createTimer(this);
  }
}
