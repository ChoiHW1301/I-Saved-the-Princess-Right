import { describe, expect, it } from 'vitest';
import { bossDisplayName } from '../content/bosses.js';
import { getLavaGiantFacing } from '../systems/BossGimmickSystem.js';
import { LAVA_SIGIL_EXPLOSION_RADIUS } from '../systems/LavaSigilSystem.js';

describe('lava boss presentation helpers', () => {
  it('maps giant movement to four sprite directions and mirrors only the side sprite', () => {
    expect(getLavaGiantFacing(1, 0)).toEqual({ texture: 'lava-giant-side', flipX: false });
    expect(getLavaGiantFacing(-1, 0)).toEqual({ texture: 'lava-giant-side', flipX: true });
    expect(getLavaGiantFacing(0, -1)).toEqual({ texture: 'lava-giant-up', flipX: false });
    expect(getLavaGiantFacing(0, 1)).toEqual({ texture: 'lava-giant-down', flipX: false });
  });

  it('shows localized boss names and keeps the sigil visual radius aligned with combat', () => {
    expect(bossDisplayName['lava-giant']).toBe('용암 거인');
    expect(bossDisplayName['lava-magician']).toBe('라바 매지션');
    expect(LAVA_SIGIL_EXPLOSION_RADIUS).toBe(100);
  });
});
