$content = [System.IO.File]::ReadAllText('d:\AntiGravity\Nano_BookShelf\public_html\migrated_real_data.js', [System.Text.Encoding]::UTF8)

$fStart = $content.IndexOf('window.MIGRATED_FRANCHISES = [')
$fEnd = $content.IndexOf('];', $fStart)
$fJson = $content.Substring($fStart + 29, $fEnd - $fStart - 28)
$franchises = $fJson | ConvertFrom-Json

$mStart = $content.IndexOf('window.MIGRATED_MEMBERS = [')
$mEnd = $content.IndexOf('];', $mStart)
$mJson = $content.Substring($mStart + 26, $mEnd - $mStart - 25)
$members = $mJson | ConvertFrom-Json

$checkList = @('ACAD-110', 'ACAD-115', 'ACAD-126', 'ACAD-127', 'ACAD-086', 'ACAD-089', 'ACAD-094')
foreach ($code in $checkList) {
    $f = $franchises | Where-Object { $_.id -eq $code }
    $m = $members | Where-Object { $_.academyId -eq $code -or $_.academyName -eq $f.name }
    Write-Output "------------------------------------"
    Write-Output "Franchise: $($f.id) | $($f.name) | adminId: $($f.adminId) | director: $($f.director) | phone: $($f.phone)"
    if ($m) {
        foreach ($user in $m) {
            Write-Output "  Member: $($user.role) | $($user.username) | $($user.name) | $($user.phone)"
        }
    } else {
        Write-Output "  No members found in MIGRATED_MEMBERS"
    }
}
