$reader = [System.IO.File]::OpenText('d:\AntiGravity\Nano_BookShelf\backups\nanobook_backup_20261026_140403.sql')
$found = $false
while (($line = $reader.ReadLine()) -ne $null) {
    if ($line -like '*CREATE TABLE `tb_user`*') {
        $found = $true
    }
    if ($found) {
        Write-Output $line
        if ($line.Trim().EndsWith(';')) {
            break
        }
    }
}
$reader.Close()
