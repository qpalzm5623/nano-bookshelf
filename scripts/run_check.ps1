$lines = Get-Content 'public_html/migrated_real_data.js' -TotalCount 2877
$txt = $lines -join "`n"
$start = $txt.IndexOf('window.MIGRATED_FRANCHISES =')
$sub = $txt.Substring($start + 28).Trim().TrimEnd(';')
while ($sub.EndsWith(']')) {
    if ($sub.EndsWith("]`n]") -or $sub.EndsWith("]`r`n]") -or $sub.EndsWith("]]")) {
        $sub = $sub.Substring(0, $sub.LastIndexOf(']')).Trim()
    } else {
        break
    }
}

$list = $sub | ConvertFrom-Json
Write-Output "Total franchises: $($list.Count)"

$syn = $list | Where-Object { $_.adminId -match '^(director_acad|acad-|admin_acad)' }
Write-Output "Synthetic count: $($syn.Count)"
foreach ($s in $syn) {
    Write-Output "$($s.id) | $($s.name) | adminId: $($s.adminId) | director: $($s.director)"
}
