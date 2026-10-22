targetScope = 'resourceGroup'

@description('Azure region for the game resources. Verify that Static Web Apps Standard and Flex Consumption are available in this region.')
param location string = resourceGroup().location

@minLength(2)
@maxLength(8)
@description('Short environment label used in resource tags.')
param environmentName string = 'dev'

@minLength(2)
@maxLength(60)
@description('Globally unique Static Web App name.')
param staticSiteName string

@minLength(2)
@maxLength(60)
@description('Globally unique Azure Functions app name. Use lowercase letters, digits, and hyphens.')
param functionName string

@minLength(3)
@maxLength(44)
@description('Globally unique Cosmos DB account name. Use lowercase letters and digits only.')
param cosmosAccountName string

@minLength(3)
@maxLength(24)
@description('Globally unique lowercase storage account name (letters and digits only).')
param storageAccountName string

@description('Cosmos DB database name used by the API.')
param cosmosDatabaseName string = 'caravan-game'

@description('Public Microsoft Entra tenant ID for the DEX workforce tenant.')
param entraTenantId string

@description('Public client ID of the exposed Caravan API application.')
param entraApiAudience string

@description('Use request-based billing for intermittent internal traffic. Serverless accounts are single-region and have no guaranteed throughput.')
param cosmosServerless bool = true

@minValue(400)
@description('Shared database RU/s when cosmosServerless is false. This is ignored for serverless accounts.')
param cosmosDatabaseThroughput int = 400

var tags = {
  application: 'caravan-escort-game'
  environment: environmentName
}
var deploymentContainerName = 'function-deployments'
var cosmosDataContributorRoleId = '00000000-0000-0000-0000-000000000002'
var storageBlobDataOwnerRoleId = 'ba92f5b4-2d11-453d-a403-e96b0029c9fe'
var storageQueueDataContributorRoleId = '974c5e8b-45b9-4653-ba55-5f855dd0fb88'
var storageTableDataContributorRoleId = '0a9a7e1f-b9d0-4cc4-a60d-0319b160aaa3'

resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageAccountName
  location: location
  kind: 'StorageV2'
  sku: { name: 'Standard_LRS' }
  tags: tags
  properties: {
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: false
    defaultToOAuthAuthentication: true
    publicNetworkAccess: 'Enabled'
  }
}

resource deploymentContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  name: '${storage.name}/default/${deploymentContainerName}'
  properties: { publicAccess: 'None' }
}

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: 'law-${environmentName}-${uniqueString(resourceGroup().id, environmentName)}'
  location: location
  tags: tags
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
    features: { enableLogAccessUsingOnlyResourcePermissions: true }
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'appi-${environmentName}-${uniqueString(resourceGroup().id, environmentName)}'
  location: location
  kind: 'web'
  tags: tags
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    IngestionMode: 'LogAnalytics'
  }
}

resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2024-05-15' = {
  name: cosmosAccountName
  location: location
  kind: 'GlobalDocumentDB'
  tags: tags
  properties: {
    databaseAccountOfferType: 'Standard'
    capabilities: cosmosServerless ? [{ name: 'EnableServerless' }] : []
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    consistencyPolicy: { defaultConsistencyLevel: 'Session' }
    enableAutomaticFailover: false
    disableLocalAuth: true
    publicNetworkAccess: 'Enabled'
    minimalTlsVersion: 'Tls12'
  }
}

resource gameDatabase 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2024-05-15' = {
  parent: cosmosAccount
  name: cosmosDatabaseName
  properties: {
    resource: { id: cosmosDatabaseName }
    options: cosmosServerless ? {} : { throughput: cosmosDatabaseThroughput }
  }
}

resource profiles 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-05-15' = {
  parent: gameDatabase
  name: 'profiles'
  properties: {
    resource: {
      id: 'profiles'
      partitionKey: { paths: ['/userId'], kind: 'Hash', version: 2 }
    }
  }
}

resource saves 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-05-15' = {
  parent: gameDatabase
  name: 'saves'
  properties: {
    resource: {
      id: 'saves'
      partitionKey: { paths: ['/userId'], kind: 'Hash', version: 2 }
    }
  }
}

resource leaderboards 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-05-15' = {
  parent: gameDatabase
  name: 'leaderboards'
  properties: {
    resource: {
      id: 'leaderboards'
      partitionKey: { paths: ['/boardId'], kind: 'Hash', version: 2 }
    }
  }
}

resource plan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: 'plan-${uniqueString(resourceGroup().id, functionName)}'
  location: location
  kind: 'functionapp'
  sku: { name: 'FC1', tier: 'FlexConsumption' }
  tags: tags
  properties: { reserved: true }
}

resource functionApp 'Microsoft.Web/sites@2024-04-01' = {
  name: functionName
  location: location
  kind: 'functionapp,linux'
  identity: { type: 'SystemAssigned' }
  tags: tags
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    publicNetworkAccess: 'Enabled'
    siteConfig: {
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      appSettings: [
        { name: 'NODE_ENV', value: 'production' }
        { name: 'FUNCTIONS_EXTENSION_VERSION', value: '~4' }
        { name: 'FUNCTIONS_WORKER_RUNTIME', value: 'node' }
        { name: 'AzureWebJobsStorage__accountName', value: storage.name }
        { name: 'ENTRA_TENANT_ID', value: entraTenantId }
        { name: 'ENTRA_API_AUDIENCE', value: entraApiAudience }
        { name: 'COSMOS_ENDPOINT', value: cosmosAccount.properties.documentEndpoint }
        { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsights.properties.ConnectionString }
      ]
    }
    functionAppConfig: {
      deployment: {
        storage: {
          type: 'blobContainer'
          value: '${storage.properties.primaryEndpoints.blob}${deploymentContainerName}'
          authentication: { type: 'SystemAssignedIdentity' }
        }
      }
      runtime: { name: 'node', version: '24' }
      scaleAndConcurrency: {
        maximumInstanceCount: 40
        instanceMemoryMB: 2048
      }
    }
  }
  dependsOn: [deploymentContainer]
}

resource staticWebApp 'Microsoft.Web/staticSites@2023-12-01' = {
  name: staticSiteName
  location: location
  tags: tags
  sku: { name: 'Standard', tier: 'Standard' }
  properties: {
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
  }
}

resource linkedBackend 'Microsoft.Web/staticSites/linkedBackends@2023-12-01' = {
  parent: staticWebApp
  name: 'linkedBackend'
  properties: {
    backendResourceId: functionApp.id
    region: location
  }
}

resource storageBlobRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storage.id, functionApp.id, storageBlobDataOwnerRoleId)
  scope: storage
  properties: {
    principalId: functionApp.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', storageBlobDataOwnerRoleId)
  }
}

resource storageQueueRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storage.id, functionApp.id, storageQueueDataContributorRoleId)
  scope: storage
  properties: {
    principalId: functionApp.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', storageQueueDataContributorRoleId)
  }
}

resource storageTableRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storage.id, functionApp.id, storageTableDataContributorRoleId)
  scope: storage
  properties: {
    principalId: functionApp.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', storageTableDataContributorRoleId)
  }
}

module cosmosRole './modules/roleAssignments.bicep' = {
  name: 'cosmos-sql-data-access'
  params: {
    cosmosAccountName: cosmosAccount.name
    principalId: functionApp.identity.principalId
    roleDefinitionId: cosmosDataContributorRoleId
  }
  dependsOn: [profiles, saves, leaderboards]
}

output staticWebAppHostname string = staticWebApp.properties.defaultHostname
output functionAppName string = functionApp.name
output functionAppHostname string = functionApp.properties.defaultHostName
output cosmosEndpoint string = cosmosAccount.properties.documentEndpoint
output functionPrincipalId string = functionApp.identity.principalId
