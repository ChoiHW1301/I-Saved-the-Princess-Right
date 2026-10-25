import type { EndingId, KarmaTier } from '@caravan/contracts';

export interface EndingDefinition { id: EndingId; title: string; body: string; karmaTier: KarmaTier }
export const endingCatalog: Readonly<Record<EndingId, EndingDefinition>> = {
  'princess-purified': { id: 'princess-purified', title: '공주의 귀환', body: '전사의 선한 힘이 공주에게 깃든 악마를 몰아내고, 공주는 무사히 눈을 떴습니다.', karmaTier: 'good' },
  'princess-died': { id: 'princess-died', title: '멈춘 저주', body: '악마는 쓰러졌지만 공주도 끝내 살아남지 못했습니다. 마차의 여정은 여기서 끝납니다.', karmaTier: 'neutral' },
  'warrior-new-demon-king': { id: 'warrior-new-demon-king', title: '새로운 마왕', body: '왕과 병사들이 쓰러집니다. 전사는 악의 힘을 받아들여 새로운 마왕이 됩니다.', karmaTier: 'evil' },
  'caravan-lost': { id: 'caravan-lost', title: '끊어진 호위', body: '마차가 더는 나아가지 못합니다. 공주의 운명은 어둠 속에 남겨졌습니다.', karmaTier: 'neutral' },
};
