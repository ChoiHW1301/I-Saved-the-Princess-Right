import { useEffect, type JSX } from 'react';
import { warriorEvolutionCatalog, type WarriorEvolutionId } from '../content/warriorEvolution.js';
import './WarriorEvolutionOverlay.css';

export function WarriorEvolutionOverlay({ choices, onChoose }: {
  choices: readonly [WarriorEvolutionId, WarriorEvolutionId];
  onChoose(evolutionId: WarriorEvolutionId): void;
}): JSX.Element {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== '1' && event.key !== '2') return;
      event.preventDefault();
      onChoose(choices[event.key === '1' ? 0 : 1]);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [choices, onChoose]);

  return <div className="evolution-overlay" role="dialog" aria-modal="true" aria-labelledby="evolution-title">
    <div className="evolution-panel">
      <span className="evolution-kicker">BOSS REWARD</span>
      <h2 id="evolution-title">새로운 검의 길</h2>
      <p>하나의 진화 트리를 선택하세요.</p>
      <div className="evolution-choices">
        {choices.map((id, index) => {
          const tree = warriorEvolutionCatalog.find((candidate) => candidate.id === id)!;
          return <button key={id} type="button" className={`evolution-choice evolution-choice--${id}`} onClick={() => onChoose(id)}>
            <span className="evolution-choice-icon" aria-hidden="true">{['✦', '⚔', '☾', '♜'][warriorEvolutionCatalog.indexOf(tree)]}</span>
            <span className="evolution-choice-number">{index + 1}</span>
            <strong>{tree.name}</strong>
            <span>{tree.description}</span>
            <small>전용 강화 · {id === 'whirlwind' ? '승리를 위한 회전' : id === 'multi-sword' ? 'N도류' : id === 'sword-wave' ? '검기 강화' : '뜨거운 열기'}</small>
          </button>;
        })}
      </div>
      <small className="evolution-help">카드를 클릭하거나 1 · 2 키를 누르세요</small>
    </div>
  </div>;
}
