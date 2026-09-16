$lines = [System.IO.File]::ReadAllLines('D:\AntiGravity\Nano_BookShelf\public_html\admin_preview.html', [System.Text.Encoding]::UTF8)
for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -match '<script') {
        Write-Output "Script start at line $($i + 1): $($lines[$i])"
    }
    if ($lines[$i] -match '</script>') {
        Write-Output "Script end at line $($i + 1): $($lines[$i])"
    }
}
