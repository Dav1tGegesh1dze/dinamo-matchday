import Phaser from 'phaser';
import { createInput } from '../lib/input.js';
import { createTimer, flashMessage } from '../lib/hud.js';
import { t } from '../lib/i18n.js';
import { finishRun } from '../lib/run.js';
import { askQuestion } from './QuestionScene.js';

const SPEED = 150;
const HINT_MS = 1500;
const STEP_MS = 280;

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

    this.add.sprite(coach.x + coach.width / 2, coach.y + coach.height / 2 - 8, 'coach');
    const coachZone = this.add.zone(coach.x, coach.y, coach.width, coach.height).setOrigin(0);
    this.physics.add.existing(coachZone, true);

    this.player = this.physics.add.sprite(spawn.x, spawn.y, 'player');
    this.player.body.setSize(24, 20).setOffset(4, 26);
    this.physics.add.collider(this.player, walls);
    this.physics.add.overlap(this.player, coachZone, () => this.reachCoach());

    this.createKit(objects.filter((o) => o.type === 'kit'));
    this.createDarkness(map.widthInPixels, map.heightInPixels);

    this.controls = createInput(this);
    createTimer(this);
    this.time.addEvent({ delay: STEP_MS, loop: true, callback: () => this.player.body.speed > 0 && this.sound.play('step') });
  }

  // Kit items are scattered in the decoy rooms; the coach only lets you through with all of them.
  createKit(items) {
    this.kitLeft = items.length;
    this.hudIcons = {};
    items.forEach((item, i) => {
      this.hudIcons[item.name] = this.add.image(36 + i * 44, 36, item.name).setScale(1.5).setAlpha(0.25).setDepth(1000);
      const pickup = this.physics.add.staticImage(item.x, item.y, item.name);
      this.physics.add.overlap(this.player, pickup, () => {
        pickup.destroy();
        this.sound.play('pickup');
        this.hudIcons[item.name].setAlpha(1);
        this.kitLeft -= 1;
      });
    });
  }

  // Everything outside a soft circle around the player is hidden.
  createDarkness(width, height) {
    this.vision = this.make.image({ key: 'vision', add: false });
    const darkness = this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0).setDepth(500);
    const mask = darkness.createBitmapMask(this.vision);
    mask.invertAlpha = true;
    darkness.setMask(mask);
  }

  reachCoach() {
    if (this.kitLeft > 0) return this.showHint();
    this.physics.pause();
    askQuestion(this, 1, (correct) => {
      if (!correct) finishRun(false);
      flashMessage(this, t(correct ? 'substitutedIn' : 'stayOnBench'), 1500, correct ? 'Cutscene' : 'Result');
    });
  }

  showHint() {
    if (this.hint) return;
    this.hint = this.add
      .text(Phaser.Math.Clamp(this.player.x, 180, this.scale.width - 180), this.player.y - 40, t('kitFirst'), { fontSize: '22px', color: '#ffffff', backgroundColor: '#e30613', padding: { x: 10, y: 6 } })
      .setOrigin(0.5)
      .setDepth(1000);
    this.time.delayedCall(HINT_MS, () => {
      this.hint.destroy();
      this.hint = null;
    });
  }

  update() {
    const { x, y } = this.controls.getAxis();
    this.player.setVelocity(x * SPEED, y * SPEED);
    if (x || y) {
      this.player.anims.play('player-walk', true);
    } else {
      this.player.anims.stop();
      this.player.setFrame(0);
    }
    if (x) this.player.setFlipX(x < 0);
    this.vision.setPosition(this.player.x, this.player.y + 8);
  }
}
