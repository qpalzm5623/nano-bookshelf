$content = [System.IO.File]::ReadAllText('D:\AntiGravity\Nano_BookShelf\public_html\admin_preview.html', [System.Text.Encoding]::UTF8)
$startTag = "<script>"
$lastScriptIdx = $content.LastIndexOf($startTag)
$endTag = "</script>"
$scriptEndIdx = $content.LastIndexOf($endTag)
$js = $content.Substring($lastScriptIdx + $startTag.Length, $scriptEndIdx - $lastScriptIdx - $startTag.Length)

# We can create a test html and verify in chrome headless or with browser subagent
$testHtml = @"
<!DOCTYPE html>
<html>
<body>
<div id="res"></div>
<script>
try {
  $js
  document.getElementById('res').innerText = 'ORIGINAL_SUCCESS';
} catch (e) {
  document.getElementById('res').innerText = 'ORIGINAL_ERROR: ' + e.message;
}
</script>
</body>
</html>
"@
[System.IO.File]::WriteAllText('D:\AntiGravity\Nano_BookShelf\public_html\test_orig.html', $testHtml, [System.Text.Encoding]::UTF8)

# With an extra closing brace
$testHtmlWithBrace = @"
<!DOCTYPE html>
<html>
<body>
<div id="res"></div>
<script>
try {
  $js
  }
  document.getElementById('res').innerText = 'EXTRA_BRACE_SUCCESS';
} catch (e) {
  document.getElementById('res').innerText = 'EXTRA_BRACE_ERROR: ' + e.message;
}
</script>
</body>
</html>
"@
[System.IO.File]::WriteAllText('D:\AntiGravity\Nano_BookShelf\public_html\test_extra.html', $testHtmlWithBrace, [System.Text.Encoding]::UTF8)
Write-Output "Test files created"
