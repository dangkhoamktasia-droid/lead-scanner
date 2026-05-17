# Run this script as Administrator to set up auto-scan
# Right-click setup-autoscan.ps1 → "Run with PowerShell as Administrator"

$action = New-ScheduledTaskAction `
    -Execute "curl.exe" `
    -Argument '"http://localhost:3000/api/cron?secret=lead-scanner-cron-2024"'

$triggers = @(
    $(New-ScheduledTaskTrigger -Daily -At "07:00AM"),
    $(New-ScheduledTaskTrigger -Daily -At "07:00PM")
)

$settings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 20)

Register-ScheduledTask `
    -TaskName "LeadScanner-AutoScan" `
    -Description "Tu dong quet Facebook Groups tim lead KOL/KOC 2 lan/ngay" `
    -Action $action `
    -Trigger $triggers `
    -Settings $settings `
    -RunLevel Highest `
    -Force

Write-Host ""
Write-Host "✅ Auto-scan da duoc cai dat thanh cong!" -ForegroundColor Green
Write-Host "   Lich: 7:00 sang va 19:00 toi moi ngay" -ForegroundColor Cyan
Write-Host ""
Write-Host "Luu y: May tinh va app phai dang chay de scan hoat dong." -ForegroundColor Yellow
Write-Host ""
Read-Host "Bam Enter de dong"
