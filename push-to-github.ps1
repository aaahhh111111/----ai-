# 推送到 https://github.com/aaahhh111111/----ai-
# 用法：在项目目录 PowerShell 中执行 .\push-to-github.ps1

Set-Location $PSScriptRoot

Write-Host "当前分支:" (git branch --show-current)
Write-Host "远程仓库:" (git remote get-url origin)
Write-Host ""
Write-Host "正在推送分支 feat/ai-knowledge-platform ..."
git push -u origin feat/ai-knowledge-platform

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "推送成功！"
    Write-Host "创建 PR: https://github.com/aaahhh111111/----ai-/compare/main...feat/ai-knowledge-platform"
    Write-Host ""
    Write-Host "若需直接推到 main（覆盖远程仅 README 的 main），可执行："
    Write-Host "  git push origin feat/ai-knowledge-platform:main"
} else {
    Write-Host ""
    Write-Host "推送失败。请先登录 GitHub："
    Write-Host "  1. 安装 GitHub CLI: winget install GitHub.cli"
    Write-Host "  2. gh auth login"
    Write-Host "  或使用 Personal Access Token："
    Write-Host "  git remote set-url origin https://<你的TOKEN>@github.com/aaahhh111111/----ai-.git"
}
