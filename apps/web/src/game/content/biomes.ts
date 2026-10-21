export type StageId = 'demon-castle' | 'lava-fields' | 'meadow-village';
export interface BiomeDefinition {
  id: StageId;
  title: string;
  fromSeconds: number;
  primaryColor: number;
  alternateColor: number;
  roadColor: number;
  accentColor: number;
}

export const biomeSchedule: readonly BiomeDefinition[] = [
  { id: 'demon-castle', title: 'Demon Keep', fromSeconds: 0, primaryColor: 0x25312d, alternateColor: 0x2b3832, roadColor: 0x615747, accentColor: 0x52665b },
  { id: 'lava-fields', title: 'Lava Fields', fromSeconds: 300, primaryColor: 0x3b2522, alternateColor: 0x462a24, roadColor: 0x6b3829, accentColor: 0xda7140 },
  { id: 'meadow-village', title: 'Meadow Village', fromSeconds: 600, primaryColor: 0x455b37, alternateColor: 0x50683d, roadColor: 0x827455, accentColor: 0xa6b36a },
];
