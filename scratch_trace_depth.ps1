$lines = [System.IO.File]::ReadAllLines('D:\AntiGravity\Nano_BookShelf\public_html\admin_preview.html', [System.Text.Encoding]::UTF8)

# Find line 2062 (<script>) to line 2864 (</script>)
$start = 2061 # 0-indexed line 2062
$end = 2863   # 0-indexed line 2864

$depth = 0
for ($i = $start; $i -le $end; $i++) {
    $line = $lines[$i]
    # Remove single line comments
    $clean = $line -replace '//.*$', ''
    # Remove strings
    $clean = $clean -replace '"([^"\\]|\\.)*"', '""'
    $clean = $clean -replace "'([^'\\]|\\.)*'", "''"
    
    $open = ($clean.ToCharArray() | Where-Object { $_ -eq '{' }).Count
    $close = ($clean.ToCharArray() | Where-Object { $_ -eq '}' }).Count
    $depth += ($open - $close)
    
    # Print lines that define functions or when depth returns to 0
    if ($line -match 'function\s+([a-zA-Z0-9_]+)') {
        $fnName = $Matches[1]
        Write-Output ("Line {0,4} [depth={1,2}]: function {2}" -f ($i + 1), $depth, $fnName)
    }
}
Write-Output "Final depth at script end: $depth"
