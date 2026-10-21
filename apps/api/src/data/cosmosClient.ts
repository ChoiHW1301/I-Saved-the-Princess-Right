import { CosmosClient, type Container } from '@azure/cosmos';
import { DefaultAzureCredential } from '@azure/identity';

const DATABASE_ID = 'caravan-game';
let client: CosmosClient | undefined;

export interface GameContainers {
  profiles: Container;
  saves: Container;
  leaderboards: Container;
}

export function getCosmosClient(): CosmosClient {
  if (client) return client;
  const endpoint = process.env.COSMOS_ENDPOINT?.trim();
  if (!endpoint) throw new Error('STORAGE_UNAVAILABLE');
  try {
    new URL(endpoint);
  } catch {
    throw new Error('STORAGE_UNAVAILABLE');
  }
  client = new CosmosClient({ endpoint, aadCredentials: new DefaultAzureCredential() });
  return client;
}

export function getGameContainers(): GameContainers {
  const database = getCosmosClient().database(DATABASE_ID);
  return {
    profiles: database.container('profiles'),
    saves: database.container('saves'),
    leaderboards: database.container('leaderboards'),
  };
}

export function resetCosmosClientForTests(): void {
  client = undefined;
}
