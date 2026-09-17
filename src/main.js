import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import NameEntryScene from './scenes/NameEntryScene.js';
import MazeScene from './scenes/MazeScene.js';
import QuestionScene from './scenes/QuestionScene.js';
import CutsceneScene from './scenes/CutsceneScene.js';
import PitchScene from './scenes/PitchScene.js';
import ResultScene from './scenes/ResultScene.js';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  dom: { createContainer: true },
  physics: { default: 'arcade' },
  width: 1280,
  height: 720,
  backgroundColor: '#0b3d91',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    BootScene,
    NameEntryScene,
    MazeScene,
    QuestionScene,
    CutsceneScene,
    PitchScene,
    ResultScene,
  ],
});
