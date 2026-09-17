import Phaser from 'phaser';
import { showPlaceholder } from './placeholder.js';
import { createTimer } from '../lib/hud.js';

export default class PitchScene extends Phaser.Scene {
  constructor() {
    super('Pitch');
  }

  create() {
    showPlaceholder(this, 'Pitch', 'Result');
    createTimer(this);
  }
}
