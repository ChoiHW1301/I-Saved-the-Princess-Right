import type { CharacterId, KarmaTier } from '@caravan/contracts';
import type { JSX } from 'react';
import type { LeaderboardResponse } from './leaderboardApi.js';
import { BoardTable, type BoardStatusProps } from './boardPresentation.js';

export interface ClearBoardProps extends BoardStatusProps {
  data: LeaderboardResponse;
  characterId: CharacterId;
  karmaTier: KarmaTier;
  onCharacterChange(id: CharacterId): void;
  onKarmaChange(tier: KarmaTier): void;
}

export function ClearBoard({ data, characterId, karmaTier, onCharacterChange, onKarmaChange, ...status }: ClearBoardProps): JSX.Element {
  return <>
    <div className="leaderboard-filters">
      <label>캐릭터<select value={characterId} onChange={(event) => onCharacterChange(event.target.value as CharacterId)}>
        <option value="warrior">전사</option><option value="archer">궁수</option><option value="mage">마법사</option><option value="merchant">상인</option><option value="dark-warrior">흑화 전사</option>
      </select></label>
      <label>카르마<select value={karmaTier} onChange={(event) => onKarmaChange(event.target.value as KarmaTier)}>
        <option value="good">선</option><option value="neutral">중립</option><option value="evil">악</option>
      </select></label>
    </div>
    <BoardTable data={data} mode="clear" {...status} />
  </>;
}
