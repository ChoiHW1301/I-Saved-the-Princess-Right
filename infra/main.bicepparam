using './main.bicep'

param location = 'koreacentral'
param environmentName = 'dev'
param staticSiteName = 'caravan-escort-swa-change-me'
param functionName = 'caravan-escort-api-change-me'
param cosmosAccountName = 'caravanescortdbchangeme'
param storageAccountName = 'caravanescortstgchange'
param cosmosDatabaseName = 'caravan-game'
param entraTenantId = '00000000-0000-0000-0000-000000000000'
param entraApiAudience = '00000000-0000-0000-0000-000000000000'
param cosmosServerless = true
param cosmosDatabaseThroughput = 400
