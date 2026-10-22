import { useCallback, useEffect, useState } from 'react';
import type { MetaUpgradeId, PlayerProfile } from '@caravan/contracts';
import { useApiToken } from '../../auth/useApiToken.js';
import { getProfile, hasCurrentSave, ProfileApiError, purchasePassive, purchaseUpgrade } from './profileApi.js';

export type HomeProfileState = { profile: PlayerProfile; hasCurrentSave: boolean };
export function useProfile(): {
  data: HomeProfileState | null; loading: boolean; error: ProfileApiError | Error | null;
  refresh(): Promise<void>; buyUpgrade(id: MetaUpgradeId): Promise<PlayerProfile | undefined>; buyPassive(id: 'iron-will' | 'keen-edge' | 'swift-step'): Promise<PlayerProfile | undefined>;
} {
  const { getToken } = useApiToken();
  const [data, setData] = useState<HomeProfileState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ProfileApiError | Error | null>(null);
  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const token = await getToken();
      const [profile, saveExists] = await Promise.all([getProfile(token), hasCurrentSave(token)]);
      setData({ profile, hasCurrentSave: saveExists });
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error('요청을 완료하지 못했습니다.'));
    } finally { setLoading(false); }
  }, [getToken]);
  useEffect(() => { void refresh(); }, [refresh]);

  const buy = useCallback(async (operation: (token: string, version: number) => Promise<PlayerProfile>): Promise<PlayerProfile | undefined> => {
    if (!data) return undefined;
    setError(null);
    try {
      const token = await getToken();
      const profile = await operation(token, data.profile.version);
      setData((current) => current ? { ...current, profile } : current);
      return profile;
    } catch (caught) {
      const failure = caught instanceof Error ? caught : new Error('구매를 완료하지 못했습니다.');
      setError(failure);
      if (failure instanceof ProfileApiError && (failure.code === 'INSUFFICIENT_GOLD' || failure.code === 'PROFILE_CONFLICT')) await refresh();
      return undefined;
    }
  }, [data, getToken, refresh]);
  const buyUpgrade = useCallback((id: MetaUpgradeId) => buy((token, version) => purchaseUpgrade(token, id, version)), [buy]);
  const buyPassive = useCallback((id: 'iron-will' | 'keen-edge' | 'swift-step') => buy((token, version) => purchasePassive(token, id, version)), [buy]);
  return { data, loading, error, refresh, buyUpgrade, buyPassive };
}
