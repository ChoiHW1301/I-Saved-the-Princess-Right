import type { JSX } from 'react';
import { characterCatalog } from '../../game/content/characters.js';
import type { CharacterId, PlayerProfile } from '@caravan/contracts';
import './CharacterSelect.css';

const characters = Object.values(characterCatalog);
const lockText: Record<string, string> = {
  'first-run': '첫 플레이를 마치면 해금됩니다.',
  'first-clear': '첫 클리어 후 해금됩니다.',
  'gold-threshold': '누적 골드 500을 모으면 해금됩니다.',
};

export function CharacterSelect({ profile, onStart }: { profile: PlayerProfile; onStart: (id: CharacterId) => void }): JSX.Element {
  return <section className="character-select" aria-labelledby="character-title">
    <div className="section-heading"><div><span className="eyebrow">CHOOSE YOUR GUARDIAN</span><h2 id="character-title">호위대를 선택하세요</h2></div><p>캐릭터마다 기본 공격과 전투 방식이 다릅니다.</p></div>
    <div className="character-grid">
      {characters.map((character) => {
        const unlocked = profile.unlockedCharacters.includes(character.id);
        const attack = character.startingWeaponId === 'sword' ? '검 베기' : character.startingWeaponId === 'bow' ? '관통 화살' : character.startingWeaponId === 'fireball' ? '화염구' : '골드 산탄';
        const difficulty = character.beginner ? '입문자 추천' : '숙련자용';
        return <article className={`character-card${unlocked ? '' : ' is-locked'}`} key={character.id}>
          <div className={`character-silhouette ${character.id}`} aria-hidden="true"><span>{character.name.slice(0, 1)}</span></div>
          <div className="character-copy"><span className="eyebrow">{difficulty}</span><h3>{character.name}</h3><p>기본 공격 · {attack}</p>
            {!unlocked && <p className="lock-reason">잠김 · {lockText[character.unlockRule] ?? '아직 해금되지 않았습니다.'}</p>}
          </div>
          <button type="button" className="button button-primary" disabled={!unlocked} onClick={() => onStart(character.id)} aria-label={unlocked ? `${character.name} 선택 후 출발` : `${character.name} 잠김`}>{unlocked ? '이 캐릭터로 출발' : '잠김'}</button>
        </article>;
      })}
    </div>
  </section>;
}
