$path = 'public_html/migrated_real_data.js'
$content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)

# Replace ACAD-084
$content = $content.Replace('"director":  "0425테스트학원1 원장 원장"', '"director":  "0425테스트학원1 원장"')
$content = $content.Replace('"adminId":  "acad-084"', '"adminId":  ""')

# Replace ACAD-082
$content = $content.Replace('"director":  "test 원장 원장"', '"director":  "test 원장"')
$content = $content.Replace('"adminId":  "acad-082"', '"adminId":  ""')

# Replace ACAD-HQ
$content = $content.Replace('"adminId":  "acad-hq"', '"adminId":  ""')

[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
Write-Output "Successfully updated migrated_real_data.js"
