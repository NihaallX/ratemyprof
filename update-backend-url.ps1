# PowerShell script to update backend URL from Railway to Vercel
# Usage: .\update-backend-url.ps1 "https://api.ratemyprof.me"

param(
    [Parameter(Mandatory=$true)]
    [string]$NewBackendUrl
)

Write-Host "🔄 Updating backend URL to: $NewBackendUrl" -ForegroundColor Cyan

# Remove trailing slashes
$NewBackendUrl = $NewBackendUrl.TrimEnd('/')

# Old Railway URL
$OldUrl = "https://ratemyprof-production-2993.up.railway.app"

# Files to update
$files = @(
    "frontend\.env",
    "frontend\src\config\api.ts",
    "frontend\src\components\MaintenanceBanner.tsx"
)

$updatedCount = 0

foreach ($file in $files) {
    $filePath = Join-Path $PSScriptRoot $file
    
    if (Test-Path $filePath) {
        Write-Host "📝 Updating: $file" -ForegroundColor Yellow
        
        # Read file content
        $content = Get-Content $filePath -Raw
        
        # Replace old URL with new URL
        $newContent = $content -replace [regex]::Escape($OldUrl), $NewBackendUrl
        
        # Check if any changes were made
        if ($content -ne $newContent) {
            # Write updated content
            Set-Content $filePath -Value $newContent -NoNewline
            Write-Host "   ✅ Updated successfully" -ForegroundColor Green
            $updatedCount++
        } else {
            Write-Host "   ⏭️  No changes needed" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ⚠️  File not found: $filePath" -ForegroundColor Red
    }
}

Write-Host "`n✨ Done! Updated $updatedCount file(s)" -ForegroundColor Green
Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Review the changes: git diff" -ForegroundColor White
Write-Host "   2. Test locally if needed" -ForegroundColor White
Write-Host "   3. Commit: git add . && git commit -m 'Update backend URL to Vercel'" -ForegroundColor White
Write-Host "   4. Push: git push origin main" -ForegroundColor White
Write-Host "   5. Your GitHub Pages will auto-deploy!" -ForegroundColor White
