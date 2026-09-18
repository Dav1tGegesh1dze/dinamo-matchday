import Phaser from 'phaser';
import { createInput } from '../lib/input.js';
import { createTimer, flashMessage } from '../lib/hud.js';
import { t } from '../lib/i18n.js';
import { finishRun } from '../lib/run.js';
import { askQuestion } from './QuestionScene.js';

const SPEED = 150;

export default class MazeScene extends Phaser.Scene {
  constructor() {
    super('Maze');
  }

  create() {
    const map = this.make.tilemap({ key: 'maze' });
    const tiles = map.addTilesetImage('tiles', 'tiles');
    map.createLayer('floor', tiles);
    const walls = map.createLayer('walls', tiles);
    walls.setCollisionByProperty({ collides: true });

    const objects = map.getObjectLayer('objects').objects;
    const spawn = objects.find((o) => o.name === 'spawn');
    const coach = objects.find((o) => o.name === 'coach');
    objects
      .filter((o) => o.type === 'label')
      .forEach((o) => this.add.text(o.x, o.y, t(o.name), { fontSize: '20px', color: '#0b3d91', fontStyle: 'bold' }).setOrigin(0.5));

    this.add.image(coach.x + coach.width / 2, coach.y + coach.height / 2, 'coach');
    const coachZone = this.add.zone(coach.x, coach.y, coach.width, coach.height).setOrigin(0);
    this.physics.add.existing(coachZone, true);

    this.player = this.physics.add.sprite(spawn.x, spawn.y, 'player');
    this.player.body.setSize(24, 24);
    this.physics.add.collider(this.player, walls);
    this.physics.add.overlap(this.player, coachZone, () => this.reachCoach());

    this.controls = createInput(this);
    createTimer(this);
  }

  reachCoach() {
    this.physics.pause();
    askQuestion(this, 1, (correct) => {
      if (!correct) finishRun(false);
      flashMessage(this, t(correct ? 'substitutedIn' : 'stayOnBench'), 1500, correct ? 'Cutscene' : 'Result');
    });
  }

  update() {
    const { x, y } = this.controls.getAxis();
    this.player.setVelocity(x * SPEED, y * SPEED);
  }
}
