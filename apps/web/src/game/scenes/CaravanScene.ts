import Phaser from 'phaser';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../config/createGameConfig.js';
import { Caravan } from '../entities/Caravan.js';
import { Hero } from '../entities/Hero.js';
import { BackgroundScroll } from '../systems/BackgroundScroll.js';
import { movementFromKeys } from '../systems/MovementInput.js';
import { seededRandom } from '../systems/seededRandom.js';

export interface RunWorldConfig { width: number; height: number; seed: number }

export class CaravanScene extends Phaser.Scene {
  private hero!: Hero;
  private background!: BackgroundScroll;
  private keys!: Record<'W' | 'A' | 'S' | 'D' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT', Phaser.Input.Keyboard.Key>;
  private random = seededRandom(1);
  constructor() { super('CaravanScene'); }
  create(data: RunWorldConfig = { width: WORLD_WIDTH, height: WORLD_HEIGHT, seed: 1 }): void {
    this.random = seededRandom(data.seed);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.background = new BackgroundScroll(this);
    new Caravan(this, WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    this.hero = new Hero(this, WORLD_WIDTH / 2, WORLD_HEIGHT / 2 + 110);
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT') as typeof this.keys;
    const clearInput = (): void => this.hero?.setInput({ x: 0, y: 0 });
    window.addEventListener('blur', clearInput);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => window.removeEventListener('blur', clearInput));
  }
  update(_time: number, delta: number): void {
    if (!this.hero?.active) return;
    this.hero.setInput(movementFromKeys({
      up: this.keys.W.isDown || this.keys.UP.isDown,
      down: this.keys.S.isDown || this.keys.DOWN.isDown,
      left: this.keys.A.isDown || this.keys.LEFT.isDown,
      right: this.keys.D.isDown || this.keys.RIGHT.isDown,
    }));
    this.background.update(delta);
    const body = this.hero.body as Phaser.Physics.Arcade.Body;
    body.position.x = Phaser.Math.Clamp(body.position.x, 0, WORLD_WIDTH - body.width);
    body.position.y = Phaser.Math.Clamp(body.position.y, 0, WORLD_HEIGHT - body.height);
  }
  getWorldSeedSample(): number { return this.random(); }
  getTravelDistance(): number { return this.background?.getDistance() ?? 0; }
}
