Set-Location $PSScriptRoot

$codexNode = Join-Path $env:LOCALAPPDATA "OpenAI\Codex\bin\node.exe"
if (Test-Path $codexNode) {
  & $codexNode server.js
  exit
}

$node = Get-Command node -ErrorAction SilentlyContinue
if ($node) {
  & $node.Source server.js
  exit
}

Write-Host "Node.js was not found."
Write-Host "Install Node.js LTS from https://nodejs.org/ and then run this file again."
