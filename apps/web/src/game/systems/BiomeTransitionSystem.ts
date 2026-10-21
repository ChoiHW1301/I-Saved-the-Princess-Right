import { BIOME_TRANSITION_SECONDS } from '../content/campaignSchedule.js';
import { biomeSchedule, type StageId } from '../content/biomes.js';

export interface BiomeTransition { from: StageId; to: StageId; progress: number }

export function getBiomeAt(elapsedSeconds: number): BiomeTransition {
  const time = Number.isFinite(elapsedSeconds) ? Math.max(0, elapsedSeconds) : 0;
  let current = biomeSchedule[0]!;
  for (let index = 1; index < biomeSchedule.length; index += 1) {
    const next = biomeSchedule[index]!;
    const transitionStart = next.fromSeconds - BIOME_TRANSITION_SECONDS;
    if (time < transitionStart) break;
    if (time < next.fromSeconds) {
      return { from: current.id, to: next.id, progress: (time - transitionStart) / BIOME_TRANSITION_SECONDS };
    }
    current = next;
  }
  return { from: current.id, to: current.id, progress: 1 };
}
