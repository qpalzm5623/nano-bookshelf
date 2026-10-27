$content = [System.IO.File]::ReadAllText('d:\AntiGravity\Nano_BookShelf\public_html\migrated_real_data.js', [System.Text.Encoding]::UTF8)

$fStart = $content.IndexOf('window.MIGRATED_FRANCHISES = [')
$fEnd = $content.IndexOf('];', $fStart)
$fJson = $content.Substring($fStart + 29, $fEnd - $fStart - 28)
$franchises = $fJson | ConvertFrom-Json

$mStart = $content.IndexOf('window.MIGRATED_MEMBERS = [')
$mEnd = $content.IndexOf('];', $mStart)
$mJson = $content.Substring($mStart + 26, $mEnd - $mStart - 25)
$members = $mJson | ConvertFrom-Json

$synthetic = $franchises | Where-Object { $_.adminId -match '^(acad-|director_acad|admin_acad)' }
Write-Output "Total franchises with synthetic adminId: $($synthetic.Count)"
foreach ($s in $synthetic) {
    $match = $members | Where-Object { ($_.academyId -eq $s.id -or $_.academyName -eq $s.name) -and $_.role -ne 'STUDENT' }
    if ($match) {
        Write-Output "$($s.id) | $($s.name) | oldAdminId: $($s.adminId) -> Found staff: $($match[0].username) ($($match[0].role), $($match[0].name))"
    } else {
        Write-Output "$($s.id) | $($s.name) | oldAdminId: $($s.adminId) -> No staff"
    }
}
