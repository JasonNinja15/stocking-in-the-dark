# Tiny static file server for local testing: powershell -File tools/serve.ps1 [port]
param([int]$Port=8137)
$root=Split-Path -Parent $PSScriptRoot
$l=New-Object System.Net.HttpListener;$l.Prefixes.Add("http://localhost:$Port/");$l.Start()
Write-Host "Serving $root on http://localhost:$Port/"
$types=@{'.html'='text/html; charset=utf-8';'.js'='text/javascript';'.css'='text/css';'.png'='image/png';'.json'='application/json'}
while($l.IsListening){$c=$l.GetContext();$p=[Uri]::UnescapeDataString($c.Request.Url.AbsolutePath.TrimStart('/'));if(!$p){$p='stocking-in-the-dark.html'}
  $f=Join-Path $root $p
  if(Test-Path $f -PathType Leaf){$b=[IO.File]::ReadAllBytes($f);$e=[IO.Path]::GetExtension($f);$c.Response.ContentType=$(if($types[$e]){$types[$e]}else{'application/octet-stream'});$c.Response.Headers.Add('Cache-Control','no-store');$c.Response.OutputStream.Write($b,0,$b.Length)}else{$c.Response.StatusCode=404}
  $c.Response.Close()}
