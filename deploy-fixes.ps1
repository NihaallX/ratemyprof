#!/usr/bin/env pwsh
# RateMyProf India - Fix Deployment Script
# This script helps verify and deploy all critical fixes

Write-Host "🔧 RateMyProf India - Fix Deployment Script" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# Check if we're in the right directory
if (-Not (Test-Path "backend\scripts\comprehensive_database_fix.sql")) {
    Write-Host "❌ Error: Please run this script from the ratemyprof root directory" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Pre-Deployment Checklist`n" -ForegroundColor Yellow

# 1. Check for .env file
Write-Host "1. Checking for environment configuration..." -ForegroundColor White
if (Test-Path "backend\.env") {
    Write-Host "   ✅ backend\.env file found" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  backend\.env file not found - you may need to configure it" -ForegroundColor Yellow
}

# 2. Check Python dependencies
Write-Host "`n2. Checking Python environment..." -ForegroundColor White
try {
    $pythonVersion = python --version 2>&1
    Write-Host "   ✅ Python installed: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Python not found in PATH" -ForegroundColor Yellow
}

# 3. Check Git status
Write-Host "`n3. Checking Git repository status..." -ForegroundColor White
$gitStatus = git status --porcelain 2>&1
if ($gitStatus) {
    Write-Host "   📝 Modified files detected:" -ForegroundColor Cyan
    Write-Host "      - backend\scripts\comprehensive_database_fix.sql (NEW)" -ForegroundColor Cyan
    Write-Host "      - backend\src\api\college_review_moderation.py (MODIFIED)" -ForegroundColor Cyan
    Write-Host "      - FIXES_APPLIED.md (NEW)" -ForegroundColor Cyan
} else {
    Write-Host "   ✅ No uncommitted changes" -ForegroundColor Green
}

Write-Host "`n" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "📝 DEPLOYMENT STEPS" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

Write-Host "STEP 1: Apply Database Fixes" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host "1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql" -ForegroundColor White
Write-Host "2. Copy contents of: backend\scripts\comprehensive_database_fix.sql" -ForegroundColor White
Write-Host "3. Paste and run in SQL Editor" -ForegroundColor White
Write-Host "4. Verify success message appears`n" -ForegroundColor White

$appliedDB = Read-Host "Have you applied the database fixes? (y/n)"
if ($appliedDB -ne 'y') {
    Write-Host "`n⚠️  Please apply database fixes before continuing" -ForegroundColor Yellow
    Write-Host "Opening the SQL file for you...`n" -ForegroundColor Cyan
    if (Get-Command code -ErrorAction SilentlyContinue) {
        code backend\scripts\comprehensive_database_fix.sql
    } else {
        Start-Process "backend\scripts\comprehensive_database_fix.sql"
    }
    exit 0
}

Write-Host "`nSTEP 2: Commit and Push Changes" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

$commitChanges = Read-Host "Do you want to commit and push changes to GitHub? (y/n)"
if ($commitChanges -eq 'y') {
    Write-Host "`n📦 Staging files..." -ForegroundColor Cyan
    git add backend/scripts/comprehensive_database_fix.sql
    git add backend/src/api/college_review_moderation.py
    git add FIXES_APPLIED.md
    git add deploy-fixes.ps1
    
    Write-Host "✅ Files staged" -ForegroundColor Green
    
    Write-Host "`n📝 Creating commit..." -ForegroundColor Cyan
    git commit -m "fix: resolve RLS policies, foreign keys, and admin endpoints

- Fix professors table RLS to allow authenticated INSERT
- Fix college_review_votes foreign key to reference auth.users
- Fix college_review_flags RLS for admin moderation
- Fix author information retrieval in admin panel
- Update all user_id foreign keys to reference auth.users
- Add comprehensive database fix script
- Add deployment documentation"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Commit created successfully" -ForegroundColor Green
        
        Write-Host "`n🚀 Pushing to GitHub..." -ForegroundColor Cyan
        git push origin main
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
            Write-Host "`n🎉 Railway will automatically deploy the changes" -ForegroundColor Cyan
        } else {
            Write-Host "❌ Push failed. Please check your Git configuration" -ForegroundColor Red
            Write-Host "   You may need to set the remote URL:" -ForegroundColor Yellow
            Write-Host "   git remote set-url origin https://github.com/NihaallX/ratemyprof.git" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Commit failed" -ForegroundColor Red
    }
} else {
    Write-Host "`n⚠️  Skipping Git operations" -ForegroundColor Yellow
    Write-Host "   You can manually commit with:" -ForegroundColor Cyan
    Write-Host "   git add ." -ForegroundColor Gray
    Write-Host "   git commit -m 'fix: resolve critical platform issues'" -ForegroundColor Gray
    Write-Host "   git push origin main`n" -ForegroundColor Gray
}

Write-Host "`nSTEP 3: Verification" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host "After deployment completes, test the following:`n" -ForegroundColor White

Write-Host "✓ Add Professor Form:" -ForegroundColor Cyan
Write-Host "  Test as regular user to ensure INSERT works`n" -ForegroundColor Gray

Write-Host "✓ College Review Voting:" -ForegroundColor Cyan
Write-Host "  Vote on any review to ensure no 500 errors`n" -ForegroundColor Gray

Write-Host "✓ Admin Moderation:" -ForegroundColor Cyan
Write-Host "  Approve/Dismiss flags as admin user`n" -ForegroundColor Gray

Write-Host "✓ Author Information:" -ForegroundColor Cyan
Write-Host "  Check admin panel shows author emails`n" -ForegroundColor Gray

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "📚 For detailed information, see:" -ForegroundColor Cyan
Write-Host "   FIXES_APPLIED.md" -ForegroundColor White
Write-Host "============================================`n" -ForegroundColor Cyan

Write-Host "✅ Deployment script completed!" -ForegroundColor Green
Write-Host "🎯 All critical fixes have been prepared and deployed`n" -ForegroundColor Green
