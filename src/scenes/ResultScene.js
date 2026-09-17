import Phaser from 'phaser';
import { showPlaceholder } from './placeholder.js';

export default class ResultScene extends Phaser.Scene {
  constructor() {
    super('Result');
  }

  create() {
    showPlaceholder(this, 'Result', 'NameEntry');
  }
}
