import type { BossId } from '@caravan/contracts';

export type StageId = 'demon-castle' | 'lava-fields' | 'enchanted-forest' | 'meadow-village';
export interface BiomeDefinition {
  id: StageId;
  title: string;
  fromSeconds: number;
  afterBossId?: BossId;
  primaryColor: number;
  alternateColor: number;
  roadColor: number;
  accentColor: number;
}

export const biomeSchedule: readonly BiomeDefinition[] = [
  { id: 'lava-fields', title: '용암지대', fromSeconds: 0, primaryColor: 0x282423, alternateColor: 0x332a26, roadColor: 0x584033, accentColor: 0x803b2d },
  { id: 'demon-castle', title: '어두운 폐허', fromSeconds: 300, afterBossId: 'castle-warlord', primaryColor: 0x25312d, alternateColor: 0x2b3832, roadColor: 0x615747, accentColor: 0x52665b },
  { id: 'enchanted-forest', title: '숲', fromSeconds: 600, afterBossId: 'lava-behemoth', primaryColor: 0x233b2d, alternateColor: 0x304a35, roadColor: 0x80623f, accentColor: 0x739653 },
  { id: 'meadow-village', title: '초원·마을', fromSeconds: 900, afterBossId: 'forest-warden', primaryColor: 0x455b37, alternateColor: 0x50683d, roadColor: 0x827455, accentColor: 0xa6b36a },
];
