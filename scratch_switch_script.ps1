$html = [System.IO.File]::ReadAllText('D:\AntiGravity\Nano_BookShelf\public_html\admin_preview.html', [System.Text.Encoding]::UTF8)
$startTag = "<script>`r`n// =============================================================="
if (-not $html.Contains("<script>`r`n// ==============================================================")) {
    $startTag = "<script>`n// =============================================================="
}
$scriptStartIdx = $html.LastIndexOf("<script>")
$scriptEndIdx = $html.LastIndexOf("</script>") + 9

$newHtml = $html.Substring(0, $scriptStartIdx) + "<script src=""admin_preview.js""></script>" + $html.Substring($scriptEndIdx)
[System.IO.File]::WriteAllText('D:\AntiGravity\Nano_BookShelf\public_html\admin_preview.html', $newHtml, [System.Text.Encoding]::UTF8)
Write-Output "admin_preview.html updated with external script!"
