import Phaser from 'phaser';
import { showPlaceholder } from './placeholder.js';
import { createTimer } from '../lib/hud.js';

export default class QuestionScene extends Phaser.Scene {
  constructor() {
    super('Question');
  }

  create() {
    showPlaceholder(this, 'Question', 'Cutscene');
    createTimer(this);
  }
}
