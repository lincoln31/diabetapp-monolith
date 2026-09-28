# Genera los iconos de la app a partir del glifo "heart" de Ionicons (el mismo que usa
# `shared/components/ui/Header.tsx` para el logo de las pantallas de acceso), para que el
# icono del lanzador y el de las notificaciones coincidan con la marca ya usada dentro de la
# app, en vez del marcador de posición que trae Expo por defecto (spec fase 16-icono).
Add-Type -AssemblyName System.Drawing

$root = "C:\Users\PC\Desktop\Programacion\app_moviles\diabetapp-monolith\diabetapp-frontend"
$fontPath = "$root\node_modules\@expo\vector-icons\build\vendor\react-native-vector-icons\Fonts\Ionicons.ttf"
$outDir = "$root\assets\images"

$pfc = New-Object System.Drawing.Text.PrivateFontCollection
$pfc.AddFontFile($fontPath)
$family = $pfc.Families[0]

$primary = [System.Drawing.Color]::FromArgb(255, 0x1D, 0x4E, 0xD8)
$white = [System.Drawing.Color]::White

# heart-outline (62327 = 0xF377): icono principal, igual que Header.tsx
# heart (62314 = 0xF36A): relleno, para notificaciones (más legible a 24dp)
$heartOutline = [char]0xF377
$heartFilled = [char]0xF36A

function New-GlyphBitmap {
    param(
        [int]$Size,
        [object]$Background,   # $null para transparente ([object] admite $null; [Color] no)
        [System.Drawing.Color]$GlyphColor,
        [char]$Glyph,
        [double]$Coverage                    # fracción del ancho del lienzo que debe ocupar el glifo
    )

    $bmp = New-Object System.Drawing.Bitmap $Size, $Size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    if ($null -ne $Background) {
        $g.Clear([System.Drawing.Color]$Background)
    } else {
        $g.Clear([System.Drawing.Color]::Transparent)
    }

    $text = [string]$Glyph
    $brush = New-Object System.Drawing.SolidBrush $GlyphColor

    # Dos pasadas: medir con un tamaño de prueba y reescalar al tamaño de fuente que logre
    # el ancho deseado (las fuentes de iconos no llenan su "em square" de manera uniforme).
    $probeSize = 200.0
    $probeFont = New-Object System.Drawing.Font $family, $probeSize, ([System.Drawing.FontStyle]::Regular)
    $probeBounds = $g.MeasureString($text, $probeFont, [System.Drawing.PointF]::new(0,0), [System.Drawing.StringFormat]::GenericTypographic)
    $probeFont.Dispose()

    $targetWidth = $Size * $Coverage
    $fontSize = $probeSize * ($targetWidth / $probeBounds.Width)
    $font = New-Object System.Drawing.Font $family, $fontSize, ([System.Drawing.FontStyle]::Regular)
    $bounds = $g.MeasureString($text, $font, [System.Drawing.PointF]::new(0,0), [System.Drawing.StringFormat]::GenericTypographic)

    $x = ($Size - $bounds.Width) / 2
    $y = ($Size - $bounds.Height) / 2
    $g.DrawString($text, $font, $brush, [System.Drawing.PointF]::new($x, $y), [System.Drawing.StringFormat]::GenericTypographic)

    $font.Dispose(); $brush.Dispose(); $g.Dispose()
    return $bmp
}

# 1) Icono principal (iOS/Android/web): fondo azul sólido de marca + corazón blanco, igual
#    proporción que el logo de 64dp de Header.tsx (glifo ~28/64 = 44% del lienzo).
$icon = New-GlyphBitmap -Size 1024 -Background $primary -GlyphColor $white -Glyph $heartOutline -Coverage 0.46
$icon.Save("$outDir\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$icon.Dispose()

# 2) Icono adaptativo de Android: solo el primer plano, transparente, dentro de la zona seguro
#    (~66% del lienzo); el fondo #1D4ED8 se define aparte en app.json.
$adaptive = New-GlyphBitmap -Size 1024 -Background $null -GlyphColor $white -Glyph $heartOutline -Coverage 0.40
$adaptive.Save("$outDir\adaptive-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$adaptive.Dispose()

# 3) Favicon (web, poco usado en esta app): mismo diseño que el icono principal.
$favicon = New-GlyphBitmap -Size 48 -Background $primary -GlyphColor $white -Glyph $heartOutline -Coverage 0.46
$favicon.Save("$outDir\favicon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$favicon.Dispose()

# 4) Splash: la misma insignia circular que ya usa Header.tsx (círculo azul + corazón blanco)
#    sobre fondo blanco, para que la transición a la pantalla de acceso sea continua.
$splashSize = 480
$splash = New-Object System.Drawing.Bitmap $splashSize, $splashSize
$gs = [System.Drawing.Graphics]::FromImage($splash)
$gs.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$gs.Clear([System.Drawing.Color]::Transparent)
$brushPrimary = New-Object System.Drawing.SolidBrush $primary
$gs.FillEllipse($brushPrimary, 0, 0, $splashSize, $splashSize)
$gs.Dispose(); $brushPrimary.Dispose()
$heartOnSplash = New-GlyphBitmap -Size $splashSize -Background $null -GlyphColor $white -Glyph $heartOutline -Coverage 0.46
$gFinal = [System.Drawing.Graphics]::FromImage($splash)
$gFinal.DrawImage($heartOnSplash, 0, 0)
$gFinal.Dispose()
$heartOnSplash.Dispose()
$splash.Save("$outDir\splash-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$splash.Dispose()

# 5) Icono de notificaciones (Android): SOLO silueta blanca sobre transparente, sin color ni
#    fondo (Android lo pinta él mismo con `color` del plugin) — el relleno es más legible que
#    el contorno a 24dp.
$notif = New-GlyphBitmap -Size 432 -Background $null -GlyphColor $white -Glyph $heartFilled -Coverage 0.62
$notif.Save("$outDir\notification-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$notif.Dispose()

Write-Output "Listo: icon.png, adaptive-icon.png, favicon.png, splash-icon.png, notification-icon.png"
