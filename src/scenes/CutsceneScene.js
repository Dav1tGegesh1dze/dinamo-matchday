import Phaser from 'phaser';
import { showPlaceholder } from './placeholder.js';

export default class CutsceneScene extends Phaser.Scene {
  constructor() {
    super('Cutscene');
  }

  create() {
    showPlaceholder(this, 'Cutscene', 'Pitch');
  }
}
