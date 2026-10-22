import type { JSX } from 'react';
import type { RunEndingSummary, RunReceipt } from '@caravan/contracts';
import { endingCatalog } from '../../game/content/endings.js';

export function ResultPage({ summary, receipt, error, busy, onRetry, onContinue }: {
  summary: RunEndingSummary; receipt: RunReceipt | null; error: string | null; busy: boolean; onRetry(): void; onContinue(): void;
}): JSX.Element {
  const ending = endingCatalog[summary.endingId];
  return <section className="run-dialog" role="dialog" aria-modal="true" aria-labelledby="result-title"><div>
    <span className="eyebrow">{summary.karmaTier.toUpperCase()} ROUTE · RESULT</span><h1 id="result-title">{ending.title}</h1><p>{ending.body}</p>
    <p>카르마 {summary.karma} · 처치 {summary.kills} · 생존 {Math.floor(summary.elapsedSeconds)}초</p>
    {busy && <p role="status">원정 결과와 보상을 계정에 기록하고 있습니다…</p>}
    {error && <p role="alert">{error}<br />같은 원정 ID로 다시 제출하므로 보상이 중복 지급되지 않습니다.</p>}
    {receipt && <div className="receipt-details"><strong>{receipt.score.toLocaleString()}점</strong><span>획득 골드 +{receipt.goldAward} G</span><span>해금 캐릭터: {receipt.unlockedCharacters.join(', ')}</span></div>}
    {error && <button type="button" className="button button-primary" disabled={busy} onClick={onRetry}>{busy ? '재시도 중…' : '결과 다시 제출'}</button>}
    {receipt && <button type="button" className="button button-primary" onClick={onContinue}>야영지로 돌아가기</button>}
  </div></section>;
}
