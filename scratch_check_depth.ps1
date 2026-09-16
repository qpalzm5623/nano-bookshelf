$content = [System.IO.File]::ReadAllText('D:\AntiGravity\Nano_BookShelf\public_html\admin_preview.html', [System.Text.Encoding]::UTF8)
$startTag = "<script>"
$lastScriptIdx = $content.LastIndexOf($startTag)
$endTag = "</script>"
$scriptEndIdx = $content.LastIndexOf($endTag)
$js = $content.Substring($lastScriptIdx + $startTag.Length, $scriptEndIdx - $lastScriptIdx - $startTag.Length)

# Let's extract all top-level statements/blocks
$lines = $js.Split("`n")
$depth = 0
for ($i = 0; $i -lt $lines.Length; $i++) {
    $line = $lines[$i]
    $clean = $line -replace '//.*$', ''
    # Remove strings
    $clean = $clean -replace '"([^"\\]|\\.)*"', '""'
    $clean = $clean -replace "'([^'\\]|\\.)*'", "''"
    
    $open = ($clean.ToCharArray() | Where-Object { $_ -eq '{' }).Count
    $close = ($clean.ToCharArray() | Where-Object { $_ -eq '}' }).Count
    $prevDepth = $depth
    $depth += ($open - $close)
    
    # If line changed depth at top level (prevDepth was 0 or became 0 or stayed > 0)
    if ($depth -lt 0) {
        Write-Output ("Line {0,4}: Negative depth! clean: {1}" -f ($i + 1), $clean.Trim())
    }
}
Write-Output "End depth: $depth"
