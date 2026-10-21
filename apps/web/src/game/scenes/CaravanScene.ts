import Phaser from 'phaser';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../config/createGameConfig.js';
import { Caravan } from '../entities/Caravan.js';
import { Enemy } from '../entities/Enemy.js';
import { Hero } from '../entities/Hero.js';
import { enemyCatalog } from '../content/enemies.js';
import { BackgroundScroll } from '../systems/BackgroundScroll.js';
import { AutoAttackSystem } from '../systems/AutoAttackSystem.js';
import { EnemyDirector } from '../systems/EnemyDirector.js';
import { HealthSystem } from '../systems/HealthSystem.js';
import { movementFromKeys } from '../systems/MovementInput.js';
import { RespawnSystem } from '../systems/RespawnSystem.js';
import { seededRandom } from '../systems/seededRandom.js';
import { createRunState } from '../state/RunState.js';

export interface RunWorldConfig { width: number; height: number; seed: number }

export class CaravanScene extends Phaser.Scene {
  private hero!: Hero;
  private background!: BackgroundScroll;
  private readonly enemies: Enemy[] = [];
  private readonly run = createRunState();
  private readonly enemyDirector = new EnemyDirector();
  private readonly autoAttack = new AutoAttackSystem();
  private readonly health = new HealthSystem();
  private readonly respawn = new RespawnSystem();
  private spawnCooldownMs = 900;
  private statusText!: Phaser.GameObjects.Text;
  private heroBar!: Phaser.GameObjects.Graphics;
  private caravanBar!: Phaser.GameObjects.Graphics;
  private gameOverShown = false;
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
    this.statusText = this.add.text(24, 66, '', { fontFamily: 'system-ui, sans-serif', fontSize: '15px', color: '#f4e7ce' }).setScrollFactor(0).setDepth(100);
    this.heroBar = this.add.graphics().setScrollFactor(0).setDepth(100);
    this.caravanBar = this.add.graphics().setScrollFactor(0).setDepth(100);
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT') as typeof this.keys;
    const clearInput = (): void => this.hero?.setInput({ x: 0, y: 0 });
    window.addEventListener('blur', clearInput);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => window.removeEventListener('blur', clearInput));
    this.refreshHud();
  }
  update(_time: number, delta: number): void {
    if (!this.hero?.active || this.run.status !== 'active') return;
    this.run.elapsedSeconds += delta / 1000;
    const revived = this.respawn.update(this.run.player, delta);
    if (revived) {
      this.hero.setPosition(WORLD_WIDTH / 2, WORLD_HEIGHT / 2 + 110).setVisible(true).setAlpha(0.55);
      (this.hero.body as Phaser.Physics.Arcade.Body).enable = true;
    }
    if (!this.run.player.isDead) {
      this.hero.setAlpha(this.run.player.invulnerableMs > 0 && Math.floor(this.run.player.invulnerableMs / 120) % 2 === 0 ? 0.45 : 1);
    }
    this.hero.setInput(movementFromKeys({
      up: this.keys.W.isDown || this.keys.UP.isDown,
      down: this.keys.S.isDown || this.keys.DOWN.isDown,
      left: this.keys.A.isDown || this.keys.LEFT.isDown,
      right: this.keys.D.isDown || this.keys.RIGHT.isDown,
    }));
    this.background.update(delta);
    const body = this.hero.body as Phaser.Physics.Arcade.Body;
    if (!this.run.player.isDead) {
      body.position.x = Phaser.Math.Clamp(body.position.x, 0, WORLD_WIDTH - body.width);
      body.position.y = Phaser.Math.Clamp(body.position.y, 0, WORLD_HEIGHT - body.height);
    }
    const heroPosition = this.run.player.isDead ? { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 + 110 } : { x: this.hero.x, y: this.hero.y };
    const caravanPosition = { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 };
    this.spawnCooldownMs -= delta;
    if (this.spawnCooldownMs <= 0 && this.enemies.length < 36) {
      this.spawnEnemy();
      this.spawnCooldownMs = Math.max(850, 2200 - this.run.elapsedSeconds * 12);
    }
    for (const attack of this.enemyDirector.update(this.enemies, heroPosition, caravanPosition, delta, !this.run.player.isDead)) {
      if (attack.target === 'caravan') this.health.damageCaravan(this.run.caravan, attack.damage, this.run);
      else this.health.damagePlayer(this.run.player, attack.damage);
      if (this.run.player.isDead) {
        this.hero.setVisible(false);
        (this.hero.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
        (this.hero.body as Phaser.Physics.Arcade.Body).enable = false;
      }
    }
    if (!this.run.player.isDead) {
      const hit = this.autoAttack.update(heroPosition, this.enemies, delta);
      if (hit?.killed) this.onEnemyDefeated(hit.enemy);
    }
    for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
      if (this.enemies[i]?.dead) this.removeEnemyAt(i);
    }
    this.refreshHud();
    if (this.run.caravan.hp <= 0 && !this.gameOverShown) this.showGameOver();
  }
  getWorldSeedSample(): number { return this.random(); }
  getTravelDistance(): number { return this.background?.getDistance() ?? 0; }

  private spawnEnemy(): void {
    const angle = this.random() * Math.PI * 2;
    const radiusX = WORLD_WIDTH * 0.55;
    const radiusY = WORLD_HEIGHT * 0.55;
    const x = Phaser.Math.Clamp(WORLD_WIDTH / 2 + Math.cos(angle) * radiusX, 12, WORLD_WIDTH - 12);
    const y = Phaser.Math.Clamp(WORLD_HEIGHT / 2 + Math.sin(angle) * radiusY, 12, WORLD_HEIGHT - 12);
    const definition = enemyCatalog[this.random() < 0.18 ? 1 : 0]!;
    this.enemies.push(new Enemy(this, x, y, definition));
  }

  private onEnemyDefeated(enemy: Enemy): void {
    this.run.kills += 1;
    this.events.emit('enemy-defeated', {
      enemyId: enemy.definition.id,
      experience: enemy.definition.experience,
      gold: enemy.definition.gold,
      position: enemy.worldPosition,
    });
  }

  private removeEnemyAt(index: number): void {
    const enemy = this.enemies[index];
    if (!enemy) return;
    this.enemies.splice(index, 1);
    enemy.destroy();
  }

  private refreshHud(): void {
    this.statusText?.setText(`적 처치 ${this.run.kills}  ·  생존 ${Math.floor(this.run.elapsedSeconds)}초`);
    this.heroBar?.clear().fillStyle(0x20201d, 0.9).fillRoundedRect(24, 96, 184, 13, 5)
      .fillStyle(0x83bd78).fillRoundedRect(26, 98, 180 * this.run.player.hp / this.run.player.maxHp, 9, 4);
    this.caravanBar?.clear().fillStyle(0x20201d, 0.9).fillRoundedRect(WORLD_WIDTH - 218, 96, 194, 13, 5)
      .fillStyle(0xe0a45d).fillRoundedRect(WORLD_WIDTH - 216, 98, 190 * this.run.caravan.hp / this.run.caravan.maxHp, 9, 4);
  }

  private showGameOver(): void {
    this.gameOverShown = true;
    this.hero.setInput({ x: 0, y: 0 });
    this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, 0x100d0b, 0.72).setDepth(150);
    this.add.text(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, `마차가 파괴되었습니다\n생존 ${Math.floor(this.run.elapsedSeconds)}초 · 처치 ${this.run.kills}`, {
      fontFamily: 'system-ui, sans-serif', fontSize: '30px', color: '#f1d7ac', align: 'center', lineSpacing: 14,
    }).setOrigin(0.5).setDepth(151);
    this.run.status = 'lost';
  }
}
