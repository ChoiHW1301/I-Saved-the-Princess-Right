[CmdletBinding()]
param(
  [ValidateSet('Local', 'Release')][string]$Mode = 'Release'
)

$ErrorActionPreference = 'Stop'
$baseUrl = $env:GAME_BASE_URL
if ([string]::IsNullOrWhiteSpace($baseUrl)) { throw 'Set GAME_BASE_URL to the web app origin before running smoke checks.' }
$parsedBase = [uri]$baseUrl
if (-not ($parsedBase.Scheme -in @('http', 'https')) -or $parsedBase.AbsolutePath -ne '/') {
  throw 'GAME_BASE_URL must be an origin such as http://localhost:5173 or https://game.example.com, without a path.'
}
if ($Mode -eq 'Local' -and $parsedBase.Host -notin @('localhost', '127.0.0.1', '::1')) {
  throw 'Local mode only accepts localhost, 127.0.0.1, or ::1.'
}
if ($Mode -eq 'Local') {
  foreach ($name in @('DEX_TEST_USER', 'NON_DEX_TEST_USER')) {
    if ([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($name))) {
      throw "Set $name to a test-account label. The value is not sent to the server or printed."
    }
  }
}

function Assert-Status([string]$Path, [int]$Expected) {
  $uri = [uri]::new($parsedBase, $Path)
  try {
    $response = Invoke-WebRequest -Uri $uri -Method Get -MaximumRedirection 0 -ErrorAction Stop
    $actual = [int]$response.StatusCode
    $body = $response.Content
  }
  catch {
    $webResponse = $_.Exception.Response
    if ($null -eq $webResponse) { throw "Request failed for $Path; check GAME_BASE_URL and service availability." }
    $actual = [int]$webResponse.StatusCode
    $body = ''
  }
  if ($actual -ne $Expected) { throw "Smoke check failed for $Path (expected HTTP $Expected, got $actual)." }
  [pscustomobject]@{ Path = $Path; Status = $actual; Body = $body }
}

$health = Assert-Status '/api/health' 200
try { $healthJson = $health.Body | ConvertFrom-Json } catch { throw 'Health endpoint did not return valid JSON.' }
if ($healthJson.status -ne 'ok') { throw 'Health endpoint returned an unexpected status payload.' }
Write-Output 'PASS GET /api/health (200)'

foreach ($path in @('/api/me', '/api/profile', '/api/save', '/api/leaderboards/score', '/api/leaderboards/clears')) {
  [void](Assert-Status $path 401)
  Write-Output "PASS unauthenticated GET $path (401)"
}
Write-Output 'Read-only smoke checks passed. No account sign-in or game data was submitted.'
