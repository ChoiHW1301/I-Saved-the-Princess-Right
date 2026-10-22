import { useState, type JSX } from 'react';
import { useMsal } from '@azure/msal-react';
import type { CharacterId, MetaUpgradeId, PassiveId, PlayerProfile } from '@caravan/contracts';
import { GameCanvas } from '../../game/GameCanvas.js';
import { characterCatalog } from '../../game/content/characters.js';
import { CharacterSelect } from '../characters/CharacterSelect.js';
import { MetaShop } from '../progression/MetaShop.js';
import { useProfile } from '../profile/useProfile.js';
import { ProfileApiError } from '../profile/profileApi.js';
import './HomePage.css';

type Section = 'home' | 'characters' | 'shop' | 'leaderboard';

export function HomePage(): JSX.Element {
  const { instance, accounts } = useMsal();
  const { data, loading, error, refresh, buyUpgrade, buyPassive } = useProfile();
  const [section, setSection] = useState<Section>('home');
  const [playing, setPlaying] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyUpgrade, setBusyUpgrade] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>('hero');

  async function buy(id: MetaUpgradeId | PassiveId, passive = false): Promise<PlayerProfile | undefined> {
    setBusyUpgrade(true);
    try { return passive ? await buyPassive(id as PassiveId) : await buyUpgrade(id as MetaUpgradeId); }
    finally { setBusyUpgrade(false); }
  }
  async function signOut(): Promise<void> { await instance.logoutRedirect({ account: accounts[0] }); }
  const profile = data?.profile;
  const errorMessage = error instanceof ProfileApiError && error.code === 'INSUFFICIENT_GOLD'
    ? '골드가 부족합니다. 원정에서 골드를 모은 뒤 다시 시도해 주세요.'
    : error instanceof ProfileApiError && error.code === 'PROFILE_CONFLICT'
      ? '다른 요청에서 계정이 변경되었습니다. 최신 정보를 다시 불러왔습니다.'
      : error instanceof ProfileApiError && error.status === 403
    ? 'DEX 직원 계정에 게임 이용 권한이 없습니다. 사내 게임 이용 그룹을 확인해 주세요.'
    : error instanceof ProfileApiError && error.status === 401
      ? '로그인 세션이 만료되었습니다. 다시 로그인해 주세요.'
      : '계정 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';

  if (playing && profile) return <main className="game-shell">
    <header className="game-topbar"><button className="button button-secondary" type="button" onClick={() => setPlaying(false)}>메뉴로</button><strong>CARAVAN ESCORT</strong><span>{profile.displayName} · {selectedCharacter}</span></header>
    <section className="game-frame"><GameCanvas characterId={selectedCharacter} profile={profile} /></section>
    <p className="game-hint">WASD 또는 방향키로 이동하세요. 용사는 자동으로 적을 공격합니다.</p>
  </main>;

  if (loading && !profile) return <main className="home-state" aria-live="polite"><span className="loading-seal" aria-hidden="true">✦</span><h1>원정 기록을 불러오는 중</h1><p>DEX 계정과 모험 기록을 확인하고 있습니다.</p></main>;
  if (error && !profile) return <main className="home-state"><span className="eyebrow">ACCOUNT CONNECTION</span><h1>{error instanceof ProfileApiError && error.status === 403 ? '이용 권한을 확인해 주세요' : '계정 정보를 불러올 수 없습니다'}</h1><p role="alert">{errorMessage}</p><div className="state-actions"><button className="button button-primary" type="button" onClick={() => void refresh()}>다시 시도</button>{error instanceof ProfileApiError && error.status === 401 ? <button className="button button-secondary" type="button" onClick={() => void signOut()}>다시 로그인</button> : null}</div></main>;
  if (!profile) return <main className="home-state"><p role="alert">계정 정보를 표시할 수 없습니다.</p></main>;

  return <main className="home-shell">
    <header className="home-topbar"><a className="brand-mark" href="#home" onClick={() => { setSection('home'); setNotice(null); }}><span className="brand-icon" aria-hidden="true">✦</span><span>CARAVAN<br /><b>ESCORT</b></span></a>
      <div className="account-tools"><span className="account-name">{profile.displayName}</span><span className="gold-badge" aria-label={`보유 골드 ${profile.goldBalance}`}>◈ {profile.goldBalance.toLocaleString()} G</span><button type="button" className="signout-button" onClick={() => void signOut()}>로그아웃</button></div>
    </header>
    <div className="home-layout">
      <aside className="side-nav" aria-label="메인 메뉴"><span className="nav-label">CAMP</span>
        {([['home', '야영지'], ['characters', '캐릭터'], ['shop', '영구 강화'], ['leaderboard', '랭킹']] as const).map(([key, title]) => <button type="button" key={key} className={`nav-item${section === key ? ' active' : ''}`} onClick={() => { setSection(key); setNotice(null); }} aria-current={section === key ? 'page' : undefined}><span aria-hidden="true">{key === 'home' ? '⌂' : key === 'characters' ? '♙' : key === 'shop' ? '⚒' : '♜'}</span>{title}</button>)}
        <div className="nav-note"><span className="eyebrow">YOUR VOW</span><p>마차를 지키고<br />공주를 귀환시키세요.</p></div>
      </aside>
      <div className="home-content">
        {notice && <p className="home-notice" role="status">{notice}</p>}
        {section === 'home' && <>
          <section className="welcome-banner"><div className="banner-copy"><span className="eyebrow">THE DEMON KEEP · JOURNEY 01</span><h1>마차의 호위대를<br /><em>준비하세요</em></h1><p>어둠의 성에서 공주를 구출하고, 왕국으로 돌아가는 길을 열어라.</p><div className="banner-actions"><button type="button" className="button button-primary" onClick={() => { setSection('characters'); setNotice(null); }}>새 원정 시작 <span aria-hidden="true">→</span></button><button type="button" className="button button-ghost" disabled={!data.hasCurrentSave} onClick={() => setNotice('저장된 원정 이어하기는 저장 연동 화면을 준비 중입니다.')}>이어하기 {data.hasCurrentSave ? '· 저장 있음' : '· 저장 없음'}</button></div></div><div className="banner-art" aria-hidden="true"><span className="moon" /><span className="castle castle-a" /><span className="castle castle-b" /><span className="road" /><span className="wagon">♜</span></div></section>
          <div className="home-summary"><article className="summary-card"><span className="eyebrow">해금한 캐릭터</span><strong>{profile.unlockedCharacters.length}<small> / {Object.keys(characterCatalog).length}</small></strong><button type="button" onClick={() => setSection('characters')}>캐릭터 확인 →</button></article><article className="summary-card"><span className="eyebrow">영구 성장</span><strong>{Object.values(profile.permanentUpgradeLevels).reduce((sum, level) => sum + level, 0)}<small> 강화 레벨</small></strong><button type="button" onClick={() => setSection('shop')}>강화 상점 →</button></article><article className="summary-card"><span className="eyebrow">현재 원정 저장</span><strong>{data.hasCurrentSave ? '보관 중' : '없음'}</strong><button type="button" disabled={!data.hasCurrentSave} onClick={() => setNotice('저장된 원정 이어하기는 저장 연동 화면을 준비 중입니다.')}>저장 확인 →</button></article></div>
          <section className="camp-tip"><span aria-hidden="true">✧</span><div><strong>여정의 첫걸음</strong><p>첫 플레이를 마치면 궁수, 첫 클리어 후 마법사를 만날 수 있습니다.</p></div><button type="button" aria-label="캐릭터 선택" onClick={() => setSection('characters')}>→</button></section>
        </>}
        {section === 'characters' && <><div className="page-intro"><span className="eyebrow">YOUR COMPANIONS</span><h1>호위대 선택</h1><p>해금한 캐릭터를 선택해 마차와 함께 출발하세요.</p></div><CharacterSelect profile={profile} onStart={(id) => { setSelectedCharacter(id); setPlaying(true); }} /></>}
        {section === 'shop' && <><div className="page-intro"><span className="eyebrow">CAMP PROVISIONS</span><h1>영구 강화</h1><p>원정에서 모은 골드를 사용해 계정 능력을 강화합니다.</p></div><MetaShop profile={profile} onPurchased={() => undefined} onBuyUpgrade={(id) => buy(id)} onBuyPassive={(id) => buy(id, true)} busy={busyUpgrade || loading} error={error ? errorMessage : null} /></>}
        {section === 'leaderboard' && <div className="page-intro"><span className="eyebrow">HALL OF HEROES</span><h1>랭킹</h1><p>원정 기록을 모아 순위를 확인할 수 있습니다.</p><div className="empty-panel"><span aria-hidden="true">♜</span><strong>랭킹 게시판을 준비하고 있습니다.</strong><p>랭킹 기록 화면이 곧 야영지에 추가됩니다.</p></div></div>}
      </div>
    </div>
    <footer className="home-footer"><span>© CARAVAN ESCORT</span><span>왕국의 길은 아직 멀다</span></footer>
  </main>;
}
