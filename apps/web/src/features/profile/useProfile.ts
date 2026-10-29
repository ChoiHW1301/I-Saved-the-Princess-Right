import { useCallback, useEffect, useState } from 'react';
import type { CharacterId, MetaUpgradeId, PlayerProfile, TrainingId } from '@caravan/contracts';
import { useApiToken } from '../../auth/useApiToken.js';
import { getProfile, hasCurrentSave, ProfileApiError, purchaseTraining, purchaseUpgrade, recruitMerchant } from './profileApi.js';
import { IndexedDbLocalSaveStore } from '../run/localSaveStore.js';

const localSaveStore = new IndexedDbLocalSaveStore();

export type HomeProfileState = { profile: PlayerProfile; hasCurrentSave: boolean };
export function useProfile(): {
  data: HomeProfileState | null; loading: boolean; error: ProfileApiError | Error | null;
  refresh(): Promise<void>; replaceProfile(profile: PlayerProfile, hasSave?: boolean): void;
  buyUpgrade(id: MetaUpgradeId): Promise<PlayerProfile | undefined>;
  buyTraining(characterId: CharacterId, trainingId: TrainingId): Promise<PlayerProfile | undefined>;
  recruitMerchant(): Promise<PlayerProfile | undefined>;
} {
  const { getToken } = useApiToken();
  const [data, setData] = useState<HomeProfileState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ProfileApiError | Error | null>(null);
  const replaceProfile = useCallback((profile: PlayerProfile, hasSave?: boolean) => {
    setData((current) => current ? { profile, hasCurrentSave: hasSave ?? current.hasCurrentSave } : { profile, hasCurrentSave: hasSave ?? false });
  }, []);
  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const token = await getToken();
      const [profile, saveExists, localSave] = await Promise.all([getProfile(token), hasCurrentSave(token), localSaveStore.get().catch(() => null)]);
      setData({ profile, hasCurrentSave: saveExists || Boolean(localSave) });
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
  const buyTraining = useCallback((characterId: CharacterId, trainingId: TrainingId) => buy((token, version) => purchaseTraining(token, characterId, trainingId, version)), [buy]);
  const buyMerchant = useCallback(() => buy((token, version) => recruitMerchant(token, version)), [buy]);
  return { data, loading, error, refresh, replaceProfile, buyUpgrade, buyTraining, recruitMerchant: buyMerchant };
}
