$stream = [System.IO.File]::OpenRead('d:\AntiGravity\Nano_BookShelf\backups\nanobook_backup_20261026_140403.sql')
$reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)

# "1차연구회"
$t1 = [System.Text.Encoding]::UTF8.GetString([byte[]]@(0x31, 0xec, 0xb0, 0xa8, 0xec, 0x97, 0xb0, 0xea, 0xb5, 0xac, 0xed, 0x9a, 0x8c))
# "공부의기억"
$t2 = [System.Text.Encoding]::UTF8.GetString([byte[]]@(0xea, 0xb3, 0xb5, 0xeb, 0xb6, 0x80, 0xec, 0x9d, 0x98, 0xea, 0xb8, 0xb0, 0xec, 0x96, 0xb5))
# "밀양삼문"
$t3 = [System.Text.Encoding]::UTF8.GetString([byte[]]@(0xeb, 0xb0, 0x80, 0xec, 0x96, 0x91, 0xec, 0x82, 0xbc, 0xeb, 0xac, 0xb8))

$targets = @($t1, $t2, $t3)

while (($line = $reader.ReadLine()) -ne $null) {
    if ($line.StartsWith('INSERT INTO `tb_user`')) {
        foreach ($t in $targets) {
            $idx = 0
            while (($idx = $line.IndexOf($t, $idx)) -ge 0) {
                $start = [Math]::Max(0, $idx - 60)
                $len = [Math]::Min($line.Length - $start, 280)
                [Console]::WriteLine("=== FOUND: $t ===")
                [Console]::WriteLine($line.Substring($start, $len))
                $idx += $t.Length
            }
        }
    }
}
$reader.Close()
$stream.Close()
