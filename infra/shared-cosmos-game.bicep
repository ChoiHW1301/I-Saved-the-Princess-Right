targetScope = 'resourceGroup'

@description('Existing Cosmos DB for NoSQL account in this resource group. This template never creates or updates the account.')
param cosmosAccountName string

@description('Database reserved for the Caravan game.')
param cosmosDatabaseName string = 'caravan-game'

@minValue(400)
@description('Manual RU/s shared by the three game containers. Provisioned throughput may add cost.')
param sharedThroughput int = 400

resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2024-05-15' existing = {
  name: cosmosAccountName
}

resource gameDatabase 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2024-05-15' = {
  parent: cosmosAccount
  name: cosmosDatabaseName
  properties: {
    resource: { id: cosmosDatabaseName }
    options: { throughput: sharedThroughput }
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
      indexingPolicy: {
        automatic: true
        indexingMode: 'consistent'
        includedPaths: [{ path: '/*' }]
        excludedPaths: [{ path: '/"_etag"/?' }]
        compositeIndexes: [[
          { path: '/score', order: 'descending' }
          { path: '/kills', order: 'descending' }
          { path: '/elapsedSeconds', order: 'descending' }
          { path: '/displayName', order: 'ascending' }
        ]]
      }
    }
  }
}

output cosmosEndpoint string = cosmosAccount.properties.documentEndpoint
output databaseName string = gameDatabase.name
output databaseResourceId string = gameDatabase.id
