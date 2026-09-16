$content = [System.IO.File]::ReadAllText('D:\AntiGravity\Nano_BookShelf\public_html\admin_preview.html', [System.Text.Encoding]::UTF8)
$startTag = "<script>"
$lastScriptIdx = $content.LastIndexOf($startTag)
$endTag = "</script>"
$scriptEndIdx = $content.LastIndexOf($endTag)
$js = $content.Substring($lastScriptIdx + $startTag.Length, $scriptEndIdx - $lastScriptIdx - $startTag.Length)

# Write to admin_preview.js
[System.IO.File]::WriteAllText('D:\AntiGravity\Nano_BookShelf\public_html\admin_preview.js', $js, [System.Text.Encoding]::UTF8)
Write-Output "admin_preview.js written! Length: $($js.Length)"
