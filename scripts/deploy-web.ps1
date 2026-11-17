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

foreach ($name in @('VITE_ENTRA_TENANT_ID', 'VITE_ENTRA_WEB_CLIENT_ID', 'VITE_ENTRA_API_SCOPE', 'VITE_API_BASE_URL')) {
  if ([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($name))) {
    throw "Required build variable $name is not set. Configure it in the deployment environment; do not put credentials in Vite variables."
  }
}
$apiBaseUrl = [Environment]::GetEnvironmentVariable('VITE_API_BASE_URL').TrimEnd('/')
$apiUri = $null
if (-not [uri]::TryCreate($apiBaseUrl, [UriKind]::Absolute, [ref]$apiUri) -or
    $apiUri.Scheme -ne 'https' -or
    $apiUri.AbsolutePath -ne '/' -or
    -not [string]::IsNullOrEmpty($apiUri.Query) -or
    -not [string]::IsNullOrEmpty($apiUri.Fragment)) {
  throw 'VITE_API_BASE_URL must be the HTTPS Function origin without /api or a path.'
}
if (-not (Get-Command az -ErrorAction SilentlyContinue)) { throw 'Azure CLI (az) is required.' }
$swaCommand = if (Get-Command swa -ErrorAction SilentlyContinue) { 'swa' } else { 'npm' }
$swaArguments = if ($swaCommand -eq 'swa') {
  @('deploy', 'apps/web/dist', '--env', 'production')
} else {
  @('exec', '--yes', '--package', '@azure/static-web-apps-cli', '--', 'swa', 'deploy', 'apps/web/dist', '--env', 'production')
}

Push-Location $repoRoot
try {
  Invoke-Checked 'az' @('account', 'show', '--only-show-errors', '-o', 'none')
  Invoke-Checked 'npm' @('run', 'build', '--workspace', '@caravan/contracts')
  Invoke-Checked 'npm' @('run', 'build', '--workspace', '@caravan/web')
  $deploymentToken = (& az staticwebapp secrets list --name $StaticSiteName --resource-group $ResourceGroup --query 'properties.apiKey' -o tsv --only-show-errors | Out-String).Trim()
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($deploymentToken)) { throw 'Could not obtain the Static Web Apps deployment token from Azure CLI.' }
  $env:SWA_CLI_DEPLOYMENT_TOKEN = $deploymentToken
  try {
    Invoke-Checked $swaCommand $swaArguments
  }
  finally {
    Remove-Item Env:\SWA_CLI_DEPLOYMENT_TOKEN -ErrorAction SilentlyContinue
    $deploymentToken = $null
  }
  Write-Output 'Web deployment completed.'
}
finally { Pop-Location }
