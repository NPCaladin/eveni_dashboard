# GitHub 업로드용 ZIP 파일 생성
$sourcePath = "C:\Users\master\Desktop\eveni_dashboard"
$zipPath = "C:\Users\master\Desktop\eveni_dashboard_for_github.zip"

# 제외할 폴더/파일 패턴
$excludePatterns = @(
    "node_modules",
    ".next",
    ".git",
    "*.zip",
    "*.xlsx",
    "check_*.js",
    "analyze_*.js",
    "compare_*.js",
    "verify_*.js",
    "fix_*.js",
    "direct_*.js",
    "test_*.js",
    "debug_*.js",
    "find_*.js",
    "validate_*.js",
    "*_fix.sql",
    "*_update.sql",
    "check_*.sql",
    "fix_*.sql",
    "report_id_*.sql",
    ".env.local"
)

Write-Host "프로젝트 압축 중..." -ForegroundColor Green

# 임시 폴더 생성
$tempPath = "$env:TEMP\eveni_dashboard_temp"
if (Test-Path $tempPath) {
    Remove-Item $tempPath -Recurse -Force
}
New-Item -ItemType Directory -Path $tempPath | Out-Null

# 파일 복사 (제외 패턴 제외)
Get-ChildItem -Path $sourcePath -Recurse | ForEach-Object {
    $relativePath = $_.FullName.Substring($sourcePath.Length + 1)
    $shouldExclude = $false
    
    foreach ($pattern in $excludePatterns) {
        if ($relativePath -like "*$pattern*") {
            $shouldExclude = $true
            break
        }
    }
    
    if (-not $shouldExclude) {
        $targetPath = Join-Path $tempPath $relativePath
        $targetDir = Split-Path $targetPath -Parent
        
        if (-not (Test-Path $targetDir)) {
            New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
        }
        
        if ($_.PSIsContainer -eq $false) {
            Copy-Item $_.FullName $targetPath -Force
        }
    }
}

# ZIP 생성
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Compress-Archive -Path "$tempPath\*" -DestinationPath $zipPath -CompressionLevel Optimal

# 임시 폴더 삭제
Remove-Item $tempPath -Recurse -Force

Write-Host "✅ 압축 완료!" -ForegroundColor Green
Write-Host "파일 위치: $zipPath" -ForegroundColor Cyan
Write-Host "파일 크기: $([math]::Round((Get-Item $zipPath).Length / 1MB, 2)) MB" -ForegroundColor Cyan





