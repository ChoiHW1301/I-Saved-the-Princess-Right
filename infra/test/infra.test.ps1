$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$template = Get-Content -Raw -Encoding utf8 (Join-Path $repoRoot 'infra\main.bicep')
$roleModule = Get-Content -Raw -Encoding utf8 (Join-Path $repoRoot 'infra\modules\roleAssignments.bicep')
$config = Get-Content -Raw -Encoding utf8 (Join-Path $repoRoot 'apps\web\public\staticwebapp.config.json') | ConvertFrom-Json
$envExample = Get-Content -Raw -Encoding utf8 (Join-Path $repoRoot '.env.example')

function Assert-Contains([string]$Text, [string]$Expected) {
  if (-not $Text.Contains($Expected)) { throw "Expected infrastructure content: $Expected" }
}

foreach ($expected in @(
  "Microsoft.Web/staticSites@2023-12-01",
  "sku: { name: 'Standard', tier: 'Standard' }",
  "Microsoft.Web/serverfarms@2024-04-01",
  "sku: { name: 'FC1', tier: 'FlexConsumption' }",
  "runtime: { name: 'node', version: '24' }",
  "Microsoft.DocumentDB/databaseAccounts@2024-05-15",
  "paths: ['/userId']",
  "paths: ['/boardId']",
  "disableLocalAuth: true",
  "capabilities: cosmosServerless ? [{ name: 'EnableServerless' }] : []",
  "{ name: 'NODE_ENV', value: 'production' }",
  "type: 'SystemAssignedIdentity'",
  "ENTRA_TENANT_ID",
  "ENTRA_API_AUDIENCE",
  "COSMOS_ENDPOINT",
  "APPLICATIONINSIGHTS_CONNECTION_STRING"
)) { Assert-Contains $template $expected }

if ($template -match "mode:\s*'Complete'") { throw 'Resource group deployments must remain incremental.' }
if ($config.navigationFallback.rewrite -ne '/index.html') { throw 'SPA fallback must rewrite to /index.html.' }
if ($config.navigationFallback.exclude -notcontains '/api/*') { throw 'Static Web Apps must not rewrite /api requests to the SPA.' }
foreach ($expected in @('VITE_ENTRA_TENANT_ID=', 'VITE_API_BASE_URL=', 'ENTRA_API_AUDIENCE=', 'COSMOS_ENDPOINT=', 'Never add secrets to VITE_*')) {
  Assert-Contains $envExample $expected
}
Assert-Contains $roleModule "Microsoft.DocumentDB/databaseAccounts/sqlRoleAssignments@2024-05-15"
Assert-Contains $roleModule 'principalId: principalId'
Assert-Contains $roleModule 'scope: cosmosAccount.id'

Write-Output 'PASS: Azure topology, configuration boundaries, routes, and identity roles'
