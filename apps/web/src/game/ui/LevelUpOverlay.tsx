import { useEffect, type JSX } from 'react';
import type { UpgradeChoice } from '@caravan/contracts';
import { upgradeCatalog } from '../content/upgrades.js';

export function choiceForNumberKey(key: string, choices: readonly UpgradeChoice[]): UpgradeChoice | undefined {
  const index = Number(key) - 1;
  return Number.isInteger(index) && index >= 0 ? choices[index] : undefined;
}

interface LevelUpOverlayProps {
  level: number;
  choices: UpgradeChoice[];
  onChoose: (upgradeId: string) => void;
}

export function LevelUpOverlay({ level, choices, onChoose }: LevelUpOverlayProps): JSX.Element | null {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const choice = choiceForNumberKey(event.key, choices);
      if (!choice) return;
      event.preventDefault();
      onChoose(choice.id);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [choices, onChoose]);

  if (choices.length === 0) return null;
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="level-up-title" style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'grid', placeItems: 'center', background: '#090b0bd9', color: '#f2e3c9', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ width: 'min(900px, 92%)', textAlign: 'center' }}>
        <p style={{ color: '#e4b96e', letterSpacing: '.2em', marginBottom: 8 }}>LEVEL UP</p>
        <h2 id="level-up-title" style={{ fontSize: 32, margin: '0 0 8px' }}>레벨 {level}</h2>
        <p style={{ color: '#c5b79e', marginBottom: 28 }}>강화 하나를 선택하세요 · 1–{choices.length} 키</p>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${choices.length}, minmax(0, 1fr))`, gap: 14 }}>
          {choices.map((choice, index) => {
            const upgrade = upgradeCatalog.find((item) => item.id === choice.id);
            if (!upgrade) return null;
            return (
              <button key={choice.id} type="button" onClick={() => onChoose(choice.id)} style={{ minHeight: 190, padding: 22, border: '1px solid #98784e', borderRadius: 12, background: 'linear-gradient(150deg, #38342b, #1b211f)', color: 'inherit', textAlign: 'left', cursor: 'pointer' }}>
                <span style={{ display: 'inline-grid', placeItems: 'center', width: 28, height: 28, borderRadius: 99, background: '#d1a75f', color: '#211b14', fontWeight: 800 }}>{index + 1}</span>
                <h3 style={{ color: '#f0ce8f', margin: '18px 0 8px' }}>{upgrade.name}</h3>
                <p style={{ color: '#d0c4ad', minHeight: 40 }}>{upgrade.description}</p>
                <small style={{ color: '#94b28a' }}>Lv. {choice.nextLevel} · +{choice.value}</small>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
