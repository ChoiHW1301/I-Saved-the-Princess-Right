import type { RunSnapshotV1 } from '@caravan/contracts';

/** Converts completed bosses from the old time-based schedule into stable campaign slot IDs. */
export function migrateDefeatedMilestoneIds(snapshot: RunSnapshotV1): string[] {
  if (snapshot.defeatedBossMilestoneIds.length > 0) return [...snapshot.defeatedBossMilestoneIds];

  const migrated: string[] = [];
  if (snapshot.elapsedSeconds >= 300 && snapshot.defeatedBossIds.includes('castle-warlord')) {
    migrated.push('lava-5min-slot');
  }
  if (snapshot.elapsedSeconds >= 600 && snapshot.defeatedBossIds.includes('lava-behemoth')) {
    migrated.push('castle-warlord-10min');
  }
  if (snapshot.elapsedSeconds >= 900 && snapshot.defeatedBossIds.includes('forest-warden')) {
    migrated.push('forest-warden');
  }
  return migrated;
}

/** Maps active bosses in old saves to their replacement slot while preserving current slot IDs. */
export function getRestoredMilestoneId(snapshot: RunSnapshotV1): string | null {
  const activeId = snapshot.activeBoss?.id;
  if (!activeId) return null;
  if (activeId === 'castle-warlord' && snapshot.elapsedSeconds >= 300 && snapshot.elapsedSeconds < 600) return 'lava-5min-slot';
  if (activeId === 'lava-behemoth' && snapshot.elapsedSeconds >= 600 && snapshot.elapsedSeconds < 900) return 'castle-warlord-10min';
  return activeId;
}
