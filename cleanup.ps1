$p='c:\VSCode\PostOffice\ui\dashboard.html'
$content=Get-Content $p
$start=$content.IndexOf('<!-- Report summary & charts (moved inside panel) -->')
$end=$content.IndexOf('<!-- Staff Panel -->')
if($start -ge 0 -and $end -gt $start){
    $new=$content[0..($start-1)] + $content[$end..($content.Length-1)]
    $new | Set-Content $p
    Write-Output 'removed duplicate section'
} else {
    Write-Output 'did not find markers'
}