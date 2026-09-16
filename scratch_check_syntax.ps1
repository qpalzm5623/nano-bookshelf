$content = [System.IO.File]::ReadAllText('D:\AntiGravity\Nano_BookShelf\public_html\admin_preview.html', [System.Text.Encoding]::UTF8)
$pos = 0
$scripts = @()
while (($start = $content.IndexOf('<script', $pos, [System.StringComparison]::OrdinalIgnoreCase)) -ge 0) {
    $tagClose = $content.IndexOf('>', $start)
    $end = $content.IndexOf('</script>', $tagClose, [System.StringComparison]::OrdinalIgnoreCase)
    if ($end -lt 0) { break }
    $code = $content.Substring($tagClose + 1, $end - $tagClose - 1)
    $scripts += $code
    $pos = $end + 9
}

Write-Output "Found $($scripts.Count) scripts"
for ($i = 0; $i -lt $scripts.Count; $i++) {
    $c = $scripts[$i]
    $ob = ($c.ToCharArray() | Where-Object { $_ -eq '{' }).Count
    $cb = ($c.ToCharArray() | Where-Object { $_ -eq '}' }).Count
    $op = ($c.ToCharArray() | Where-Object { $_ -eq '(' }).Count
    $cp = ($c.ToCharArray() | Where-Object { $_ -eq ')' }).Count
    Write-Output "Script $i - Braces: open=$ob, close=$cb; Parens: open=$op, close=$cp"
}
