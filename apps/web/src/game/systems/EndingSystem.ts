import type { BossId, EndingId, RunStatus } from '@caravan/contracts';
import { endingCatalog, type EndingDefinition } from '../content/endings.js';
import { chooseFinalBoss } from '../content/bosses.js';
import { getKarmaTier } from './KarmaSystem.js';

export function resolveEnding(status: RunStatus, finalKarma: number, finalBossId?: BossId): EndingDefinition {
  if (status === 'active') throw new Error('An active run has no ending.');
  const tier = getKarmaTier(finalKarma);
  let id: EndingId;
  if (status === 'lost') id = 'caravan-lost';
  else {
    const expectedBoss = chooseFinalBoss(tier);
    if (finalBossId !== expectedBoss) throw new Error(`Final boss ${String(finalBossId)} does not match ${tier} karma route.`);
    id = tier === 'evil' ? 'warrior-new-demon-king' : tier === 'good' ? 'princess-purified' : 'princess-died';
  }
  return endingCatalog[id];
}
