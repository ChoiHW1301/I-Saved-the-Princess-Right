import { useState, type JSX } from 'react';
import { MERCHANT_RECRUIT_COST, type CharacterId, type MetaUpgradeId, type PlayerProfile, type TrainingId } from '@caravan/contracts';
import { metaUpgradeCatalog } from '../../game/content/metaProgression.js';
import { getUpgradeCost } from '../../game/systems/MetaProgression.js';

const titles: Record<MetaUpgradeId, string> = {
  'max-health': '튼튼한 체력', 'attack-damage': '무기 숙련', 'critical-chance': '급소 노리기',
  'move-speed': '민첩한 발걸음', 'attack-speed': '빠른 손놀림', 'health-regeneration': '들끓는 심장',
  'wagon-max-health': '마차 보강', 'xp-gain': '배움의 길', 'gold-gain': '행운의 주머니', defense: '단단한 갑옷',
};
const effects: Record<MetaUpgradeId, string> = {
  'max-health': '최대 체력 +10', 'attack-damage': '모든 공격력 +5%', 'critical-chance': '치명타 확률 +2%',
  'move-speed': '이동 속도 +6', 'attack-speed': '공격 속도 +10%', 'health-regeneration': '초당 체력 회복 +0.2',
  'wagon-max-health': '마차 최대 체력 +20', 'xp-gain': '경험치 획득량 +5%', 'gold-gain': '골드 획득량 +5%', defense: '받는 피해 -2%',
};
const merchantChatter = [
  '요즘 길이 험해서 말이지. 물건값도 덩달아 올랐어.',
  '금화는 무겁고, 욕심은 가볍지. 자네는 어느 쪽인가?',
  '이 천은 용암에도 끄떡없다네. 아마도. 시험은 아직 안 해봤고.',
  '공주님 호위라니 대단하군. 마차 보험은 들었나?',
  '나는 상인이지 마법사가 아니야. 환불 주문은 받지 않는다네.',
  '저기 마차 말인가? 바퀴 소리가 꽤 비싸게 들리는군.',
  '먼 길을 갈 땐 신발이 중요하지. 그리고 금화도 아주 중요해.',
  '내 짐 속엔 없는 게 없다네. 찾는 게 뭔지는 나도 모르겠지만.',
  '흠, 자네 눈빛이 심상치 않군. 혹시 나한테 할 말이라도 있나?',
];

export function MetaShop({ profile, onPurchased, onBuyUpgrade, onRecruitMerchant = async () => undefined, busy = false, error }: {
  profile: PlayerProfile; onPurchased: (profile: PlayerProfile) => void; onBuyUpgrade: (id: MetaUpgradeId) => Promise<PlayerProfile | undefined>;
  onBuyTraining: (characterId: CharacterId, trainingId: TrainingId) => Promise<PlayerProfile | undefined>;
  onRecruitMerchant?: () => Promise<PlayerProfile | undefined>; busy?: boolean; error?: string | null;
}): JSX.Element {
  const [merchantClicks, setMerchantClicks] = useState(0);
  const [merchantLine, setMerchantLine] = useState('원하는 것을 골라보라고.');
  const purchaseUpgrade = async (id: MetaUpgradeId): Promise<void> => { const updated = await onBuyUpgrade(id); if (updated) onPurchased(updated); };
  const talkToMerchant = async (): Promise<void> => {
    if (profile.unlockedCharacters.includes('merchant')) { setMerchantLine('계약은 끝났네. 이제 같은 편으로 함께 가세!'); return; }
    if (merchantClicks < 9) {
      setMerchantLine(merchantChatter[merchantClicks]!);
      setMerchantClicks((count) => count + 1);
      return;
    }
    if (merchantClicks === 9) {
      setMerchantClicks(10);
      setMerchantLine('뭐? 날 영입하고 싶다고? 그럼 1만 골드 정도는 필요할걸세.');
      return;
    }
    if (profile.goldBalance < MERCHANT_RECRUIT_COST) {
      setMerchantLine(profile.goldBalance <= 3_000
        ? '한참 모자라구만 친구, 껄껄.'
        : profile.goldBalance <= 5_000
          ? '꽤나 모았는데? 그래도 아직일세나.'
          : '조금 더 힘내보면 될 것 같은데?');
      return;
    }
    if (window.confirm('떠돌이 상인을 영입하시겠습니까?')) {
      const updated = await onRecruitMerchant();
      if (updated) { onPurchased(updated); setMerchantLine('좋아, 계약 성립일세! 이제 한 배를 탔군.'); }
    }
  };
  return <section className="meta-shop" aria-labelledby="shop-title">
    <div className="section-heading"><div><span className="eyebrow">CAMP PROVISIONS</span><h2 id="shop-title">상점</h2></div><p>골드로 원정 준비를 하고, 함께 갈 동료를 영입하세요.</p></div>
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
    <button type="button" className="merchant-shopkeeper" aria-label="상인과 대화" onClick={() => void talkToMerchant()} disabled={busy}><span className="merchant-speech" aria-live="polite">{merchantLine}</span><img src="/game-assets/portrait-merchant.png" alt="" /></button>
  </section>;
}
