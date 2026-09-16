$content = [System.IO.File]::ReadAllText('D:\AntiGravity\Nano_BookShelf\public_html\admin_preview.html', [System.Text.Encoding]::UTF8)
$startTag = "<script>"
$lastScriptIdx = $content.LastIndexOf($startTag)
$endTag = "</script>"
$scriptEndIdx = $content.LastIndexOf($endTag)
$js = $content.Substring($lastScriptIdx + $startTag.Length, $scriptEndIdx - $lastScriptIdx - $startTag.Length)

$lines = $js.Split("`n")
$stack = New-Object System.Collections.Generic.Stack[PSObject]
$inBlockComment = $false
$inString = $false
$stringChar = ''

for ($lineNum = 1; $lineNum -le $lines.Length; $lineNum++) {
    $line = $lines[$lineNum - 1]
    $i = 0
    while ($i -lt $line.Length) {
        $ch = $line[$i]
        
        if ($inBlockComment) {
            if ($ch -eq '*' -and ($i + 1 -lt $line.Length) -and $line[$i+1] -eq '/') {
                $inBlockComment = $false
                $i += 2
                continue
            }
            $i++
            continue
        }
        
        if ($inString) {
            if ($ch -eq '\') {
                $i += 2 # skip escaped char
                continue
            }
            if ($ch -eq $stringChar) {
                $inString = $false
            }
            $i++
            continue
        }
        
        # Line comment
        if ($ch -eq '/' -and ($i + 1 -lt $line.Length) -and $line[$i+1] -eq '/') {
            break # rest of line is comment
        }
        
        # Block comment start
        if ($ch -eq '/' -and ($i + 1 -lt $line.Length) -and $line[$i+1] -eq '*') {
            $inBlockComment = $true
            $i += 2
            continue
        }
        
        # String start
        if ($ch -eq '"' -or $ch -eq "'" -or $ch -eq '`') {
            $inString = $true
            $stringChar = $ch
            $i++
            continue
        }
        
        # Braces & parens
        if ($ch -eq '{' -or $ch -eq '(' -or $ch -eq '[') {
            $stack.Push([PSCustomObject]@{ Char = $ch; Line = $lineNum; Col = $i + 1 })
        }
        elseif ($ch -eq '}' -or $ch -eq ')' -or $ch -eq ']') {
            if ($stack.Count -eq 0) {
                Write-Output "Extra closing '$ch' at Line $lineNum, Col $($i+1)"
            } else {
                $top = $stack.Pop()
                $match = $false
                if ($top.Char -eq '{' -and $ch -eq '}') { $match = $true }
                if ($top.Char -eq '(' -and $ch -eq ')') { $match = $true }
                if ($top.Char -eq '[' -and $ch -eq ']') { $match = $true }
                if (-not $match) {
                    Write-Output "Mismatched closing '$ch' at Line $lineNum, Col $($i+1). Expected match for '$($top.Char)' from Line $($top.Line), Col $($top.Col)"
                }
            }
        }
        $i++
    }
}

if ($inString) {
    Write-Output "Unclosed string of type '$stringChar' at EOF"
}
if ($inBlockComment) {
    Write-Output "Unclosed block comment at EOF"
}
Write-Output "Remaining unclosed on stack: $($stack.Count)"
while ($stack.Count -gt 0) {
    $item = $stack.Pop()
    Write-Output "Unclosed '$($item.Char)' opened at Line $($item.Line), Col $($item.Col)"
}
