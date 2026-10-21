import type { JSX } from 'react';
import type { RunEndingSummary } from '@caravan/contracts';
import { gameEventBus } from '../bridge/GameEventBus.js';
import { endingCatalog } from '../content/endings.js';

export function EndingPanel({ summary }: { summary: RunEndingSummary }): JSX.Element {
  const ending = endingCatalog[summary.endingId];
  return <section role="dialog" aria-modal="true" aria-labelledby="ending-title" style={{ position: 'absolute', zIndex: 30, inset: 0, display: 'grid', placeContent: 'center', background: '#100d0be8', color: '#f1d7ac', textAlign: 'center', padding: 24 }}>
    <div style={{ width: 'min(560px, 90vw)', border: '1px solid #b89158', borderRadius: 16, padding: 32, background: '#211915' }}>
      <p style={{ letterSpacing: '.18em', color: '#d1ad70' }}>{summary.karmaTier.toUpperCase()} ROUTE</p>
      <h1 id="ending-title">{ending.title}</h1><p>{ending.body}</p>
      <p>카르마 {summary.karma} · 처치 {summary.kills} · 골드 {summary.runGold} · {Math.floor(summary.elapsedSeconds)}초</p>
      <button type="button" onClick={() => gameEventBus.emit('continue-after-ending', summary)} style={{ padding: '10px 28px', borderRadius: 8, border: 0, background: '#c49a5b', color: '#211915', fontWeight: 700, cursor: 'pointer' }}>계속</button>
    </div>
  </section>;
}
