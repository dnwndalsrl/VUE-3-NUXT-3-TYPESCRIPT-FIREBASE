param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]] $Arguments
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$bundledPython = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
$python = if ($env:PHASEHARNESS_PYTHON) {
  $env:PHASEHARNESS_PYTHON
} elseif (Test-Path -LiteralPath $bundledPython) {
  $bundledPython
} else {
  'python3'
}

& $python (Join-Path $PSScriptRoot 'bin\phaseharness') @Arguments
