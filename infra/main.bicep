targetScope = 'resourceGroup'

@description('Azure region for the game resources. Verify that Static Web Apps Free and Flex Consumption are available in this region.')
param location string = resourceGroup().location

@description('Azure region for the Cosmos DB account. Can differ from the app region when the selected region has limited Cosmos DB capacity.')
param cosmosLocation string = location

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
  location: cosmosLocation
  kind: 'GlobalDocumentDB'
  tags: tags
  properties: {
    databaseAccountOfferType: 'Standard'
    capabilities: cosmosServerless ? [{ name: 'EnableServerless' }] : []
    locations: [
      {
        locationName: cosmosLocation
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
      cors: {
        allowedOrigins: [ 'https://${staticWebApp.properties.defaultHostname}' ]
        supportCredentials: false
      }
      appSettings: [
        { name: 'NODE_ENV', value: 'production' }
        { name: 'FUNCTIONS_EXTENSION_VERSION', value: '~4' }
        { name: 'AzureWebJobsStorage__accountName', value: storage.name }
        { name: 'AzureWebJobsStorage__credential', value: 'managedidentity' }
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
  sku: { name: 'Free', tier: 'Free' }
  properties: {
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
  }
}

output staticWebAppHostname string = staticWebApp.properties.defaultHostname
output functionAppName string = functionApp.name
output functionAppHostname string = functionApp.properties.defaultHostName
output cosmosEndpoint string = cosmosAccount.properties.documentEndpoint
output functionPrincipalId string = functionApp.identity.principalId
