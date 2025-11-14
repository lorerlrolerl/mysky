#!/bin/bash
# Simple script to create app icon
# This creates a basic cloud/sun icon using ImageMagick (if available)
# Or provides instructions for manual creation

echo "Creating app icon for MySky..."

# Check if ImageMagick is available
if command -v convert &> /dev/null; then
    echo "Using ImageMagick to create icon..."

    # Create a simple cloud with sun icon
    # This is a basic example - you may want to use a design tool for better results

    SIZES=(48 72 96 144 192 512)

    for size in "${SIZES[@]}"; do
        # Create a simple cloud icon (you can replace this with a better design)
        convert -size ${size}x${size} xc:transparent \
            -fill "#4A90E2" \
            -draw "ellipse $((size/2)),$((size*3/5)) $((size/3)),$((size/4)) 0,360" \
            -draw "ellipse $((size*2/5)),$((size*3/5)) $((size/4)),$((size/5)) 0,360" \
            -draw "ellipse $((size*3/5)),$((size*3/5)) $((size/4)),$((size/5)) 0,360" \
            -fill "#FFD700" \
            -draw "circle $((size*3/4)),$((size/4)) $((size*3/4)),$((size/5))" \
            "icon_${size}.png"
    done

    echo "Icons created! Place them in android/app/src/main/res/mipmap-*/ directories"
    echo "48x48 -> mipmap-mdpi"
    echo "72x72 -> mipmap-hdpi"
    echo "96x96 -> mipmap-xhdpi"
    echo "144x144 -> mipmap-xxhdpi"
    echo "192x192 -> mipmap-xxxhdpi"
else
    echo "ImageMagick not found. Please install it or create icons manually."
    echo ""
    echo "Recommended: Use a design tool (Figma, GIMP, etc.) to create:"
    echo "- A cloud icon with a sun"
    echo "- Sizes: 48x48, 72x72, 96x96, 144x144, 192x192, 512x512"
    echo "- Save as PNG with transparency"
    echo "- Place in android/app/src/main/res/mipmap-*/ directories"
    echo ""
    echo "Or use an online icon generator:"
    echo "https://www.favicon-generator.org/"
    echo "https://icon.kitchen/"
fi

