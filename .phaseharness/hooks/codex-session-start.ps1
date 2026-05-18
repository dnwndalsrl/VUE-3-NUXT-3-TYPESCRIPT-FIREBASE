$ErrorActionPreference = 'SilentlyContinue'

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$logDir = Join-Path $root '.phaseharness\state\logs'
New-Item -ItemType Directory -Path $logDir -Force | Out-Null

$logPath = Join-Path $logDir 'session-start-windows.log'
"Phaseharness Windows Codex hook active." | Set-Content -Path $logPath -Encoding UTF8
