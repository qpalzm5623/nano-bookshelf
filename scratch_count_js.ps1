$c = [System.IO.File]::ReadAllText('D:\AntiGravity\Nano_BookShelf\public_html\admin_preview.js', [System.Text.Encoding]::UTF8)
$opens = ($c.ToCharArray() | Where-Object { $_ -eq '{' }).Count
$closes = ($c.ToCharArray() | Where-Object { $_ -eq '}' }).Count
Write-Output "open { = $opens, close } = $closes"
