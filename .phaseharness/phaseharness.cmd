@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
if defined PHASEHARNESS_PYTHON (
  set "PYTHON_EXE=%PHASEHARNESS_PYTHON%"
) else (
  set "PYTHON_EXE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
)
if not exist "%PYTHON_EXE%" (
  set "PYTHON_EXE=python3"
)
"%PYTHON_EXE%" "%SCRIPT_DIR%bin\phaseharness" %*
