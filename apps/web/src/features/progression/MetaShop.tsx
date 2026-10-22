import type { JSX } from 'react';
import type { MetaUpgradeId, PlayerProfile, PassiveId } from '@caravan/contracts';
import { metaUpgradeCatalog, passiveCatalog } from '../../game/content/metaProgression.js';
import { getUpgradeCost } from '../../game/systems/MetaProgression.js';

const titles: Record<MetaUpgradeId, string> = { 'max-health': '용사의 맷집', 'attack-damage': '무기 숙련', 'move-speed': '민첩한 발걸음', 'wagon-max-health': '마차 보강' };
const effects: Record<MetaUpgradeId, string> = { 'max-health': '최대 체력 +10', 'attack-damage': '모든 공격력 +5%', 'move-speed': '이동 속도 +6', 'wagon-max-health': '마차 체력 +20' };
const passiveEffects: Record<PassiveId, string> = { 'iron-will': '피격 시 반사 피해', 'keen-edge': '모든 무기 피해 증가', 'swift-step': '시작 이동 속도 증가' };

export function MetaShop({ profile, onPurchased, onBuyUpgrade, onBuyPassive, busy = false, error }: {
  profile: PlayerProfile; onPurchased: (profile: PlayerProfile) => void; onBuyUpgrade: (id: MetaUpgradeId) => Promise<PlayerProfile | undefined>;
  onBuyPassive: (id: PassiveId) => Promise<PlayerProfile | undefined>; busy?: boolean; error?: string | null;
}): JSX.Element {
  const purchaseUpgrade = async (id: MetaUpgradeId): Promise<void> => { const updated = await onBuyUpgrade(id); if (updated) onPurchased(updated); };
  const purchasePassive = async (id: PassiveId): Promise<void> => { const updated = await onBuyPassive(id); if (updated) onPurchased(updated); };
  return <section className="meta-shop" aria-labelledby="shop-title">
    <div className="section-heading"><div><span className="eyebrow">PERMANENT PROVISIONS</span><h2 id="shop-title">영구 강화</h2></div><p>골드를 사용해 다음 원정부터 적용되는 능력을 얻습니다.</p></div>
    {error && <p className="inline-error" role="alert">{error}</p>}
    <div className="upgrade-grid">
      {(Object.values(metaUpgradeCatalog)).map((item) => {
        const level = profile.permanentUpgradeLevels[item.id] ?? 0;
        const capped = level >= item.maxLevel;
        const cost = capped ? null : getUpgradeCost(item, level);
        const poor = cost !== null && profile.goldBalance < cost;
        return <article className="upgrade-card" key={item.id}>
          <div className="upgrade-top"><div><h3>{titles[item.id]}</h3><p>{effects[item.id]}</p></div><span className="level-pill">{level} / {item.maxLevel}</span></div>
          <div className="level-track" aria-label={`강화 레벨 ${level}/${item.maxLevel}`}><span style={{ width: `${level / item.maxLevel * 100}%` }} /></div>
          <button type="button" className="button button-secondary" disabled={busy || capped || poor} onClick={() => void purchaseUpgrade(item.id)}>{capped ? '최대 레벨' : poor ? `골드 부족 · ${cost} G` : `${cost} G · 강화`}</button>
        </article>;
      })}
    </div>
    <h3 className="subsection-title">특수 훈련</h3>
    <div className="passive-grid">
      {(Object.values(passiveCatalog)).map((item) => {
        const owned = profile.passiveIds.includes(item.id);
        const poor = profile.goldBalance < item.cost;
        return <article className="passive-card" key={item.id}><div><h3>{item.id === 'iron-will' ? '강철 의지' : item.id === 'keen-edge' ? '날카로운 감각' : '바람 걸음'}</h3><p>{passiveEffects[item.id]}</p></div>
          <button type="button" className="button button-secondary" disabled={busy || owned || poor} onClick={() => void purchasePassive(item.id)}>{owned ? '습득 완료' : poor ? `골드 부족 · ${item.cost} G` : `${item.cost} G · 습득`}</button></article>;
      })}
    </div>
  </section>;
}
