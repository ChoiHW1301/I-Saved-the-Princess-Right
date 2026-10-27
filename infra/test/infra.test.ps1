$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$template = Get-Content -Raw -Encoding utf8 (Join-Path $repoRoot 'infra\main.bicep')
$config = Get-Content -Raw -Encoding utf8 (Join-Path $repoRoot 'apps\web\public\staticwebapp.config.json') | ConvertFrom-Json
$envExample = Get-Content -Raw -Encoding utf8 (Join-Path $repoRoot '.env.example')

function Assert-Contains([string]$Text, [string]$Expected) {
  if (-not $Text.Contains($Expected)) { throw "Expected infrastructure content: $Expected" }
}

foreach ($expected in @(
  "Microsoft.Web/staticSites@2023-12-01",
  "sku: { name: 'Free', tier: 'Free' }",
  "Microsoft.Web/serverfarms@2024-04-01",
  "sku: { name: 'FC1', tier: 'FlexConsumption' }",
  "runtime: { name: 'node', version: '24' }",
  "Microsoft.DocumentDB/databaseAccounts@2024-05-15",
  "paths: ['/userId']",
  "paths: ['/boardId']",
  "disableLocalAuth: true",
  "capabilities: cosmosServerless ? [{ name: 'EnableServerless' }] : []",
  "{ name: 'NODE_ENV', value: 'production' }",
  "{ name: 'AzureWebJobsStorage__credential', value: 'managedidentity' }",
  "type: 'SystemAssignedIdentity'",
  'allowedOrigins: [ ''https://${staticWebApp.properties.defaultHostname}'' ]',
  'supportCredentials: false',
  "ENTRA_TENANT_ID",
  "ENTRA_API_AUDIENCE",
  "COSMOS_ENDPOINT",
  "APPLICATIONINSIGHTS_CONNECTION_STRING"
)) { Assert-Contains $template $expected }

if ($template -match "mode:\s*'Complete'") { throw 'Resource group deployments must remain incremental.' }
if ($template -match 'Microsoft\.Web/staticSites/linkedBackends') { throw 'The Free Static Web App must call the Function API directly.' }
if ($template -match 'Microsoft\.Authorization/roleAssignments|module\s+cosmosRole') { throw 'The Contributor deployment must not create data-role assignments.' }
if ($template -match 'functionAuthSettings|authsettingsV2') { throw 'Linked-backend-specific auth settings must not be deployed.' }
if ($config.navigationFallback.rewrite -ne '/index.html') { throw 'SPA fallback must rewrite to /index.html.' }
if ($config.navigationFallback.exclude -notcontains '/api/*') { throw 'Static Web Apps must not rewrite /api requests to the SPA.' }
foreach ($expected in @('VITE_ENTRA_TENANT_ID=', 'VITE_API_BASE_URL=', 'ENTRA_API_AUDIENCE=', 'COSMOS_ENDPOINT=', 'Never add secrets to VITE_*')) {
  Assert-Contains $envExample $expected
}
Write-Output 'PASS: Azure topology, configuration boundaries, routes, and identity roles'
