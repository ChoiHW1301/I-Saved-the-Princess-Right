[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$ResourceGroup,
  [Parameter(Mandatory = $true)][string]$FunctionAppName,
  [switch]$PackageOnly
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("caravan-api-" + [guid]::NewGuid().ToString('N'))
$stage = Join-Path $tempRoot 'package'
$zipPath = Join-Path $tempRoot 'api.zip'

function Invoke-Checked([string]$Command, [string[]]$Arguments) {
  & $Command @Arguments
  if ($LASTEXITCODE -ne 0) { throw "Command failed ($LASTEXITCODE): $Command $($Arguments -join ' ')" }
}

try {
  if (-not $PackageOnly) {
    if (-not (Get-Command az -ErrorAction SilentlyContinue)) { throw 'Azure CLI (az) is required.' }
    Invoke-Checked 'az' @('account', 'show', '--only-show-errors', '-o', 'none')
  }

  Push-Location $repoRoot
  try {
    Invoke-Checked 'npm' @('run', 'build', '--workspace', '@caravan/contracts')
    Invoke-Checked 'npm' @('run', 'build', '--workspace', '@caravan/api')

    New-Item -ItemType Directory -Path (Join-Path $stage 'vendor/contracts') -Force | Out-Null
    Copy-Item 'apps/api/host.json' $stage
    Copy-Item 'apps/api/dist' (Join-Path $stage 'dist') -Recurse
    Copy-Item 'packages/contracts/dist' (Join-Path $stage 'vendor/contracts/dist') -Recurse
    $apiManifest = Get-Content 'apps/api/package.json' -Raw | ConvertFrom-Json
    $apiManifest.dependencies.'@caravan/contracts' = 'file:./vendor/contracts'
    $apiManifest | ConvertTo-Json -Depth 20 | Set-Content (Join-Path $stage 'package.json') -Encoding utf8
    $contractManifest = Get-Content 'packages/contracts/package.json' -Raw | ConvertFrom-Json
    $contractManifest | ConvertTo-Json -Depth 20 | Set-Content (Join-Path $stage 'vendor/contracts/package.json') -Encoding utf8

    Push-Location $stage
    try { Invoke-Checked 'npm' @('install', '--omit=dev', '--no-audit', '--no-fund', '--package-lock=false') }
    finally { Pop-Location }

    Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $zipPath -Force
    if ($PackageOnly) {
      Write-Output "Created API package at: $zipPath"
      return
    }

    Invoke-Checked 'az' @(
      'functionapp', 'deployment', 'source', 'config-zip',
      '--resource-group', $ResourceGroup,
      '--name', $FunctionAppName,
      '--src', $zipPath,
      '--only-show-errors', '-o', 'none'
    )
    Write-Output 'API deployment completed.'
  }
  finally { Pop-Location }
}
finally {
  if (-not $PackageOnly -and (Test-Path -LiteralPath $tempRoot)) {
    Remove-Item -LiteralPath $tempRoot -Recurse -Force
  }
}
