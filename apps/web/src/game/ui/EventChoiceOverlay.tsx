import { useEffect, type JSX } from 'react';
import type { StoryEvent } from '../content/events.js';

interface EventChoiceOverlayProps {
  event: StoryEvent;
  onChoose: (eventId: string, choiceId: 'yes' | 'no') => void;
}

export function EventChoiceOverlay({ event, onChoose }: EventChoiceOverlayProps): JSX.Element {
  useEffect(() => {
    const onKeyDown = (keyEvent: KeyboardEvent): void => {
      const key = keyEvent.key.toLowerCase();
      if (key !== 'y' && key !== 'n') return;
      keyEvent.preventDefault();
      onChoose(event.id, key === 'y' ? 'yes' : 'no');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [event.id, onChoose]);

  const choices = [event.yes, event.no] as const;
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="event-title" style={{ position: 'absolute', inset: 0, zIndex: 21, display: 'grid', placeItems: 'center', background: '#090b0be3', color: '#f2e3c9', fontFamily: 'system-ui, sans-serif' }}>
      <article style={{ width: 'min(640px, 90%)', padding: 34, border: '1px solid #8f754f', borderRadius: 14, background: 'linear-gradient(145deg, #302b25, #171d1b)', boxShadow: '0 22px 70px #000b' }}>
        <p style={{ color: '#e4b96e', letterSpacing: '.18em', margin: 0 }}>ROAD ENCOUNTER · {Math.floor(event.atSeconds / 60)} MIN</p>
        <h2 id="event-title" style={{ fontSize: 30, color: '#f0ce8f' }}>{event.title}</h2>
        <p style={{ color: '#d0c4ad', fontSize: 17, lineHeight: 1.7 }}>{event.body}</p>
        <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
          {choices.map((choice) => (
            <button key={choice.id} type="button" onClick={() => onChoose(event.id, choice.id)} style={{ flex: 1, padding: '14px 18px', border: '1px solid #9e8155', borderRadius: 8, background: '#4a4030', color: '#f8e7c7', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
              {choice.label} <small style={{ display: 'block', marginTop: 6, color: '#d3c2a4', fontWeight: 400 }}>Karma {choice.karmaDelta > 0 ? '+' : ''}{choice.karmaDelta} · Wagon {choice.wagonHpDelta > 0 ? '+' : ''}{choice.wagonHpDelta} · Gold {choice.goldDelta > 0 ? '+' : ''}{choice.goldDelta}</small>
            </button>
          ))}
        </div>
        <p style={{ marginBottom: 0, color: '#9e927c', fontSize: 12 }}>Y = Yes · N = No</p>
      </article>
    </div>
  );
}
