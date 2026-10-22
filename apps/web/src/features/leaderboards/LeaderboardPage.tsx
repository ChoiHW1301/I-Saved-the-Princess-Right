import { useEffect, useState, type JSX } from 'react';
import type { CharacterId, KarmaTier } from '@caravan/contracts';
import type { LeaderboardResponse } from './leaderboardApi.js';
import { getClearBoard, getScoreBoard, LeaderboardApiError } from './leaderboardApi.js';
import { ClearBoard } from './ClearBoard.js';
import { ScoreBoard } from './ScoreBoard.js';
import './leaderboards.css';

interface Props { getToken(): Promise<string>; onSignIn(): void; }
type Mode = 'score' | 'clear';
const emptyBoard: LeaderboardResponse = { entries: [], myRank: null, totalEntries: 0 };

export function LeaderboardPage({ getToken, onSignIn }: Props): JSX.Element {
  const [mode, setMode] = useState<Mode>('score');
  const [characterId, setCharacterId] = useState<CharacterId>('hero');
  const [karmaTier, setKarmaTier] = useState<KarmaTier>('good');
  const [cached, setCached] = useState<Record<string, LeaderboardResponse>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const key = mode === 'score' ? 'score' : `clear:${characterId}:${karmaTier}`;
  const data = cached[key] ?? emptyBoard;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const token = await getToken();
        const result = mode === 'score' ? await getScoreBoard(token) : await getClearBoard(token, characterId, karmaTier);
        if (active) setCached((current) => ({ ...current, [key]: result }));
      } catch (caught) {
        if (active) setError(caught instanceof LeaderboardApiError && caught.status === 403
          ? 'DEX 직원용 게임 이용 그룹의 권한을 확인해 주세요.'
          : caught instanceof LeaderboardApiError && caught.status === 401
            ? '계속하려면 DEX 계정으로 다시 로그인해 주세요.'
            : '연결 상태를 확인한 뒤 다시 시도해 주세요.');
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [characterId, getToken, key, karmaTier, mode, retry]);

  const accessDenied = error !== null && error.includes('권한을 확인');
  const sessionExpired = error !== null && error.includes('다시 로그인');
  const status = { loading, error, accessDenied, sessionExpired, onRetry: () => setRetry((value) => value + 1), onSignIn };
  return <div className="page-intro leaderboard-page">
    <span className="eyebrow">HALL OF HEROES</span><h1>랭킹</h1><p>원정 기록을 모아 호위대의 여정을 확인하세요.</p>
    <div className="leaderboard-mode-tabs" role="tablist" aria-label="랭킹 종류">
      <button type="button" role="tab" aria-selected={mode === 'score'} className={mode === 'score' ? 'active' : ''} onClick={() => setMode('score')}>최고 점수</button>
      <button type="button" role="tab" aria-selected={mode === 'clear'} className={mode === 'clear' ? 'active' : ''} onClick={() => setMode('clear')}>클리어 랭킹</button>
      <button type="button" className="leaderboard-refresh" onClick={() => setRetry((value) => value + 1)} aria-label="랭킹 새로고침" title="랭킹 새로고침">↻</button>
    </div>
    {mode === 'score' ? <ScoreBoard data={data} {...status} /> : <ClearBoard data={data} characterId={characterId} karmaTier={karmaTier} onCharacterChange={setCharacterId} onKarmaChange={setKarmaTier} {...status} />}
  </div>;
}
