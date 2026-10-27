$content = [System.IO.File]::ReadAllText('d:\AntiGravity\Nano_BookShelf\public_html\migrated_real_data.js', [System.Text.Encoding]::UTF8)

# Find MIGRATED_MEMBERS
$startIdx = $content.IndexOf('window.MIGRATED_MEMBERS = [')
if ($startIdx -ge 0) {
    $endIdx = $content.IndexOf('];', $startIdx)
    $jsonText = $content.Substring($startIdx + 26, $endIdx - $startIdx - 25)
    $members = $jsonText | ConvertFrom-Json
    
    $staff = $members | Where-Object { $_.role -ne 'STUDENT' }
    foreach ($s in $staff) {
        Write-Output "$($s.academyId) | $($s.academyName) | $($s.role) | $($s.username) | $($s.name) | $($s.phone)"
    }
}
