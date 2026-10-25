import type { JSX } from 'react';
import type { LeaderboardResponse, PublicLeaderboardEntry } from './leaderboardApi.js';

export interface BoardStatusProps {
  loading?: boolean;
  error?: string | null;
  accessDenied?: boolean;
  sessionExpired?: boolean;
  onRetry?: () => void;
  onSignIn?: () => void;
}

const characterNames: Record<string, string> = { warrior: '전사', archer: '궁수', mage: '마법사', merchant: '상인', 'dark-warrior': '흑화 전사' };
const karmaNames: Record<string, string> = { good: '선', neutral: '중립', evil: '악' };

export function BoardTable({ data, mode, loading = false, error, accessDenied = false, sessionExpired = false, onRetry, onSignIn }: BoardStatusProps & { data: LeaderboardResponse; mode: 'score' | 'clear' }): JSX.Element {
  const rankLabel = data.myRank === null ? '아직 등록된 기록이 없습니다.' : data.myRank > 10 ? `내 순위: ${data.myRank}위` : `내 순위: ${data.myRank}위 · 상위 10위`;
  return <section className="leaderboard-board" aria-label={mode === 'score' ? '점수 랭킹' : '클리어 랭킹'}>
    <div className="leaderboard-board-heading"><div><span className="eyebrow">{mode === 'score' ? 'HIGHEST SCORE' : 'CAMPAIGN CLEAR'}</span><h2>{mode === 'score' ? '최고 점수' : '클리어 기록'}</h2></div><span className="leaderboard-total">전체 기록 {data.totalEntries.toLocaleString()}건</span></div>
    <p className="leaderboard-my-rank" aria-live="polite">♜ {rankLabel}</p>
    {error && <div className="leaderboard-error" role="alert"><strong>{accessDenied ? '랭킹 이용 권한이 없습니다.' : sessionExpired ? '로그인 세션이 만료되었습니다.' : '랭킹을 불러오지 못했습니다.'}</strong><p>{error}</p>{sessionExpired ? <button className="button button-secondary" type="button" onClick={onSignIn}>다시 로그인</button> : <button className="button button-secondary" type="button" onClick={onRetry}>다시 시도</button>}</div>}
    {loading && <p className="leaderboard-loading" role="status">랭킹 기록을 불러오는 중…</p>}
    {!loading && !error && data.entries.length === 0 && <p className="leaderboard-empty">아직 기록이 없습니다. 첫 원정의 주인공이 되어 보세요.</p>}
    {data.entries.length > 0 && <div className="leaderboard-table-wrap"><table className="leaderboard-table"><thead><tr><th scope="col">순위</th><th scope="col">호위대</th>{mode === 'clear' && <th scope="col">카르마</th>}<th scope="col">점수</th><th scope="col">처치</th><th scope="col">기록 시간</th>{mode === 'clear' && <th scope="col">결과</th>}</tr></thead><tbody>{data.entries.slice(0, 10).map((entry) => <EntryRow key={`${entry.rank}-${entry.displayName}`} entry={entry} mode={mode} />)}</tbody></table></div>}
  </section>;
}

function EntryRow({ entry, mode }: { entry: PublicLeaderboardEntry; mode: 'score' | 'clear' }): JSX.Element {
  return <tr><td><span className={`rank-medal rank-${entry.rank}`}>{entry.rank}</span></td><td>{entry.displayName}<small>{characterNames[entry.characterId] ?? '모험가'}</small></td>{mode === 'clear' && <td>{karmaNames[entry.karmaTier] ?? '중립'}</td>}<td className="score-cell">{entry.score.toLocaleString()}</td><td>{entry.kills.toLocaleString()}</td><td>{formatDuration(entry.elapsedSeconds)}</td>{mode === 'clear' && <td><span className="clear-result">{entry.clear ? '완주' : '기록'}</span></td>}</tr>;
}

function formatDuration(seconds: number): string {
  return `${Math.floor(seconds / 60)}분 ${seconds % 60}초`;
}
