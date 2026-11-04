# Draws the app icons (icon-192.png, icon-512.png and maskable versions) from the same shapes as icon.svg.
# powershell -File tools/make-icons.ps1
Add-Type -AssemblyName System.Drawing
$root=Split-Path -Parent $PSScriptRoot
function Icon([int]$size,[bool]$mask,[string]$out){
  $bmp=New-Object System.Drawing.Bitmap $size,$size;$g=[System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode='AntiAlias';$g.Clear([System.Drawing.Color]::Transparent)
  $k=$size/64.0;$sc=$(if($mask){.78}else{1.0});$off=32*(1-$sc)
  $P={param($pts)$a=@();for($i=0;$i -lt $pts.Count;$i+=2){$a+=New-Object System.Drawing.PointF (($pts[$i]*$sc+$off)*$k),(($pts[$i+1]*$sc+$off)*$k)};,$a}
  $B={param($hex,$al=255)New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb($al,[Convert]::ToInt32($hex.Substring(0,2),16),[Convert]::ToInt32($hex.Substring(2,2),16),[Convert]::ToInt32($hex.Substring(4,2),16)))}
  $bg=& $B '0b0a09'
  if($mask){$g.FillRectangle($bg,0,0,$size,$size)}else{$r=12*$k;$gp=New-Object System.Drawing.Drawing2D.GraphicsPath;$d=2*$r
    $gp.AddArc(0,0,$d,$d,180,90);$gp.AddArc($size-$d,0,$d,$d,270,90);$gp.AddArc($size-$d,$size-$d,$d,$d,0,90);$gp.AddArc(0,$size-$d,$d,$d,90,90);$gp.CloseFigure();$g.FillPath($bg,$gp)}
  # the flashlight beam, fading from the top-left corner
  $beam=New-Object System.Drawing.Drawing2D.GraphicsPath;$beam.AddPolygon((& $P @(4,4,34,4,60,46,18,60)))
  $pb=New-Object System.Drawing.Drawing2D.PathGradientBrush $beam;$pb.CenterPoint=New-Object System.Drawing.PointF ((14*$sc+$off)*$k),((8*$sc+$off)*$k)
  $pb.CenterColor=[System.Drawing.Color]::FromArgb(130,243,220,154);$pb.SurroundColors=@([System.Drawing.Color]::FromArgb(0,243,220,154));$g.FillPath($pb,$beam)
  $g.FillPolygon((& $B '1a1006'),(& $P @(12,30,32,22,52,30,32,38)))
  $g.FillPolygon((& $B 'b8803f'),(& $P @(12,30,32,38,32,58,12,50)))
  $g.FillPolygon((& $B '8a5a28'),(& $P @(52,30,32,38,32,58,52,50)))
  $g.FillPolygon((& $B 'c99352'),(& $P @(12,30,4,24,24,17,32,22)))
  $g.FillPolygon((& $B '9c6a33'),(& $P @(52,30,60,24,40,17,32,22)))
  $g.FillPolygon((& $B 'd8b98a' 140),(& $P @(19,39.5,25,42,25,52,19,49.5)))
  foreach($e in @(@(26.5,2.6,'ff2a1a'),@(36.5,2.6,'ff2a1a'),@(26.5,1,'ffd0c0'),@(36.5,1,'ffd0c0'))){$cx=($e[0]*$sc+$off)*$k;$cy=(29.5*$sc+$off)*$k;$rr=$e[1]*$sc*$k;$g.FillEllipse((& $B $e[2]),$cx-$rr,$cy-$rr,2*$rr,2*$rr)}
  $g.Dispose();$bmp.Save((Join-Path $root $out),[System.Drawing.Imaging.ImageFormat]::Png);$bmp.Dispose()}
Icon 192 $false 'icon-192.png';Icon 512 $false 'icon-512.png';Icon 512 $true 'icon-maskable-512.png';Icon 180 $true 'apple-touch-icon.png'
Write-Host 'icons written'
