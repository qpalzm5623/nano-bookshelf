$content = [System.IO.File]::ReadAllText('d:\AntiGravity\Nano_BookShelf\public_html\migrated_real_data.js', [System.Text.Encoding]::UTF8)

$fStart = $content.IndexOf('window.MIGRATED_FRANCHISES = [')
$fEnd = $content.IndexOf('];', $fStart)
$fJson = $content.Substring($fStart + 29, $fEnd - $fStart - 28)
$franchises = $fJson | ConvertFrom-Json

$mStart = $content.IndexOf('window.MIGRATED_MEMBERS = [')
$mEnd = $content.IndexOf('];', $mStart)
$mJson = $content.Substring($mStart + 26, $mEnd - $mStart - 25)
$members = $mJson | ConvertFrom-Json

$updatedCount = 0
foreach ($f in $franchises) {
    # Check if adminId is synthetic
    if ($f.adminId -match '^(acad-|director_acad|admin_acad)' -or [string]::IsNullOrWhiteSpace($f.adminId)) {
        # Find staff (prefer DIRECTOR, else TEACHER)
        $staff = $members | Where-Object { 
            ($_.academyId -eq $f.id -or $_.academyName -eq $f.name) -and 
            ($_.role -eq 'DIRECTOR' -or $_.role -eq 'TEACHER') -and
            !($_.username -match '^(director_acad|admin_acad)')
        } | Select-Object -First 1

        if ($staff) {
            $f.adminId = $staff.username
            if ([string]::IsNullOrWhiteSpace($f.director) -or $f.director.EndsWith(' 원장') -or $f.director -match '원장$') {
                if ($staff.name) { $f.director = $staff.name }
            }
            if ([string]::IsNullOrWhiteSpace($f.phone) -or $f.phone -eq '010-0000-0000') {
                if ($staff.phone -and $staff.phone -ne '010-0000-0000') { $f.phone = $staff.phone }
            }
            $updatedCount++
        }
    }
}

Write-Output "Updated $updatedCount franchises in MIGRATED_FRANCHISES."

# Re-serialize franchises
$newFJson = $franchises | ConvertTo-Json -Depth 10
$newContent = $content.Substring(0, $fStart + 29) + "`r`n" + $newFJson + "`r`n" + $content.Substring($fEnd)

[System.IO.File]::WriteAllText('d:\AntiGravity\Nano_BookShelf\public_html\migrated_real_data.js', $newContent, [System.Text.Encoding]::UTF8)
Write-Output "Successfully saved public_html/migrated_real_data.js"
