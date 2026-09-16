$bytes = [System.IO.File]::ReadAllBytes('D:\AntiGravity\Nano_BookShelf\public_html\admin_preview.html')
$content = [System.Text.Encoding]::UTF8.GetString($bytes)
$lines = $content.Split("`n")

Write-Output "Checking lines after 2840 for non-standard chars:"
for ($i = 2840; $i -lt $lines.Length; $i++) {
    $line = $lines[$i]
    $chars = $line.ToCharArray()
    foreach ($c in $chars) {
        $code = [int][char]$c
        if ($code -lt 32 -and $code -ne 9 -and $code -ne 10 -and $code -ne 13) {
            Write-Output ("Found control char 0x{0:X2} at line {1}" -f $code, ($i + 1))
        }
    }
}
Write-Output "Done check!"
