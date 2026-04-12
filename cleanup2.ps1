$p='c:\VSCode\PostOffice\ui\dashboard.html'
$content=Get-Content $p
$startLine = ($content | Select-String '<!-- Report summary' | Select-Object -First 1).LineNumber
$endLine = ($content | Select-String '<!-- Staff Panel -->' | Select-Object -First 1).LineNumber
if($startLine -and $endLine -and $endLine -gt $startLine){
    $new=$content[0..($startLine-2)] + $content[($endLine-1)..($content.Length-1)]
    $new | Set-Content $p
    Write-Output "removed lines $startLine through $endLine-1"
} else {
    Write-Output 'markers not located properly'
}