#!/bin/bash
# Regenerate Android app icons from SVG

echo "🎨 Regenerating Android app icons..."

cd "$(dirname "$0")/.."

# Check for required tools
if command -v rsvg-convert &> /dev/null; then
    echo "Using rsvg-convert..."
    CONVERT_CMD="rsvg-convert"
elif command -v inkscape &> /dev/null; then
    echo "Using Inkscape..."
    CONVERT_CMD="inkscape"
elif python3 -c "import cairosvg" 2>/dev/null; then
    echo "Using Python cairosvg..."
    CONVERT_CMD="python"
else
    echo "❌ No suitable tool found. Please install one of:"
    echo "   - librsvg2-bin (rsvg-convert): sudo apt install librsvg2-bin"
    echo "   - inkscape: sudo apt install inkscape"
    echo "   - python3-cairosvg: sudo apt install python3-cairosvg"
    echo ""
    echo "Or use an online tool: https://icon.kitchen/"
    exit 1
fi

SVG_FILE="assets/icon.svg"
if [ ! -f "$SVG_FILE" ]; then
    echo "❌ SVG file not found: $SVG_FILE"
    exit 1
fi

# Android mipmap sizes (density: size in dp)
# mdpi: 48x48, hdpi: 72x72, xhdpi: 96x96, xxhdpi: 144x144, xxxhdpi: 192x192
declare -A SIZES=(
    ["mdpi"]="48"
    ["hdpi"]="72"
    ["xhdpi"]="96"
    ["xxhdpi"]="144"
    ["xxxhdpi"]="192"
)

# Generate icons
for density in "${!SIZES[@]}"; do
    size="${SIZES[$density]}"
    output_dir="android/app/src/main/res/mipmap-${density}"

    mkdir -p "$output_dir"

    echo "Generating ${density} (${size}x${size})..."

    if [ "$CONVERT_CMD" = "rsvg-convert" ]; then
        rsvg-convert -w "$size" -h "$size" "$SVG_FILE" -o "${output_dir}/ic_launcher.png"
        rsvg-convert -w "$size" -h "$size" "$SVG_FILE" -o "${output_dir}/ic_launcher_round.png"
    elif [ "$CONVERT_CMD" = "inkscape" ]; then
        inkscape -w "$size" -h "$size" "$SVG_FILE" -o "${output_dir}/ic_launcher.png"
        inkscape -w "$size" -h "$size" "$SVG_FILE" -o "${output_dir}/ic_launcher_round.png"
    elif [ "$CONVERT_CMD" = "python" ]; then
        python3 << EOF
import cairosvg
cairosvg.svg2png(url="$SVG_FILE", write_to="${output_dir}/ic_launcher.png", output_width=$size, output_height=$size)
cairosvg.svg2png(url="$SVG_FILE", write_to="${output_dir}/ic_launcher_round.png", output_width=$size, output_height=$size)
EOF
    fi
done

echo "✅ Icons regenerated!"
echo ""
echo "Next steps:"
echo "1. Clean and rebuild: npm run clean && npm run build:apk"
echo "2. Uninstall old app: adb uninstall com.mysky"
echo "3. Install new APK: adb install -r android/apk/MySky-debug-*.apk"

