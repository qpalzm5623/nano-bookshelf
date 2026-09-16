$content = [System.IO.File]::ReadAllText('D:\AntiGravity\Nano_BookShelf\public_html\admin_preview.html', [System.Text.Encoding]::UTF8)
$startTag = "<script>"
$lastScriptIdx = $content.LastIndexOf($startTag)
$endTag = "</script>"
$scriptEndIdx = $content.LastIndexOf($endTag)
$js = $content.Substring($lastScriptIdx + $startTag.Length, $scriptEndIdx - $lastScriptIdx - $startTag.Length)

# Escape backticks and backslashes for JS template literal
$escaped = $js.Replace('\', '\\').Replace('`', '\`').Replace('$', '\$')

$html = @"
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<pre id="output"></pre>
<script>
const rawJs = `$escaped`;
const out = document.getElementById('output');

try {
  new Function(rawJs);
  out.textContent += "SUCCESS: Full script parsed without error!\n";
} catch (e) {
  out.textContent += "FULL ERROR: " + e.name + ": " + e.message + "\n";
  
  // Binary search to find breaking line
  const lines = rawJs.split('\n');
  out.textContent += "Total lines: " + lines.length + "\n";
  
  for (let i = 1; i <= lines.length; i++) {
    const sub = lines.slice(0, i).join('\n');
    try {
      new Function(sub);
      // Valid!
    } catch (err) {
      if (err.message.indexOf('Unexpected end of input') === -1) {
        out.textContent += "First non-EOF syntax error at line " + i + ": " + err.message + "\n";
        out.textContent += "Line content: " + lines[i-1] + "\n";
        break;
      }
    }
  }
}
</script>
</body>
</html>
"@

[System.IO.File]::WriteAllText('D:\AntiGravity\Nano_BookShelf\public_html\test_syntax.html', $html, [System.Text.Encoding]::UTF8)
Write-Output "test_syntax.html generated!"
