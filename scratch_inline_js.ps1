$html = [System.IO.File]::ReadAllText('D:\AntiGravity\Nano_BookShelf\public_html\admin_preview.html', [System.Text.Encoding]::UTF8)
$js = [System.IO.File]::ReadAllText('D:\AntiGravity\Nano_BookShelf\public_html\admin_preview.js', [System.Text.Encoding]::UTF8)

# Replace <script src="admin_preview.js"></script> with <script> + $js + </script>
$target = '<script src="admin_preview.js"></script>'
if ($html.Contains($target)) {
    $newHtml = $html.Replace($target, "<script>`r`n" + $js + "`r`n</script>")
    [System.IO.File]::WriteAllText('D:\AntiGravity\Nano_BookShelf\public_html\admin_preview.html', $newHtml, [System.Text.Encoding]::UTF8)
    Write-Output "Inlined js successfully!"
} else {
    Write-Output "Target not found!"
}
