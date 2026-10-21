export interface EventChoice {
  id: 'yes' | 'no';
  label: 'Yes' | 'No';
  karmaDelta: number;
  wagonHpDelta: number;
  goldDelta: number;
}
export interface StoryEvent {
  id: string;
  atSeconds: number;
  title: string;
  body: string;
  yes: EventChoice;
  no: EventChoice;
}

export const eventCatalog: readonly StoryEvent[] = [
  {
    id: 'wounded-messenger', atSeconds: 180, title: '성채의 전령',
    body: '부상당한 전령이 마차를 세워 달라고 합니다. 추격대가 가까워지고 있습니다.',
    yes: { id: 'yes', label: 'Yes', karmaDelta: 12, wagonHpDelta: -12, goldDelta: -2 },
    no: { id: 'no', label: 'No', karmaDelta: -8, wagonHpDelta: 0, goldDelta: 2 },
  },
  {
    id: 'abandoned-supply-cart', atSeconds: 360, title: '버려진 보급 마차',
    body: '길가의 보급품은 군대가 남긴 것으로 보입니다. 조금만 챙기면 여정을 돕겠지만, 누군가의 몫일 수도 있습니다.',
    yes: { id: 'yes', label: 'Yes', karmaDelta: -5, wagonHpDelta: 8, goldDelta: 8 },
    no: { id: 'no', label: 'No', karmaDelta: 6, wagonHpDelta: 0, goldDelta: 0 },
  },
  {
    id: 'captured-scout', atSeconds: 540, title: '포로가 된 정찰병',
    body: '마왕군 정찰병이 항복했습니다. 그가 가진 정보는 다음 고갯길을 통과하는 데 도움이 될 수 있습니다.',
    yes: { id: 'yes', label: 'Yes', karmaDelta: 14, wagonHpDelta: -8, goldDelta: 0 },
    no: { id: 'no', label: 'No', karmaDelta: -11, wagonHpDelta: 0, goldDelta: 5 },
  },
  {
    id: 'village-refugees', atSeconds: 720, title: '마을의 피난민',
    body: '불타는 마을에서 피난민들이 마차에 태워 달라고 부탁합니다. 속도를 늦추면 추격대가 따라잡을 수 있습니다.',
    yes: { id: 'yes', label: 'Yes', karmaDelta: 16, wagonHpDelta: -18, goldDelta: -3 },
    no: { id: 'no', label: 'No', karmaDelta: -13, wagonHpDelta: 0, goldDelta: 6 },
  },
];
