import type { JSX } from 'react';
import type { LeaderboardResponse } from './leaderboardApi.js';
import { BoardTable, type BoardStatusProps } from './boardPresentation.js';

export function ScoreBoard({ data, ...status }: { data: LeaderboardResponse } & BoardStatusProps): JSX.Element {
  return <BoardTable data={data} mode="score" {...status} />;
}
