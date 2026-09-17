import Phaser from 'phaser';
import { showPlaceholder } from './placeholder.js';

export default class NameEntryScene extends Phaser.Scene {
  constructor() {
    super('NameEntry');
  }

  create() {
    showPlaceholder(this, 'Name Entry', 'Maze');
  }
}
