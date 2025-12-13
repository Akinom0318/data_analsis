<#
Start-all.ps1
簡單的開發用腳本：在兩個獨立的 PowerShell 視窗內啟動 backend (.venv) 與 frontend (npm start)

使用方法：在 repo 根執行：
    .\start-all.ps1

此腳本會：
  - 在新視窗啟動 backend：建立/啟動 .venv，並安裝 requirements（若尚未安裝）
  - 在新視窗啟動 frontend：執行 `npm start`

注意：第一次使用請先在 backend 手動建立虛擬環境並安裝套件，或允許腳本自動安裝（需網路）。
#>

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition

Write-Output "位於 $repoRoot"

# Backend window: 使用單一 argument list 元素以避免複雜引號錯誤
$backendCmd = "& { Set-Location -Path '$repoRoot\\backend'; if (-Not (Test-Path .venv)) { python -m venv .venv; .\\.venv\\Scripts\\Activate; pip install -r requirements.txt }; .\\.venv\\Scripts\\Activate; python project.py }"
Start-Process -FilePath powershell -ArgumentList '-NoExit', '-Command', $backendCmd -WorkingDirectory $repoRoot

# Frontend window
$frontendCmd = "& { Set-Location -Path '$repoRoot\\frontend'; npm install; npm start }"
Start-Process -FilePath powershell -ArgumentList '-NoExit', '-Command', $frontendCmd -WorkingDirectory $repoRoot
