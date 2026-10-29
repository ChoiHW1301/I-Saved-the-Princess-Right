import { useEffect, useMemo, useState, type JSX } from 'react';
import { useMsal } from '@azure/msal-react';
import type { CharacterId, CurrentRunSaveV1, MetaUpgradeId, PlayerProfile, RunSubmission, TrainingId } from '@caravan/contracts';
import { useApiToken } from '../../auth/useApiToken.js';
import { isLocalPlaytest, loginRequest } from '../../auth/msalConfig.js';
import { GameCanvas } from '../../game/GameCanvas.js';
import { CharacterSelect } from '../characters/CharacterSelect.js';
import { MetaShop } from '../progression/MetaShop.js';
import { useProfile } from '../profile/useProfile.js';
import { ProfileApiError } from '../profile/profileApi.js';
import { RunController, RunControllerError } from '../run/RunController.js';
import { LeaderboardPage } from '../leaderboards/LeaderboardPage.js';
import './HomePage.css';

type Section = 'home' | 'characters' | 'shop' | 'leaderboard';

export function HomePage(): JSX.Element {
  const { instance, accounts } = useMsal();
  const { data, loading, error, refresh, replaceProfile, buyUpgrade, buyTraining, recruitMerchant } = useProfile();
  const { getToken } = useApiToken();
  const [section, setSection] = useState<Section>('home');
  const [playing, setPlaying] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyUpgrade, setBusyUpgrade] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>('warrior');
  const [runLaunch, setRunLaunch] = useState<{ runId: string; save?: CurrentRunSaveV1 } | null>(null);
  const [pendingResult, setPendingResult] = useState<RunSubmission | null>(null);
  const controller = useMemo(() => data ? new RunController(getToken, data.profile) : null, [getToken, data?.profile.userId]);
  useEffect(() => { if (controller && data) controller.setProfile(data.profile); }, [controller, data?.profile]);
  useEffect(() => { if (controller) void controller.getPendingResult().then(setPendingResult).catch(() => setPendingResult(null)); }, [controller]);

  async function buy(id: MetaUpgradeId): Promise<PlayerProfile | undefined> {
    setBusyUpgrade(true);
    try { return await buyUpgrade(id); }
    finally { setBusyUpgrade(false); }
  }
  async function buyCharacterTraining(characterId: CharacterId, trainingId: TrainingId): Promise<PlayerProfile | undefined> {
    setBusyUpgrade(true);
    try { return await buyTraining(characterId, trainingId); }
    finally { setBusyUpgrade(false); }
  }
  async function recruitMerchantFromShop(): Promise<PlayerProfile | undefined> {
    setBusyUpgrade(true);
    try { return await recruitMerchant(); }
    finally { setBusyUpgrade(false); }
  }
  async function signOut(): Promise<void> { if (!isLocalPlaytest) await instance.logoutRedirect({ account: accounts[0] }); }
  async function signIn(): Promise<void> { if (!isLocalPlaytest) await instance.loginRedirect(loginRequest); }
  async function startNewRun(id: CharacterId): Promise<void> {
    if (!controller) return;
    if (pendingResult) { setNotice('이전 원정 결과를 먼저 계정에 기록해 주세요.'); return; }
    if (data?.hasCurrentSave && !window.confirm('저장된 원정을 새 원정으로 바꿀까요? 현재 저장은 삭제됩니다.')) return;
    try { const next = await controller.startNew(id); replaceProfile(profile!, false); setSelectedCharacter(id); setRunLaunch(next); setPlaying(true); setNotice(null); }
    catch (caught) { setNotice(caught instanceof RunControllerError ? caught.message : '새 원정을 시작하지 못했습니다. 연결을 확인해 주세요.'); }
  }
  async function continueRun(): Promise<void> {
    if (!controller) return;
    try { const save = await controller.continueRun(); setRunLaunch({ runId: save.runId, save }); setSelectedCharacter(save.snapshot.characterId); setPlaying(true); setNotice(null); }
    catch (caught) { setNotice(caught instanceof RunControllerError ? caught.message : '저장된 원정을 불러오지 못했습니다.'); }
  }
  async function retryPendingResult(): Promise<void> {
    if (!controller) return;
    try { const receipt = await controller.retryResult(); replaceProfile(receipt.profile, false); setPendingResult(null); setNotice(`원정 결과가 저장되었습니다. 획득 골드 ${receipt.goldAward} G`); }
    catch (caught) { setNotice(caught instanceof RunControllerError ? caught.message : '결과 재제출에 실패했습니다. 연결을 확인해 주세요.'); }
  }
  function returnToHome(): void { setPlaying(false); setRunLaunch(null); }
  function onRunProfileUpdated(next: PlayerProfile): void { replaceProfile(next, false); }
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

  if (playing && profile && controller && runLaunch) return <main className="game-shell">
    <header className="game-topbar"><strong>공주님을 구했다!?</strong><span>{isLocalPlaytest && <b className="playtest-badge">LOCAL PLAYTEST</b>} {profile.displayName} · {selectedCharacter}</span></header>
    <section className="game-frame"><GameCanvas key={runLaunch.runId} characterId={selectedCharacter} profile={profile} runId={runLaunch.runId} resumeSave={runLaunch.save} controller={controller} onExit={returnToHome} onProfileUpdated={onRunProfileUpdated} onSaved={() => replaceProfile(profile, true)} /></section>
  </main>;

  if (loading && !profile) return <main className="home-state" aria-live="polite"><span className="loading-seal" aria-hidden="true">✦</span><h1>원정 기록을 불러오는 중</h1><p>DEX 계정과 모험 기록을 확인하고 있습니다.</p></main>;
  if (error && !profile) return <main className="home-state"><span className="eyebrow">ACCOUNT CONNECTION</span><h1>{error instanceof ProfileApiError && error.status === 403 ? '이용 권한을 확인해 주세요' : '계정 정보를 불러올 수 없습니다'}</h1><p role="alert">{errorMessage}</p><div className="state-actions"><button className="button button-primary" type="button" onClick={() => void refresh()}>다시 시도</button>{error instanceof ProfileApiError && error.status === 401 ? <button className="button button-secondary" type="button" onClick={() => void signOut()}>다시 로그인</button> : null}</div></main>;
  if (!profile) return <main className="home-state"><p role="alert">계정 정보를 표시할 수 없습니다.</p></main>;

  return <main className="home-shell">
    <header className="home-topbar"><a className="brand-mark" href="#home" onClick={() => { setSection('home'); setNotice(null); }}><span className="brand-icon" aria-hidden="true">✦</span><span>공주님을<br /><b>구했다!?</b></span></a>
      {isLocalPlaytest && <span className="playtest-badge">LOCAL PLAYTEST · SERVER DATA RESETS ON RESTART</span>}
      <div className="account-tools"><span className="account-name">{profile.displayName}</span><span className="gold-badge" aria-label={`보유 골드 ${profile.goldBalance}`}>◈ {profile.goldBalance.toLocaleString()} G</span><button type="button" className="signout-button" onClick={() => void signOut()}>로그아웃</button></div>
    </header>
    <div className="home-layout">
      <aside className="side-nav" aria-label="메인 메뉴"><span className="nav-label">CAMP</span>
        {([['home', '야영지'], ['shop', '상점'], ['leaderboard', '랭킹']] as const).map(([key, title]) => <button type="button" key={key} className={`nav-item${section === key ? ' active' : ''}`} onClick={() => { setSection(key); setNotice(null); }} aria-current={section === key ? 'page' : undefined}><span aria-hidden="true">{key === 'home' ? '⌂' : key === 'shop' ? '⚒' : '♜'}</span>{title}</button>)}
        <div className="nav-note"><span className="eyebrow">왕국 귀환 작전</span><p>마차를 지키고<br />모두 무사히 돌아가세요.</p></div>
      </aside>
      <div className="home-content">
        {notice && <p className="home-notice" role="status">{notice}</p>}
        {pendingResult && <div className="home-notice pending-result" role="status"><span>이전 원정 결과가 아직 계정에 기록되지 않았습니다.</span><button type="button" className="button button-secondary" onClick={() => void retryPendingResult()}>결과 다시 제출</button></div>}
        {section === 'home' && <>
          <section className="welcome-banner"><div className="banner-copy"><span className="eyebrow">구출은 성공했다. 귀환은 이제부터.</span><h1 className="game-logo"><img src="/game-assets/logo-princess-rescued.png" alt="공주님을 구했다!?" /></h1><p>공주를 태운 마차가 왕국에 닿을 때까지.<br /><strong>왕국으로 무사 귀환하라.</strong></p><div className="banner-actions"><button type="button" className="button button-primary" disabled={Boolean(pendingResult)} onClick={() => { setSection('characters'); setNotice(null); }}>새 원정 시작 <span aria-hidden="true">→</span></button><button type="button" className="button button-ghost" disabled={!data.hasCurrentSave || Boolean(pendingResult)} onClick={() => void continueRun()}>이어하기 {data.hasCurrentSave ? '· 저장 있음' : '· 저장 없음'}</button></div></div><div className="banner-art" aria-hidden="true"><img src="/game-assets/homecoming-scene.png" alt="" /></div></section>
        </>}
        {section === 'characters' && <><div className="page-intro"><span className="eyebrow">YOUR COMPANIONS</span><h1>호위대 선택</h1></div><CharacterSelect profile={profile} onStart={(id) => void startNewRun(id)} /></>}
        {section === 'shop' && <><div className="page-intro"><span className="eyebrow">CAMP PROVISIONS</span><h1>상점</h1><p>원정에서 모은 골드로 다음 여정을 준비합니다.</p></div><MetaShop profile={profile} onPurchased={(updated) => replaceProfile(updated)} onBuyUpgrade={(id) => buy(id)} onBuyTraining={buyCharacterTraining} onRecruitMerchant={recruitMerchantFromShop} busy={busyUpgrade || loading} error={error ? errorMessage : null} /></>}
        {section === 'leaderboard' && <LeaderboardPage getToken={getToken} onSignIn={() => void signIn()} />}
      </div>
    </div>
    <footer className="home-footer"><span>✦ 공주님을 구했다!?</span><span>웃음 뒤에 남은 긴 귀환길</span></footer>
  </main>;
}
