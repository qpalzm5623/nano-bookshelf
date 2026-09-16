$content = [System.IO.File]::ReadAllText('D:\AntiGravity\Nano_BookShelf\public_html\admin_preview.html', [System.Text.Encoding]::UTF8)
$startTag = "<script>"
$endTag = "</script>"
$lastScriptIdx = $content.LastIndexOf($startTag)
$scriptEndIdx = $content.LastIndexOf($endTag)
$js = $content.Substring($lastScriptIdx + $startTag.Length, $scriptEndIdx - $lastScriptIdx - $startTag.Length)

# We can use Windows Script Control or JScript via COM, or .NET to evaluate JS syntax
# Let's test with MSScriptControl or PowerShell JScript
Add-Type -AssemblyName "Microsoft.JScript" -ErrorAction SilentlyContinue

# Or write a small html file that tries to execute it in a try-catch or eval
$lines = $js.Split("`n")
Write-Output "Total JS lines: $($lines.Length)"
Write-Output "Last 30 lines:"
for ($i = [Math]::Max(0, $lines.Length - 30); $i -lt $lines.Length; $i++) {
    Write-Output ("{0,4}: {1}" -f ($i + 1), $lines[$i])
}
