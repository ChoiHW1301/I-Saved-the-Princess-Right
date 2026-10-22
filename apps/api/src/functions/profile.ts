import { app, type HttpRequest, type HttpResponseInit } from '@azure/functions';
import { MetaUpgradeIdSchema, PassiveIdSchema } from '@caravan/contracts';
import { z } from 'zod';
import { authorizeRequest } from '../auth/authorize.js';
import { ProfileRepository, type ProfileRepositoryPort } from '../data/profileRepository.js';
import { ApiError, jsonError, readJson } from '../http/responses.js';
import { ProfileService } from '../services/profileService.js';

const PurchaseRequestSchema = z.object({
  upgradeId: z.string(),
  expectedProfileVersion: z.number().int().nonnegative(),
}).strict();

export async function getProfile(
  request: HttpRequest,
  repository?: ProfileRepositoryPort,
): Promise<HttpResponseInit> {
  try {
    const caller = await authorizeRequest(request);
    const profile = await (repository ?? new ProfileRepository()).getOrCreate(caller);
    return { status: 200, jsonBody: profile };
  } catch (error) {
    return jsonError(error, request);
  }
}

export async function purchaseUpgrade(
  request: HttpRequest,
  repository?: ProfileRepositoryPort,
): Promise<HttpResponseInit> {
  try {
    const caller = await authorizeRequest(request);
    const parsed = PurchaseRequestSchema.parse(await readJson(request));
    const upgradeId = MetaUpgradeIdSchema.safeParse(parsed.upgradeId);
    if (!upgradeId.success) throw new ApiError(400, 'INVALID_UPGRADE');
    const service = new ProfileService(repository ?? new ProfileRepository());
    return {
      status: 200,
      jsonBody: await service.purchaseUpgrade(caller, { upgradeId: upgradeId.data, expectedProfileVersion: parsed.expectedProfileVersion }),
    };
  } catch (error) {
    return jsonError(error, request);
  }
}

export async function purchasePassive(
  request: HttpRequest,
  repository?: ProfileRepositoryPort,
): Promise<HttpResponseInit> {
  try {
    const caller = await authorizeRequest(request);
    const parsed = PurchaseRequestSchema.parse(await readJson(request));
    const passiveId = PassiveIdSchema.safeParse(parsed.upgradeId);
    if (!passiveId.success) throw new ApiError(400, 'INVALID_UPGRADE');
    const service = new ProfileService(repository ?? new ProfileRepository());
    return { status: 200, jsonBody: await service.purchasePassive(caller, passiveId.data, parsed.expectedProfileVersion) };
  } catch (error) {
    return jsonError(error, request);
  }
}

app.http('profileGet', {
  methods: ['GET'], route: 'profile', authLevel: 'anonymous', handler: (request) => getProfile(request),
});

app.http('profileUpgradePurchase', {
  methods: ['POST'], route: 'profile/upgrades', authLevel: 'anonymous', handler: (request) => purchaseUpgrade(request),
});

app.http('profilePassivePurchase', {
  methods: ['POST'], route: 'profile/passives', authLevel: 'anonymous', handler: (request) => purchasePassive(request),
});
