import { app, type HttpRequest, type HttpResponseInit } from '@azure/functions';
import { CharacterIdSchema, MetaUpgradeIdSchema, TrainingIdSchema } from '@caravan/contracts';
import { z } from 'zod';
import { authorizeRequest } from '../auth/authorize.js';
import { ProfileRepository, type ProfileRepositoryPort } from '../data/profileRepository.js';
import { ApiError, jsonError, readJson } from '../http/responses.js';
import { ProfileService } from '../services/profileService.js';

const PurchaseRequestSchema = z.object({
  upgradeId: z.string(),
  expectedProfileVersion: z.number().int().nonnegative(),
}).strict();
const PurchaseTrainingRequestSchema = z.object({
  characterId: CharacterIdSchema,
  trainingId: TrainingIdSchema,
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

export async function purchaseTraining(
  request: HttpRequest,
  repository?: ProfileRepositoryPort,
): Promise<HttpResponseInit> {
  try {
    const caller = await authorizeRequest(request);
    const parsed = PurchaseTrainingRequestSchema.parse(await readJson(request));
    const service = new ProfileService(repository ?? new ProfileRepository());
    return { status: 200, jsonBody: await service.purchaseTraining(caller, parsed) };
  } catch (error) {
    return jsonError(error, request);
  }
}

export async function recruitMerchant(
  request: HttpRequest,
  repository?: ProfileRepositoryPort,
): Promise<HttpResponseInit> {
  try {
    const caller = await authorizeRequest(request);
    const parsed = PurchaseRequestSchema.parse(await readJson(request));
    const service = new ProfileService(repository ?? new ProfileRepository());
    return { status: 200, jsonBody: await service.recruitMerchant(caller, parsed.expectedProfileVersion) };
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

app.http('profileTrainingPurchase', {
  methods: ['POST'], route: 'profile/trainings', authLevel: 'anonymous', handler: (request) => purchaseTraining(request),
});

app.http('profileMerchantRecruit', {
  methods: ['POST'], route: 'profile/characters/merchant', authLevel: 'anonymous', handler: (request) => recruitMerchant(request),
});
