Add-Type -AssemblyName System.Drawing

$destDir = "d:\AntiGravity\Nano_BookShelf\public_html\resources\images\icons"
if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
}

$symPath = "d:\AntiGravity\Nano_BookShelf\public_html\resources\images\common\symbol.png"
if (-not (Test-Path $symPath)) {
    $symPath = "d:\AntiGravity\Nano_BookShelf\public_html\resources\images\common\logo.png"
}
$sym = [System.Drawing.Image]::FromFile($symPath)

$sizes = @(72, 96, 128, 144, 152, 192, 384, 512)

foreach ($s in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($s, $s)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Background: warm elegant cream
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 248, 246, 240))
    $g.FillRectangle($bgBrush, 0, 0, $s, $s)
    $bgBrush.Dispose()

    # Padding
    $pad = [int]($s * 0.16)
    $targetW = $s - ($pad * 2)
    $targetH = $s - ($pad * 2)

    $ratio = [Math]::Min($targetW / $sym.Width, $targetH / $sym.Height)
    $drawW = [int]($sym.Width * $ratio)
    $drawH = [int]($sym.Height * $ratio)
    $drawX = [int](($s - $drawW) / 2)
    $drawY = [int](($s - $drawH) / 2)

    $g.DrawImage($sym, $drawX, $drawY, $drawW, $drawH)
    $g.Dispose()

    $bmp.Save("$destDir\icon-$s.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Generated icon-$s.png"
}

# Apple Touch Icon 180x180
$s = 180
$bmp = New-Object System.Drawing.Bitmap($s, $s)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 248, 246, 240))
$g.FillRectangle($bgBrush, 0, 0, $s, $s)
$bgBrush.Dispose()
$pad = [int]($s * 0.16)
$ratio = [Math]::Min(($s - $pad * 2) / $sym.Width, ($s - $pad * 2) / $sym.Height)
$drawW = [int]($sym.Width * $ratio)
$drawH = [int]($sym.Height * $ratio)
$g.DrawImage($sym, [int](($s - $drawW) / 2), [int](($s - $drawH) / 2), $drawW, $drawH)
$g.Dispose()
$bmp.Save("$destDir\apple-touch-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "Generated apple-touch-icon.png"

$sym.Dispose()
