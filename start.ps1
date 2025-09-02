$extensionDir = $PWD.Path
$manifestFile = Join-Path -Path $extensionDir -ChildPath "manifest.json"

$manifest = @{
    version = "2.0.7"
    update = ""
    files = @{}
}

function Get-FileHashSHA1($filePath) {
    $stream = [System.IO.File]::OpenRead($filePath)
    $hash = [System.Security.Cryptography.SHA1]::Create().ComputeHash($stream)
    $stream.Close()
    return [System.BitConverter]::ToString($hash).Replace("-","").ToLower()
}

Get-ChildItem -Path $extensionDir -File -Recurse | Where-Object {
    $_.FullName -ne $manifestFile -and $_.FullName -notlike "*\.git\*"
} | ForEach-Object {
    $relativePath = $_.FullName.Substring($extensionDir.Length + 1).Replace('\','/')
    $hash = Get-FileHashSHA1 $_.FullName
    $manifest.files[$relativePath] = $hash
}

[System.IO.File]::WriteAllText(
    $manifestFile,
    ($manifest | ConvertTo-Json -Depth 10),
    [System.Text.Encoding]::UTF8
)

Write-Host "manifest.json generated: $manifestFile"