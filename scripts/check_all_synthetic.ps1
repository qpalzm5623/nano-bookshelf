$content = [System.IO.File]::ReadAllText('d:\AntiGravity\Nano_BookShelf\public_html\migrated_real_data.js', [System.Text.Encoding]::UTF8)

# Find MIGRATED_FRANCHISES
$fPattern = '(?s)window\.MIGRATED_FRANCHISES\s*=\s*(\[.*?\]);'
if ($content -match $fPattern) {
    $franchises = $matches[1] | ConvertFrom-Json
    Write-Output "Total Franchises: $($franchises.Count)"
    $syn = $franchises | Where-Object { $_.adminId -match '^(director_acad|acad-|admin_acad)' }
    Write-Output "Synthetic Admin IDs: $($syn.Count)"
    foreach ($s in $syn) {
        Write-Output "$($s.id) | $($s.name) | adminId: $($s.adminId) | director: $($s.director)"
    }
} else {
    Write-Output "Could not match MIGRATED_FRANCHISES"
}
