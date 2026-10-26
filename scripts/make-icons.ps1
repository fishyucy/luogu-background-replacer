# 生成扩展图标（无需第三方依赖，Windows PowerShell + System.Drawing）
Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $root "icons"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function New-RoundedPath {
  param([double]$X, [double]$Y, [double]$W, [double]$H, [double]$R)

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $R * 2
  $path.AddArc([float]$X, [float]$Y, [float]$d, [float]$d, 180, 90)
  $path.AddArc([float]($X + $W - $d), [float]$Y, [float]$d, [float]$d, 270, 90)
  $path.AddArc([float]($X + $W - $d), [float]($Y + $H - $d), [float]$d, [float]$d, 0, 90)
  $path.AddArc([float]$X, [float]($Y + $H - $d), [float]$d, [float]$d, 90, 90)
  $path.CloseFigure()
  return $path
}

# ---------- 先画一张 512x512 母图 ----------
$master = New-Object System.Drawing.Bitmap 512, 512
$g = [System.Drawing.Graphics]::FromImage($master)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.Clear([System.Drawing.Color]::Transparent)

# 圆角渐变底
$bgPath = New-RoundedPath 0 0 512 512 116
$bgRect = New-Object System.Drawing.RectangleF 0, 0, 512, 512
$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  $bgRect,
  [System.Drawing.Color]::FromArgb(255, 72, 132, 247),
  [System.Drawing.Color]::FromArgb(255, 147, 86, 247),
  45.0
)
$g.FillPath($bgBrush, $bgPath)

# 白色相框
$cardPath = New-RoundedPath 74 96 364 320 54
$white = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
$g.FillPath($white, $cardPath)

# 相框内部
$g.SetClip($cardPath, [System.Drawing.Drawing2D.CombineMode]::Intersect)

# 太阳
$sunBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 193, 82))
$g.FillEllipse($sunBrush, 268, 138, 86, 86)

# 远山
$backPts = [System.Drawing.PointF[]]@(
  [System.Drawing.PointF]::new(44, 430),
  [System.Drawing.PointF]::new(196, 224),
  [System.Drawing.PointF]::new(360, 430)
)
$backRect = New-Object System.Drawing.RectangleF 44, 224, 316, 206
$backBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  $backRect,
  [System.Drawing.Color]::FromArgb(255, 138, 183, 255),
  [System.Drawing.Color]::FromArgb(255, 84, 128, 235),
  90.0
)
$g.FillPolygon($backBrush, $backPts)

# 近山
$frontPts = [System.Drawing.PointF[]]@(
  [System.Drawing.PointF]::new(176, 430),
  [System.Drawing.PointF]::new(318, 258),
  [System.Drawing.PointF]::new(470, 430)
)
$frontRect = New-Object System.Drawing.RectangleF 176, 258, 294, 172
$frontBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  $frontRect,
  [System.Drawing.Color]::FromArgb(255, 104, 118, 245),
  [System.Drawing.Color]::FromArgb(255, 74, 86, 204),
  90.0
)
$g.FillPolygon($frontBrush, $frontPts)

$g.ResetClip()

# ---------- 缩放到各尺寸 ----------
$sizes = @(16, 32, 48, 128)
foreach ($size in $sizes) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $sg = [System.Drawing.Graphics]::FromImage($bmp)
  $sg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $sg.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $sg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $sg.Clear([System.Drawing.Color]::Transparent)

  $dest = New-Object System.Drawing.Rectangle 0, 0, $size, $size
  $src = New-Object System.Drawing.Rectangle 0, 0, 512, 512
  $sg.DrawImage($master, $dest, $src, [System.Drawing.GraphicsUnit]::Pixel)

  $file = Join-Path $outDir ("icon{0}.png" -f $size)
  $bmp.Save($file, [System.Drawing.Imaging.ImageFormat]::Png)
  $sg.Dispose()
  $bmp.Dispose()
  Write-Output ("wrote {0}" -f $file)
}

$g.Dispose()
$master.Dispose()
