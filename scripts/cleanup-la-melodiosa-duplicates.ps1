# Remove only top-level La Melodiosa WAV files that match their audio/ copies.
# Necessary when applying the ZIP patch over an existing v0.15.3 installation;
# extraction alone cannot delete obsolete files.
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$sampleFolder = Join-Path $projectRoot 'public/samples/la-melodiosa'
$audioFolder = Join-Path $sampleFolder 'audio'
if (!(Test-Path -LiteralPath $audioFolder)) { throw 'Sample audio/ folder is missing.' }
$removed = 0
$skipped = 0
Get-ChildItem -LiteralPath $sampleFolder -File -Filter '*.wav' | ForEach-Object {
    $original = $_
    $safeName = $original.Name.Replace('#', 'sharp')
    $counterpart = Join-Path $audioFolder $safeName
    if (!(Test-Path -LiteralPath $counterpart)) {
        Write-Warning "No matching sample in audio/: $($original.Name)"; $skipped++; return
    }
    $a = (Get-FileHash -LiteralPath $original.FullName -Algorithm SHA256).Hash
    $b = (Get-FileHash -LiteralPath $counterpart -Algorithm SHA256).Hash
    if ($a -ne $b) {
        Write-Warning "Recording differs, preserving: $($original.Name)"; $skipped++; return
    }
    Remove-Item -LiteralPath $original.FullName
    $removed++
}
Write-Host "La Melodiosa cleanup: $removed identical WAV duplicates removed; $skipped files preserved."
