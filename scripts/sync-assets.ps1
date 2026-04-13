param(
  [string]$SourceRoot = "staging",
  [string]$TargetRoot = "assets",
  [string[]]$Projects = @()
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-RootPath {
  param([string]$PathValue)
  return Join-Path -Path (Get-Location) -ChildPath $PathValue
}

$sourcePath = Resolve-RootPath -PathValue $SourceRoot
$targetPath = Resolve-RootPath -PathValue $TargetRoot

if (-not (Test-Path -LiteralPath $sourcePath -PathType Container)) {
  Write-Host "No staging folder found at '$SourceRoot'. Nothing to sync."
  exit 0
}

if (-not (Test-Path -LiteralPath $targetPath -PathType Container)) {
  New-Item -ItemType Directory -Path $targetPath | Out-Null
}

$foldersToSync = @()
if ($Projects.Count -gt 0) {
  foreach ($name in $Projects) {
    $candidate = Join-Path -Path $sourcePath -ChildPath $name
    if (Test-Path -LiteralPath $candidate -PathType Container) {
      $foldersToSync += Get-Item -LiteralPath $candidate
    } else {
      Write-Warning "Skipping '$name' (not found in $SourceRoot)"
    }
  }
} else {
  $foldersToSync = Get-ChildItem -LiteralPath $sourcePath -Directory
}

if ($foldersToSync.Count -eq 0) {
  Write-Host "No project folders found to sync."
  exit 0
}

foreach ($folder in $foldersToSync) {
  $destination = Join-Path -Path $targetPath -ChildPath $folder.Name
  $null = robocopy $folder.FullName $destination /MIR /R:2 /W:1 /NFL /NDL /NJH /NJS /NP
  if ($LASTEXITCODE -gt 7) {
    throw "Robocopy failed for '$($folder.Name)' with exit code $LASTEXITCODE"
  }
  Write-Host "Synced: $($folder.Name)"
}

Write-Host "Sync complete. Review changes under '$TargetRoot' and commit."
