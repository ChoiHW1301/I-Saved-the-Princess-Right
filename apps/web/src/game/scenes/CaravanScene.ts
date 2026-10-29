import Phaser from 'phaser';
import { ROAD_CENTER_Y, WORLD_HEIGHT, WORLD_WIDTH } from '../config/createGameConfig.js';
import { Caravan } from '../entities/Caravan.js';
import { Enemy } from '../entities/Enemy.js';
import { Warrior } from '../entities/Warrior.js';
import { enemyCatalog, type EnemyDefinition } from '../content/enemies.js';
import { BackgroundScroll } from '../systems/BackgroundScroll.js';
import { EnemyDirector } from '../systems/EnemyDirector.js';
import { HealthSystem } from '../systems/HealthSystem.js';
import { movementFromKeys } from '../systems/MovementInput.js';
import { RespawnSystem } from '../systems/RespawnSystem.js';
import { seededRandom } from '../systems/seededRandom.js';
import { createRunState } from '../state/RunState.js';
import { LevelSystem } from '../systems/LevelSystem.js';
import { gameEventBus } from '../bridge/GameEventBus.js';
import { upgradeCatalog } from '../content/upgrades.js';
import { resolveHit, type Vector2 } from '../systems/CombatSystem.js';
import { CampaignClock } from '../systems/CampaignClock.js';
import { EventSystem } from '../systems/EventSystem.js';
import { getBiomeAt } from '../systems/BiomeTransitionSystem.js';
import type { CampaignMilestone } from '../content/campaignSchedule.js';
import type { BossId, PlayerProfile, RunEndingSummary } from '@caravan/contracts';
import type { CurrentRunSaveV1 } from '@caravan/contracts';
import { getKarmaTier } from '../systems/KarmaSystem.js';
import { chooseFinalBoss } from '../content/bosses.js';
import { BossDirector } from '../systems/BossDirector.js';
import { resolveEnding } from '../systems/EndingSystem.js';
import { getCharacterDefinition } from '../content/characters.js';
import { WeaponSystem } from '../systems/WeaponSystem.js';
import type { CharacterId } from '@caravan/contracts';
import { applyPermanentUpgrade } from '../systems/MetaProgression.js';
import { createSnapshot, mapSnapshotWorldPoint, restoreSnapshot } from '../systems/SaveSnapshotSystem.js';
import { bossCatalog } from '../content/bosses.js';
import { campaignSchedule } from '../content/campaignSchedule.js';
import { enemyForSpawnRoll, scaledEnemyHp } from '../systems/EnemyProgression.js';
import { RewardPickup } from '../entities/RewardPickup.js';
import type { RewardPickupState } from '../systems/RewardPickupSystem.js';
import { chooseRewardType } from '../systems/RewardPickupSystem.js';
import type { StageId } from '../content/biomes.js';

export interface RunWorldConfig { width: number; height: number; seed: number; characterId?: CharacterId; profile?: PlayerProfile; runId?: string; resumeSave?: CurrentRunSaveV1 }

export class CaravanScene extends Phaser.Scene {
  private readonly initialRunConfig?: RunWorldConfig;
  private warrior!: Warrior;
  private background!: BackgroundScroll;
  private readonly enemies: Enemy[] = [];
  private readonly rewardPickups: RewardPickup[] = [];
  private run = createRunState();
  private readonly enemyDirector = new EnemyDirector();
  private readonly weaponSystem = new WeaponSystem();
  private readonly health = new HealthSystem();
  private readonly respawn = new RespawnSystem();
  private levelSystem!: LevelSystem;
  private campaignClock!: CampaignClock;
  private eventSystem!: EventSystem;
  private activeBossMilestoneId: string | null = null;
  private activeBossId: BossId | null = null;
  private activeBossIsFinal = false;
  private finalBossForRun: BossId | undefined;
  private readonly bossDirector = new BossDirector();
  private pendingFinalVictory = false;
  private spawnCooldownMs = 2000;
  private hudValueTexts: Phaser.GameObjects.Text[] = [];
  private warriorBar!: Phaser.GameObjects.Graphics;
  private caravanBar!: Phaser.GameObjects.Graphics;
  private damageFlash!: Phaser.GameObjects.Graphics;
  private gameOverShown = false;
  private runEndEmitted = false;
  private keys!: Record<'W' | 'A' | 'S' | 'D' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT', Phaser.Input.Keyboard.Key>;
  private random = seededRandom(1);
  private uiPaused = false;
  private levelUpAnnouncing = false;
  private approachingEvent: { eventId: string; x: number; sprite: Phaser.GameObjects.Image } | null = null;
  private readonly warningMilestones = new Set<string>();
  constructor(initialRunConfig?: RunWorldConfig) { super('CaravanScene'); this.initialRunConfig = initialRunConfig; }
  preload(): void {
    this.load.image('terrain-demon-castle', '/game-assets/terrain-demon-castle.png');
    this.load.image('terrain-lava-fields', '/game-assets/terrain-lava-fields.png');
    this.load.image('terrain-meadow-village', '/game-assets/terrain-meadow-village.png');
    this.load.image('terrain-enchanted-forest', '/game-assets/terrain-enchanted-forest.png');
    this.load.image('caravan-sprite', '/game-assets/caravan.png');
    this.load.image('portrait-warrior', '/game-assets/portrait-warrior.png');
    this.load.image('portrait-archer', '/game-assets/portrait-archer.png');
    this.load.image('portrait-mage', '/game-assets/portrait-mage.png');
    this.load.image('portrait-merchant', '/game-assets/portrait-merchant.png');
    this.load.image('demon-sprite', '/game-assets/demon.png');
    this.load.image('fortune-wraith-sprite', '/game-assets/monsters/fortune-wraith.png');
    this.load.spritesheet('encounter-atlas', '/game-assets/encounters/atlas.png', { frameWidth: 627, frameHeight: 627 });
    this.load.spritesheet('ui-icons', '/game-assets/ui/icons-atlas.png', { frameWidth: 313, frameHeight: 313 });
    this.load.spritesheet('death-keep-ghoul', '/game-assets/monsters/death-keep-ghoul.png', { frameWidth: 543, frameHeight: 724 });
  }
  create(data?: RunWorldConfig): void {
    data = { width: WORLD_WIDTH, height: WORLD_HEIGHT, seed: 1, ...this.initialRunConfig, ...data };
    if (!this.anims.exists('monster-death')) this.anims.create({
      key: 'monster-death', frames: this.anims.generateFrameNumbers('death-keep-ghoul', { start: 0, end: 3 }), frameRate: 9, repeat: 0,
    });
    const snapshot = data.resumeSave?.snapshot;
    const selectedCharacter = snapshot?.characterId ?? data.characterId ?? 'warrior';
    if (data.profile && !data.profile.unlockedCharacters.includes(selectedCharacter)) {
      throw new Error(`Character is locked for this profile: ${selectedCharacter}`);
    }
    this.run = snapshot && data.resumeSave ? restoreSnapshot(data.resumeSave) : createRunState(selectedCharacter);
    if (!snapshot) applyPermanentUpgrade(data.profile ?? this.emptyProfile(), this.run);
    if (data.runId) this.run.runId = data.runId;
    this.gameOverShown = false;
    this.runEndEmitted = false;
    this.levelUpAnnouncing = false;
    this.finalBossForRun = undefined;
    this.activeBossMilestoneId = null;
    this.activeBossId = null;
    this.activeBossIsFinal = false;
    this.pendingFinalVictory = false;
    this.random = seededRandom(snapshot?.rngSeed ?? data.seed);
    this.levelSystem = new LevelSystem(() => this.random());
    const emittedMilestones = snapshot ? campaignSchedule.filter((milestone) => {
      if (milestone.atSeconds > snapshot.elapsedSeconds) return false;
      return milestone.kind === 'event'
        ? snapshot.eventChoiceIds.some((id) => id.startsWith(`${milestone.id}:`)) || snapshot.pendingEventId === milestone.id || snapshot.approachingEvent?.eventId === milestone.id
        : milestone.kind === 'final-boss'
          ? snapshot.defeatedBossIds.some((id) => id === 'princess-demon' || id === 'king-guard') || snapshot.activeBoss?.id === milestone.id
          : snapshot.defeatedBossIds.includes(milestone.id as BossId) || snapshot.activeBoss?.id === milestone.id;
    }).map((milestone) => milestone.id) : [];
    this.campaignClock = new CampaignClock(campaignSchedule, snapshot ? { elapsedSeconds: snapshot.elapsedSeconds, emittedIds: emittedMilestones } : undefined);
    this.campaignClock.elapsedSeconds = snapshot?.elapsedSeconds ?? 0;
    this.eventSystem = new EventSystem();
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.fadeIn(800, 0, 0, 0);
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.background = new BackgroundScroll(this, snapshot?.stageId as StageId | undefined);
    new Caravan(this, WORLD_WIDTH / 2, ROAD_CENTER_Y);
    this.warrior = new Warrior(this, snapshot?.player.x ?? WORLD_WIDTH / 2 - 145, snapshot?.player.y ?? ROAD_CENTER_Y, this.run.characterId);
    this.warrior.setKarmaTier(getKarmaTier(this.run.karma));
    this.warrior.moveSpeed = getCharacterDefinition(this.run.characterId).baseStats.speed + (this.run.upgradeStats['movement-speed'] ?? 0);
    this.spawnCooldownMs = snapshot?.ordinarySpawnCooldownMs ?? 2000;
    if (snapshot?.approachingEvent) {
      const eventSprite = this.add.image(snapshot.approachingEvent.x, ROAD_CENTER_Y, 'encounter-atlas', encounterFrame(snapshot.approachingEvent.eventId)).setDisplaySize(72, 72).setDepth(9);
      this.approachingEvent = { ...snapshot.approachingEvent, sprite: eventSprite };
    }
    for (const saved of snapshot?.rewardPickups ?? []) {
      const point = mapSnapshotWorldPoint(saved, snapshot!, { width: WORLD_WIDTH, height: WORLD_HEIGHT, roadCenterY: ROAD_CENTER_Y });
      const pickup = new RewardPickup(this, { ...saved, ...point });
      this.rewardPickups.push(pickup);
    }
    if (snapshot) {
      this.run.elapsedSeconds = snapshot.elapsedSeconds;
      for (const saved of snapshot.enemies) {
        const sourceDefinition = this.enemyDefinition(saved.typeId);
        const definition = { ...sourceDefinition, maxHp: scaledEnemyHp(sourceDefinition.maxHp, snapshot.elapsedSeconds, sourceDefinition.wagonPriority) };
        const milestone = snapshot.activeBoss?.typeId === saved.typeId ? snapshot.activeBoss.id : undefined;
        const position = mapSnapshotWorldPoint(saved, snapshot, { width: WORLD_WIDTH, height: WORLD_HEIGHT, roadCenterY: ROAD_CENTER_Y });
        const enemy = new Enemy(this, position.x, position.y, definition, milestone);
        enemy.hp = Math.min(enemy.maxHp, saved.hp); enemy.attackCooldownMs = saved.attackCooldownMs;
        this.enemies.push(enemy);
      }
      if (snapshot.activeBoss) {
        const boss = bossCatalog[snapshot.activeBoss.typeId as BossId];
        this.activeBossMilestoneId = snapshot.activeBoss.id;
        this.activeBossId = boss?.id ?? null;
        this.activeBossIsFinal = snapshot.activeBoss.id === 'princess-demon';
        this.finalBossForRun = this.activeBossIsFinal ? boss?.id : undefined;
        this.campaignClock.pause(`boss:${snapshot.activeBoss.id}`);
        if (boss) { this.bossDirector.startBoss(boss.id, this.run); this.bossDirector.syncBoss(snapshot.activeBoss.hp, 0); }
      }
      this.pendingFinalVictory = snapshot.elapsedSeconds >= 1200 && snapshot.defeatedBossIds.some((id) => id === 'princess-demon' || id === 'king-guard');
      if (this.pendingFinalVictory) this.finalBossForRun = snapshot.defeatedBossIds.find((id) => id === 'princess-demon' || id === 'king-guard');
      if (snapshot.pendingEventId) this.campaignClock.pause(`event:${snapshot.pendingEventId}`);
      const playerPosition = mapSnapshotWorldPoint(snapshot.player, snapshot, { width: WORLD_WIDTH, height: WORLD_HEIGHT, roadCenterY: ROAD_CENTER_Y });
      this.warrior.setPosition(playerPosition.x, playerPosition.y);
      if (this.run.player.isDead) { this.warrior.setVisible(false); (this.warrior.body as Phaser.Physics.Arcade.Body).enable = false; }
    }
    const hudItems = [{ frame: 0, x: 28 }, { frame: 1, x: 158 }, { frame: 2, x: 300 }, { frame: 3, x: 416 }, { frame: 4, x: 548 }, { frame: 5, x: 682 }, { frame: 6, x: 806 }];
    this.hudValueTexts = hudItems.map(({ frame, x }) => {
      this.add.image(x, 35, 'ui-icons', frame).setDisplaySize(24, 24).setScrollFactor(0).setDepth(100);
      return this.add.text(x + 18, 25, '', { fontFamily: 'DungGeunMo, monospace', fontSize: '15px', color: '#fff2d6', stroke: '#21160e', strokeThickness: 3 })
        .setScrollFactor(0).setDepth(100);
    });
    this.add.graphics().setScrollFactor(0).setDepth(99)
      .fillStyle(0x241b13, 0.72).fillRoundedRect(14, 12, WORLD_WIDTH - 28, 48, 7)
      .lineStyle(2, 0xd3a452, 0.9).strokeRoundedRect(14, 12, WORLD_WIDTH - 28, 48, 7);
    this.warriorBar = this.add.graphics().setScrollFactor(0).setDepth(100);
    this.caravanBar = this.add.graphics().setScrollFactor(0).setDepth(100);
    this.damageFlash = this.add.graphics().setScrollFactor(0).setDepth(200).setAlpha(0);
    this.drawDamageFlash();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT') as typeof this.keys;
    const clearInput = (): void => this.warrior?.setInput({ x: 0, y: 0 });
    window.addEventListener('blur', clearInput);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => window.removeEventListener('blur', clearInput));
    const unsubscribeChoice = gameEventBus.on('upgrade-choice', ({ upgradeId }) => this.chooseUpgrade(upgradeId));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsubscribeChoice);
    const unsubscribeEvent = gameEventBus.on('event-choice', ({ eventId, choiceId }) => this.chooseEvent(eventId, choiceId));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsubscribeEvent);
    const unsubscribeBoss = gameEventBus.on('boss-defeated', ({ milestoneId }) => this.completeBoss(milestoneId));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsubscribeBoss);
    const unsubscribeSnapshot = gameEventBus.on('snapshot-request', ({ reason }) => this.createRunSnapshot(reason));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsubscribeSnapshot);
    const unsubscribePause = gameEventBus.on('pause-request', () => { this.uiPaused = true; this.scene.pause(); });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsubscribePause);
    const unsubscribeSaved = gameEventBus.on('snapshot-saved', ({ resume }) => { if (resume) this.scene.resume(); });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsubscribeSaved);
    const unsubscribeFailed = gameEventBus.on('snapshot-failed', () => { this.run.pausedBy = 'network'; this.uiPaused = true; this.scene.pause(); });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsubscribeFailed);
    const unsubscribeResume = gameEventBus.on('resume-run', () => {
      if (this.run.pausedBy === 'network') this.run.pausedBy = this.run.pendingChoices.length > 0 ? 'level-up' : this.activeBossId ? 'boss' : this.eventSystem.pendingEventId ? 'event' : 'none';
      this.uiPaused = this.run.pausedBy === 'event' || this.run.pausedBy === 'level-up';
      if (!this.uiPaused) this.scene.resume();
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsubscribeResume);
    this.refreshHud();
    if (this.run.pendingChoices.length) {
      this.uiPaused = true; this.scene.pause();
      gameEventBus.emit('level-up', { level: this.run.level, choices: this.run.pendingChoices });
    }
    if (snapshot?.pendingEventId) {
      const event = this.eventSystem.restore(snapshot.pendingEventId, this.run);
      if (event) { this.uiPaused = true; this.scene.pause(); gameEventBus.emit('story-event', event); }
    }
  }
  update(_time: number, delta: number): void {
    if (!this.warrior?.active || this.levelUpAnnouncing) return;
    if (this.run.status !== 'active') {
      if (this.run.status === 'lost' && !this.gameOverShown) this.showGameOver();
      return;
    }
    const milestones = this.campaignClock.update(delta);
    this.run.elapsedSeconds = this.campaignClock.elapsedSeconds;
    for (const milestone of campaignSchedule.filter((candidate) => candidate.kind === 'miniboss')) {
      const warningAt = milestone.atSeconds - 5;
      if (!this.warningMilestones.has(milestone.id) && this.run.elapsedSeconds >= warningAt && this.run.elapsedSeconds < milestone.atSeconds) {
        this.warningMilestones.add(milestone.id);
        gameEventBus.emit('mini-boss-warning', { milestoneId: milestone.id, remainingSeconds: 5 });
      }
    }
    if (milestones.length > 0) {
      const milestone = milestones[0]!;
      if (milestone.kind === 'event') {
        if (!this.approachingEvent) {
          const sprite = this.add.image(WORLD_WIDTH + 80, ROAD_CENTER_Y, 'encounter-atlas', encounterFrame(milestone.id)).setDisplaySize(72, 72).setDepth(9);
          this.approachingEvent = { eventId: milestone.id, x: WORLD_WIDTH + 80, sprite };
        }
      } else {
        this.warningMilestones.add(milestone.id);
        this.startBoss(milestone);
      }
    }
    if (this.approachingEvent) {
      this.approachingEvent.x -= 90 * delta / 1000;
      this.approachingEvent.sprite.setX(this.approachingEvent.x);
      if (this.approachingEvent.x <= WORLD_WIDTH / 2 + 148) this.triggerApproachingEvent();
    }
    const biome = getBiomeAt(this.run.elapsedSeconds, this.run.defeatedBossIds);
    this.background.setTransition(biome.from, biome.to, biome.progress);
    const revived = this.respawn.update(this.run.player, delta);
    if (revived) {
      this.warrior.setPosition(WORLD_WIDTH / 2 - 145, ROAD_CENTER_Y).setVisible(true).setAlpha(0.55);
      (this.warrior.body as Phaser.Physics.Arcade.Body).enable = true;
    }
    if (!this.run.player.isDead) {
      const healthRegeneration = this.run.upgradeStats['health-regeneration'] ?? 0;
      this.run.player.hp = Math.min(this.run.player.maxHp, this.run.player.hp + healthRegeneration * delta / 1000);
      this.warrior.setAlpha(this.run.player.invulnerableMs > 0 && Math.floor(this.run.player.invulnerableMs / 120) % 2 === 0 ? 0.45 : 1);
    }
    this.warrior.setInput(movementFromKeys({
      up: this.keys.W.isDown || this.keys.UP.isDown,
      down: this.keys.S.isDown || this.keys.DOWN.isDown,
      left: this.keys.A.isDown || this.keys.LEFT.isDown,
      right: this.keys.D.isDown || this.keys.RIGHT.isDown,
    }));
    this.warrior.updateWalkMotion(_time);
    this.background.update(delta);
    for (let index = this.rewardPickups.length - 1; index >= 0; index -= 1) {
      const pickup = this.rewardPickups[index]!;
      if (!pickup.advance(delta)) { pickup.destroy(); this.rewardPickups.splice(index, 1); continue; }
      if (!this.run.player.isDead && Phaser.Math.Distance.Between(pickup.x, pickup.y, this.warrior.x, this.warrior.y) <= 30) {
        this.collectReward(pickup.pickup);
        pickup.destroy();
        this.rewardPickups.splice(index, 1);
      }
    }
    const body = this.warrior.body as Phaser.Physics.Arcade.Body;
    if (!this.run.player.isDead) {
      body.position.x = Phaser.Math.Clamp(body.position.x, 0, WORLD_WIDTH - body.width);
      body.position.y = Phaser.Math.Clamp(body.position.y, 0, WORLD_HEIGHT - body.height);
    }
    const warriorPosition = this.run.player.isDead ? { x: WORLD_WIDTH / 2 - 145, y: ROAD_CENTER_Y } : { x: this.warrior.x, y: this.warrior.y };
    const caravanPosition = { x: WORLD_WIDTH / 2, y: ROAD_CENTER_Y };
    this.spawnCooldownMs -= delta;
    if (this.run.pausedBy !== 'boss' && this.spawnCooldownMs <= 0 && this.enemies.length < 36) {
      this.spawnEnemy();
      this.spawnCooldownMs = Math.max(1200, 3000 - this.run.elapsedSeconds * 12);
    }
    for (const attack of this.enemyDirector.update(this.enemies, warriorPosition, caravanPosition, delta, !this.run.player.isDead)) {
      if (attack.target === 'caravan') {
        if (this.health.damageCaravan(this.run.caravan, attack.damage, this.run)) this.showDamageFlash();
      }
      else {
        const wasDamaged = this.health.damagePlayer(this.run.player, attack.damage, this.run.upgradeStats['damage-reduction'] ?? 0);
        if (wasDamaged) this.showDamageFlash();
        const reflect = this.run.upgradeStats['warrior-reflect'] ?? 0;
        if (wasDamaged && reflect > 0) {
          const reflected = resolveHit(attack.enemy, reflect, 'warrior-reflect');
          if (reflected?.killed) this.onEnemyDefeated(attack.enemy);
        }
      }
      if (this.run.player.isDead) {
        this.warrior.setVisible(false);
        (this.warrior.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
        (this.warrior.body as Phaser.Physics.Arcade.Body).enable = false;
      }
    }
    if (!this.run.player.isDead) {
      for (const enemy of this.weaponSystem.update(this.run, warriorPosition, this.enemies, delta, this.random, (projectile) => {
        const color = projectile.weaponId === 'sword' ? 0xdde8f2 : projectile.weaponId === 'bow' ? 0xd6b475
          : projectile.weaponId === 'ice-spear' ? 0x91ddf2 : projectile.weaponId === 'thunder' ? 0xffe477
            : projectile.weaponId === 'gold-shotgun' ? 0xffd54f : 0xff793e;
        if (projectile.weaponId === 'sword') {
          this.showSwordSlash(projectile.targetPositions[0] ?? { x: this.warrior.x + 1, y: this.warrior.y }, color);
          return;
        }
        const radius = projectile.weaponId === 'fireball' ? 8 + (this.run.upgradeStats['fireball-size'] ?? 0) / 3 : 4;
        for (const position of projectile.targetPositions) {
          const bolt = this.add.circle(this.warrior.x, this.warrior.y, radius, color).setDepth(12);
          this.tweens.add({ targets: bolt, x: position.x, y: position.y, duration: 180, onComplete: () => bolt.destroy() });
        }
      }, { x: this.input.activePointer.worldX, y: this.input.activePointer.worldY })) {
        this.onEnemyDefeated(enemy);
      }
    }
    const activeBoss = this.enemies.find((enemy) => enemy.bossMilestoneId === this.activeBossMilestoneId);
    if (activeBoss) this.bossDirector.syncBoss(activeBoss.hp, activeBoss.attackCooldownMs);
    for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
      if (this.enemies[i]?.dead) this.removeEnemyAt(i);
    }
    this.refreshHud();
    if (this.run.caravan.hp <= 0 && !this.gameOverShown) this.showGameOver();
  }
  getWorldSeedSample(): number { return this.random(); }
  getTravelDistance(): number { return this.background?.getDistance() ?? 0; }

  private showSwordSlash(target: Vector2, color: number): void {
    const orientation = Math.atan2(target.y - this.warrior.y, target.x - this.warrior.x);
    const slash = this.add.graphics({ x: this.warrior.x, y: this.warrior.y })
      .setDepth(12)
      .setRotation(orientation - 0.35);
    const segments = 24;
    const centerRadius = 70;
    const halfThickness = 20;
    const outer: Vector2[] = [];
    const inner: Vector2[] = [];

    for (let index = 0; index <= segments; index += 1) {
      const progress = index / segments;
      const angle = -Math.PI / 2 + Math.PI * progress;
      const thickness = halfThickness * Math.sin(Math.PI * progress);
      const outerRadius = centerRadius + thickness;
      const innerRadius = centerRadius - thickness;
      outer.push({ x: Math.cos(angle) * outerRadius, y: Math.sin(angle) * outerRadius });
      inner.push({ x: Math.cos(angle) * innerRadius, y: Math.sin(angle) * innerRadius });
    }

    // Taper both ends into a crescent that wraps around the warrior's side.
    slash.fillStyle(color, 0.42);
    slash.beginPath();
    outer.forEach((point, index) => index === 0 ? slash.moveTo(point.x, point.y) : slash.lineTo(point.x, point.y));
    for (let index = inner.length - 1; index >= 0; index -= 1) {
      const point = inner[index]!;
      slash.lineTo(point.x, point.y);
    }
    slash.closePath();
    slash.fillPath();

    slash.lineStyle(4, color, 0.95);
    slash.beginPath();
    outer.forEach((point, index) => index === 0 ? slash.moveTo(point.x, point.y) : slash.lineTo(point.x, point.y));
    slash.strokePath();
    slash.lineStyle(2, 0xfff4d8, 0.88);
    slash.beginPath();
    inner.forEach((point, index) => index === 0 ? slash.moveTo(point.x, point.y) : slash.lineTo(point.x, point.y));
    slash.strokePath();

    this.tweens.add({
      targets: slash,
      rotation: orientation + 0.35,
      scaleX: 1.04,
      scaleY: 1.04,
      alpha: 0,
      duration: 145,
      onComplete: () => slash.destroy(),
    });
  }

  private drawDamageFlash(): void {
    const width = WORLD_WIDTH;
    const height = WORLD_HEIGHT;
    this.damageFlash.clear();
    this.damageFlash.fillStyle(0xc51f2a, 0.08);
    this.damageFlash.fillRect(0, 0, width, 68).fillRect(0, height - 68, width, 68)
      .fillRect(0, 0, 68, height).fillRect(width - 68, 0, 68, height);
    this.damageFlash.fillStyle(0xe52d37, 0.14);
    this.damageFlash.fillRect(0, 0, width, 30).fillRect(0, height - 30, width, 30)
      .fillRect(0, 0, 30, height).fillRect(width - 30, 0, 30, height);
  }

  private showDamageFlash(): void {
    this.tweens.killTweensOf(this.damageFlash);
    this.damageFlash.setAlpha(1);
    this.tweens.add({ targets: this.damageFlash, alpha: 0, duration: 360, ease: 'Quad.easeOut' });
  }

  private triggerApproachingEvent(): void {
    const encounter = this.approachingEvent;
    if (!encounter) return;
    encounter.sprite.destroy();
    this.approachingEvent = null;
    const event = this.eventSystem.present(encounter.eventId, this.run);
    if (!event) return;
    this.campaignClock.pause(`event:${encounter.eventId}`);
    this.uiPaused = true;
    this.scene.pause();
    gameEventBus.emit('story-event', event);
  }

  private spawnEnemy(): void {
    const angle = this.random() * Math.PI * 2;
    const radiusX = WORLD_WIDTH * 0.55;
    const radiusY = WORLD_HEIGHT * 0.55;
    const x = Phaser.Math.Clamp(WORLD_WIDTH / 2 + Math.cos(angle) * radiusX, 12, WORLD_WIDTH - 12);
    const y = Phaser.Math.Clamp(WORLD_HEIGHT / 2 + Math.sin(angle) * radiusY, 12, WORLD_HEIGHT - 12);
    const roll = this.random();
    const definition = enemyForSpawnRoll(roll, enemyCatalog);
    const scaled = definition.rewardMonster ? definition : { ...definition, maxHp: scaledEnemyHp(definition.maxHp, this.run.elapsedSeconds, definition.wagonPriority) };
    this.enemies.push(new Enemy(this, x, y, scaled));
  }

  private onEnemyDefeated(enemy: Enemy): void {
    this.run.kills += 1;
    const gold = this.scaleRunAward(enemy.definition.gold, 'gold-gain');
    const experience = Math.max(1, this.scaleRunAward(enemy.definition.experience, 'xp-gain'));
    this.run.runGold += gold;
    this.events.emit('enemy-defeated', {
      enemyId: enemy.definition.id,
      experience,
      gold,
      position: enemy.worldPosition,
    });
    const result = this.levelSystem.addXp(this.run, experience);
    if (enemy.definition.rewardMonster) this.dropRewardPickup(enemy.worldPosition);
    if (result.levelUps > 0 && this.run.pendingChoices.length > 0) {
      this.announceLevelUp(this.run.level, this.run.pendingChoices);
    }
    if (enemy.bossMilestoneId) gameEventBus.emit('boss-defeated', { milestoneId: enemy.bossMilestoneId });
  }

  private startBoss(milestone: CampaignMilestone): void {
    const isFinal = milestone.kind === 'final-boss';
    const bossId = isFinal ? chooseFinalBoss(getKarmaTier(this.run.karma)) : milestone.id as BossId;
    const bossDefinition = this.bossDirector.startBoss(bossId, this.run);
    if (!bossDefinition) {
      if (import.meta.env.DEV) console.error(`Unable to start campaign boss: ${bossId}`);
      return;
    }
    this.activeBossMilestoneId = milestone.id;
    this.activeBossId = bossId;
    this.activeBossIsFinal = isFinal;
    if (isFinal) this.finalBossForRun = bossId;
    this.campaignClock.pause(`boss:${milestone.id}`);
    if (isFinal) {
      for (let i = this.enemies.length - 1; i >= 0; i -= 1) this.removeEnemyAt(i);
    }
    const base = enemyCatalog[0]!;
    const definition = {
      ...base,
      id: bossId,
      maxHp: bossDefinition.maxHp,
      speed: isFinal ? 48 : 42,
      damage: bossDefinition.damage,
      attackRange: bossDefinition.attacks[0]?.range ?? 46,
      targetPolicy: 'nearest' as const,
      wagonPriority: false,
      experience: isFinal ? 0 : 16,
      gold: isFinal ? 60 : 20,
      color: bossDefinition.color,
    };
    const edgeX = this.random() < 0.5 ? 18 : WORLD_WIDTH - 18;
    const bossY = WORLD_HEIGHT * (0.3 + this.random() * 0.4);
    this.enemies.push(new Enemy(this, edgeX, bossY, definition, milestone.id));
    if (bossId === 'king-guard') {
      for (const [offsetX, offsetY] of [[-56, -44], [56, -44], [-56, 44], [56, 44]] as const) {
        this.enemies.push(new Enemy(this, Phaser.Math.Clamp(edgeX + offsetX, 20, WORLD_WIDTH - 20), Phaser.Math.Clamp(bossY + offsetY, 20, WORLD_HEIGHT - 20), {
          ...base, id: 'king-soldier', maxHp: 18, speed: 54, damage: 8, attackRange: 40,
          targetPolicy: 'nearest', wagonPriority: false, experience: 0, gold: 0, color: 0xc5b783,
        }));
      }
    }
    gameEventBus.emit('boss-encounter', { ...milestone, bossId });
  }

  private chooseUpgrade(upgradeId: string): void {
    const choice = this.run.pendingChoices.find((candidate) => candidate.id === upgradeId);
    const upgrade = upgradeCatalog.find((candidate) => candidate.id === upgradeId);
    if (!choice || !upgrade || !this.levelSystem.applyChoice(this.run, upgradeId)) {
      if (import.meta.env.DEV) console.error(`Ignored invalid level-up choice: ${upgradeId}`);
      return;
    }
    this.applyUpgrade(upgrade.stat, choice.value);
    const nextChoices = this.levelSystem.presentNextChoice(this.run);
    if (nextChoices.length > 0) {
      gameEventBus.emit('level-up', { level: this.run.level, choices: nextChoices });
      return;
    }
    gameEventBus.emit('level-up-complete', null);
    if (this.pendingFinalVictory) {
      this.showVictory();
      return;
    }
    this.scene.resume();
    this.uiPaused = false;
    gameEventBus.emit('snapshot-request', { reason: 'checkpoint' });
  }

  private announceLevelUp(level: number, choices: typeof this.run.pendingChoices): void {
    if (this.levelUpAnnouncing || choices.length === 0) return;
    this.levelUpAnnouncing = true;
    this.warrior.setInput({ x: 0, y: 0 });
    const label = this.add.text(this.warrior.x, this.warrior.y - 48, '레벨업!', {
      fontFamily: 'DungGeunMo, monospace', fontSize: '19px', color: '#ffe27a',
      stroke: '#4a210e', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(140);
    const burst = this.add.circle(this.warrior.x, this.warrior.y - 26, 8, 0xffd75e, 0.72)
      .setStrokeStyle(3, 0xfff1b1, 0.9).setDepth(139).setScale(0.35);
    this.tweens.add({ targets: burst, scale: 2.8, alpha: 0, duration: 680, ease: 'Cubic.easeOut', onComplete: () => burst.destroy() });
    this.tweens.add({
      targets: label, y: label.y - 28, scale: 1.14, alpha: 0, duration: 680, ease: 'Cubic.easeOut',
      onComplete: () => {
        label.destroy();
        this.levelUpAnnouncing = false;
        this.uiPaused = true;
        this.scene.pause();
        gameEventBus.emit('level-up', { level, choices });
      },
    });
  }

  private chooseEvent(eventId: string, choiceId: 'yes' | 'no'): void {
    const outcome = this.eventSystem.choose(eventId, choiceId, this.run);
    if (!outcome || !this.campaignClock.resume(`event:${eventId}`)) return;
    gameEventBus.emit('event-complete', { eventId });
    this.warrior.setKarmaTier(getKarmaTier(this.run.karma));
    if (this.run.caravan.hp <= 0) {
      this.run.status = 'lost';
      this.scene.resume();
      return;
    }
    this.scene.resume();
    this.uiPaused = false;
    gameEventBus.emit('snapshot-request', { reason: 'checkpoint' });
  }

  private completeBoss(milestoneId: string): void {
    if (this.activeBossMilestoneId !== milestoneId || !this.activeBossId || !this.bossDirector.defeatBoss(this.activeBossId, this.run)
      || !this.campaignClock.resume(`boss:${milestoneId}`)) return;
    this.activeBossMilestoneId = null;
    this.activeBossId = null;
    if (this.activeBossIsFinal) this.pendingFinalVictory = true;
    this.activeBossIsFinal = false;
    const choices = this.levelSystem.presentNextChoice(this.run);
    if (choices.length > 0) {
      this.announceLevelUp(this.run.level, choices);
      return;
    }
    if (!this.pendingFinalVictory) gameEventBus.emit('snapshot-request', { reason: 'checkpoint' });
    if (this.pendingFinalVictory) this.showVictory();
  }

  private applyUpgrade(stat: string, value: number): void {
    if (stat.startsWith('add-weapon:')) this.weaponSystem.addWeapon(this.run, stat.slice('add-weapon:'.length));
    if (stat === 'movement-speed') this.warrior.moveSpeed += value;
    if (stat === 'warrior-max-health') {
      this.run.player.maxHp += value;
      this.run.player.hp += value;
    }
    if (stat === 'caravan-max-health') {
      this.run.caravan.maxHp += value;
      this.run.caravan.hp += value;
    }
  }

  private removeEnemyAt(index: number): void {
    const enemy = this.enemies[index];
    if (!enemy) return;
    this.enemies.splice(index, 1);
    enemy.playDeathEffect();
  }

  private dropRewardPickup(position: Vector2): void {
    const type = chooseRewardType(this.random());
    const ordinaryXp = enemyCatalog.find((enemy) => enemy.id === 'keep-ghoul')?.experience ?? 3;
    const amount = type === 'gold' ? 10
      : type === 'experience' ? ordinaryXp * 5
        : type === 'player-health' ? Math.ceil(this.run.player.maxHp * 0.1) : 40;
    const state: RewardPickupState = {
      id: `drop-${this.run.kills}-${Math.floor(this.random() * 0x7fffffff).toString(36)}`,
      type, x: position.x, y: position.y, amount, remainingMs: 30_000,
    };
    this.rewardPickups.push(new RewardPickup(this, state));
  }

  private collectReward(reward: RewardPickupState): void {
    if (reward.type === 'gold') this.run.runGold += this.scaleRunAward(reward.amount, 'gold-gain');
    if (reward.type === 'experience') {
      const experience = Math.max(1, this.scaleRunAward(reward.amount, 'xp-gain'));
      const levelResult = this.levelSystem.addXp(this.run, experience);
      if (levelResult.levelUps > 0 && this.run.pendingChoices.length > 0) this.announceLevelUp(this.run.level, this.run.pendingChoices);
    }
    if (reward.type === 'player-health') this.run.player.hp = Math.min(this.run.player.maxHp, this.run.player.hp + reward.amount);
    if (reward.type === 'caravan-repair') this.run.caravan.hp = Math.min(this.run.caravan.maxHp, this.run.caravan.hp + reward.amount);
  }

  private scaleRunAward(amount: number, bonusStat: 'xp-gain' | 'gold-gain'): number {
    const bonus = Math.max(0, this.run.upgradeStats[bonusStat] ?? 0);
    return Math.max(0, Math.round(amount * (1 + bonus)));
  }

  private emptyProfile(): PlayerProfile {
    return { id: 'profile', userId: 'local', tenantId: 'local', objectId: 'local', version: 0, displayName: 'Adventurer',
      goldBalance: 0, lifetimeGoldEarned: 0, unlockedCharacters: ['warrior'], permanentUpgradeLevels: {}, passiveIds: [], characterTrainingLevels: {}, updatedAt: new Date(0).toISOString() };
  }

  private refreshHud(): void {
    const values = [
      `${Math.ceil(this.run.player.hp)}/${this.run.player.maxHp}`,
      `${Math.ceil(this.run.caravan.hp)}/${this.run.caravan.maxHp}`,
      `LV ${this.run.level}`,
      `${this.run.xp}/${this.run.xpToNext}`,
      `${Math.floor(this.run.elapsedSeconds / 60)}:${String(Math.floor(this.run.elapsedSeconds) % 60).padStart(2, '0')}`,
      `${this.run.kills}`,
      `${this.run.runGold} G`,
    ];
    this.hudValueTexts.forEach((text, index) => text.setText(values[index] ?? ''));
    this.warriorBar?.clear().fillStyle(0x20201d, 0.9).fillRoundedRect(24, 96, 184, 13, 5)
      .fillStyle(0x83bd78).fillRoundedRect(26, 98, 180 * this.run.player.hp / this.run.player.maxHp, 9, 4);
    this.caravanBar?.clear().fillStyle(0x20201d, 0.9).fillRoundedRect(WORLD_WIDTH - 218, 96, 194, 13, 5)
      .fillStyle(0xe0a45d).fillRoundedRect(WORLD_WIDTH - 216, 98, 190 * this.run.caravan.hp / this.run.caravan.maxHp, 9, 4);
  }

  private showGameOver(): void {
    if (this.runEndEmitted) return;
    this.gameOverShown = true;
    this.warrior.setInput({ x: 0, y: 0 });
    this.run.status = 'lost';
    this.emitRunEnding();
  }

  private showVictory(): void {
    if (this.runEndEmitted) return;
    this.pendingFinalVictory = false;
    this.run.status = 'won';
    this.emitRunEnding();
  }

  private emitRunEnding(): void {
    if (this.runEndEmitted || (this.run.status !== 'won' && this.run.status !== 'lost')) return;
    const ending = resolveEnding(this.run.status, this.run.karma, this.finalBossForRun);
    const summary: RunEndingSummary = {
      runId: this.run.runId, status: this.run.status, endingId: ending.id,
      karma: this.run.karma, karmaTier: getKarmaTier(this.run.karma), elapsedSeconds: this.run.elapsedSeconds,
      kills: this.run.kills, runGold: this.run.runGold, characterId: this.run.characterId,
      defeatedBossIds: [...this.run.defeatedBossIds],
    };
    this.runEndEmitted = true;
    gameEventBus.emit('run-ended', summary);
  }

  private createRunSnapshot(reason: 'autosave' | 'checkpoint' | 'manual'): void {
    if (this.run.status !== 'active') return;
    const shouldPauseScene = reason === 'manual';
    const resumeAfterSave = shouldPauseScene && !this.uiPaused;
    if (shouldPauseScene) this.scene.pause();
    const activeBoss = this.enemies.find((enemy) => enemy.bossMilestoneId === this.activeBossMilestoneId);
    const snapshot = createSnapshot({
      run: this.run, player: { x: this.warrior.x, y: this.warrior.y }, rngSeed: this.random.getState(),
      worldWidth: WORLD_WIDTH, roadCenterY: ROAD_CENTER_Y,
      ordinarySpawnCooldownMs: this.spawnCooldownMs,
      enemies: this.enemies.map((enemy) => ({ id: enemy.id, typeId: enemy.definition.id, x: enemy.x, y: enemy.y, hp: enemy.hp, attackCooldownMs: enemy.attackCooldownMs, bossMilestoneId: enemy.bossMilestoneId, dead: enemy.dead })),
      activeBossMaxHp: activeBoss?.maxHp, pendingEventId: this.eventSystem.pendingEventId,
      approachingEvent: this.approachingEvent ? { eventId: this.approachingEvent.eventId, x: this.approachingEvent.x } : null,
      rewardPickups: this.rewardPickups.map(({ pickup }) => ({ ...pickup })),
    });
    gameEventBus.emit('snapshot-ready', { runId: this.run.runId, characterId: this.run.characterId, snapshot, reason, resumeAfterSave });
  }

  private enemyDefinition(typeId: string): EnemyDefinition {
    const ordinary = enemyCatalog.find((definition) => definition.id === typeId);
    if (ordinary) return ordinary;
    const boss = bossCatalog[typeId as BossId];
    if (boss) return { id: boss.id, maxHp: boss.maxHp, speed: 48, damage: boss.damage, attackRange: boss.attacks[0]?.range ?? 46, targetPolicy: 'nearest', wagonPriority: false, experience: 0, gold: 0, color: boss.color };
    if (typeId === 'king-soldier') return { id: typeId, maxHp: 18, speed: 54, damage: 8, attackRange: 40, targetPolicy: 'nearest', wagonPriority: false, experience: 0, gold: 0, color: 0xc5b783 };
    throw new Error(`Cannot restore unknown saved enemy type: ${typeId}`);
  }
}

function encounterFrame(eventId: string): number {
  return ({ 'wounded-messenger': 0, 'abandoned-supply-cart': 1, 'captured-scout': 2, 'village-refugees': 3 } as Record<string, number>)[eventId] ?? 0;
}
