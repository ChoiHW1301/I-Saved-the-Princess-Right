[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$ResourceGroup,
  [Parameter(Mandatory = $true)][string]$StaticSiteName
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

function Invoke-Checked([string]$Command, [string[]]$Arguments) {
  & $Command @Arguments
  if ($LASTEXITCODE -ne 0) { throw "Command failed ($LASTEXITCODE): $Command $($Arguments -join ' ')" }
}

foreach ($name in @('VITE_ENTRA_TENANT_ID', 'VITE_ENTRA_WEB_CLIENT_ID', 'VITE_ENTRA_API_SCOPE')) {
  if ([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($name))) {
    throw "Required build variable $name is not set. Configure it in the deployment environment; do not put credentials in Vite variables."
  }
}
if (-not (Get-Command az -ErrorAction SilentlyContinue)) { throw 'Azure CLI (az) is required.' }
if (-not (Get-Command swa -ErrorAction SilentlyContinue)) { throw 'Static Web Apps CLI (swa) is required.' }

Push-Location $repoRoot
try {
  Invoke-Checked 'az' @('account', 'show', '--only-show-errors', '-o', 'none')
  Invoke-Checked 'npm' @('run', 'build', '--workspace', '@caravan/contracts')
  Invoke-Checked 'npm' @('run', 'build', '--workspace', '@caravan/web')
  $deploymentToken = (& az staticwebapp secrets list --name $StaticSiteName --resource-group $ResourceGroup --query 'properties.apiKey' -o tsv --only-show-errors | Out-String).Trim()
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($deploymentToken)) { throw 'Could not obtain the Static Web Apps deployment token from Azure CLI.' }
  $env:SWA_CLI_DEPLOYMENT_TOKEN = $deploymentToken
  try {
    Invoke-Checked 'swa' @('deploy', 'apps/web/dist', '--env', 'production')
  }
  finally {
    Remove-Item Env:\SWA_CLI_DEPLOYMENT_TOKEN -ErrorAction SilentlyContinue
    $deploymentToken = $null
  }
  Write-Output 'Web deployment completed.'
}
finally { Pop-Location }
