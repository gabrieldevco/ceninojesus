<#
  Aplica (crea o actualiza) los rulesets de .github/rulesets/*.json en el repositorio de GitHub.
  Debe ejecutarlo un administrador del repositorio con `gh` autenticado.

  Uso:
    .\scripts\aplicar-politicas.ps1                      # repo del remoto actual
    .\scripts\aplicar-politicas.ps1 -Repo owner/nombre
    .\scripts\aplicar-politicas.ps1 -SoloMostrar         # no cambia nada
#>
param(
  [string]$Repo,
  [switch]$SoloMostrar
)

$ErrorActionPreference = 'Stop'
if (-not $Repo) { $Repo = gh repo view --json nameWithOwner --jq .nameWithOwner }
if ($LASTEXITCODE -ne 0 -or -not $Repo) { throw "No se pudo resolver el repositorio. Verifica 'gh auth status' y que tu cuenta tenga acceso de administrador." }
Write-Host "Repositorio: $Repo"

$existentes = gh api "repos/$Repo/rulesets" | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) { throw "No se pudieron leer los rulesets de $Repo (¿eres administrador?)." }
$dir = Join-Path $PSScriptRoot '..\.github\rulesets'

foreach ($archivo in Get-ChildItem $dir -Filter *.json) {
  $nombre = (Get-Content $archivo.FullName -Raw | ConvertFrom-Json).name
  $actual = $existentes | Where-Object { $_.name -eq $nombre } | Select-Object -First 1
  if ($actual) { $metodo = 'PUT'; $ruta = "repos/$Repo/rulesets/$($actual.id)"; $accion = 'actualizar' }
  else         { $metodo = 'POST'; $ruta = "repos/$Repo/rulesets";             $accion = 'crear' }

  if ($SoloMostrar) { Write-Host "[simulacion] $accion '$nombre'"; continue }
  gh api --method $metodo $ruta --input $archivo.FullName | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Falló al $accion '$nombre'." }
  Write-Host "OK: $accion '$nombre'"
}

Write-Host "`nListo. Revisa en GitHub: Settings > Rules > Rulesets."
Write-Host "Los checks requeridos (branch-policy, pr-title, backend-tests, frontend-build) deben haberse ejecutado al menos una vez."
