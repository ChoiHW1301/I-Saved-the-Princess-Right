import { useEffect, useState, type JSX } from 'react';
import { characterCatalog } from '../../game/content/characters.js';
import type { CharacterId, PlayerProfile } from '@caravan/contracts';
import './CharacterSelect.css';

const characters = Object.values(characterCatalog);
const portraitById: Record<string, string> = {
  warrior: '/game-assets/portrait-warrior.png',
  archer: '/game-assets/portrait-archer.png',
  mage: '/game-assets/portrait-mage.png',
  merchant: '/game-assets/portrait-merchant.png',
};

export function CharacterSelect({ profile, onStart }: { profile: PlayerProfile; onStart: (id: CharacterId) => void }): JSX.Element {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const availableCharacters = characters.filter((entry) => profile.unlockedCharacters.includes(entry.id));
  if (availableCharacters.length === 0) return <section className="character-select" aria-labelledby="character-title"><h2 id="character-title">선택 가능한 캐릭터가 없습니다.</h2></section>;
  useEffect(() => {
    if (availableCharacters.length < 2) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || target.closest('input, textarea, select, [contenteditable="true"]'))) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setSelectedIndex((index) => (index - 1 + availableCharacters.length) % availableCharacters.length);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        setSelectedIndex((index) => (index + 1) % availableCharacters.length);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [availableCharacters.length]);

  const currentIndex = Math.min(selectedIndex, availableCharacters.length - 1);
  const character = availableCharacters[currentIndex]!;
  const attack = character.startingWeaponId === 'sword' ? '검 베기' : character.startingWeaponId === 'bow' ? '관통 화살' : character.startingWeaponId === 'fireball' ? '화염구' : '골드 산탄';
  const difficulty = character.beginner ? '입문자 추천' : '숙련자용';
  const shiftCharacter = (offset: number): void => setSelectedIndex((index) => (index + offset + availableCharacters.length) % availableCharacters.length);

  return <section className="character-select" aria-labelledby="character-title">
    <div className="section-heading"><div><span className="eyebrow">CHOOSE YOUR GUARDIAN</span><h2 id="character-title">호위대를 선택하세요</h2></div><p>좌우 화살표로 캐릭터를 살펴보세요.</p></div>
    <div className={`character-carousel ${character.id}`}>
      {availableCharacters.length > 1 && <button type="button" className="character-arrow" onClick={() => shiftCharacter(-1)} aria-label="이전 캐릭터"><span aria-hidden="true">‹</span></button>}
      <div className="character-center" aria-live="polite">
        <div className="portrait-stage">
          <span className="portrait-halo" aria-hidden="true" />
          <img key={character.id} className="character-portrait" src={portraitById[character.id]} alt={`${character.name} 일러스트`} draggable="false" />
        </div>
        <div className="character-details">
          <span className="eyebrow">{difficulty}</span>
          <h3>{character.name}</h3>
          <p>기본 공격 · {attack}</p>
          <div className="character-stats" aria-label="캐릭터 기본 능력치">
            <span>체력 <strong>{character.baseStats.maxHp}</strong></span>
            <span>이동 <strong>{character.baseStats.speed}</strong></span>
          </div>
          <button type="button" className="button button-primary character-start" onClick={() => onStart(character.id)} aria-label={`${character.name} 선택 후 출발`}>
            이 캐릭터로 출발
          </button>
        </div>
      </div>
      {availableCharacters.length > 1 && <button type="button" className="character-arrow" onClick={() => shiftCharacter(1)} aria-label="다음 캐릭터"><span aria-hidden="true">›</span></button>}
    </div>
    {availableCharacters.length > 1 && <div className="character-index" aria-label={`해금한 캐릭터 ${currentIndex + 1} / ${availableCharacters.length}`}>
      {availableCharacters.map((entry, index) => <button key={entry.id} type="button" className={`character-dot${index === currentIndex ? ' active' : ''}`} onClick={() => setSelectedIndex(index)} aria-label={`${entry.name} 선택`} aria-current={index === currentIndex ? 'true' : undefined} />)}
      <span>{String(currentIndex + 1).padStart(2, '0')} / {String(availableCharacters.length).padStart(2, '0')}</span>
    </div>}
  </section>;
}
