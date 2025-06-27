#!/bin/bash

# Exit on error
set -e

# --- Clean up old builds ---
echo "Cleaning up old builds..."
rm -rf build dist
mkdir -p dist

# --- Define files and directories to be packaged ---
# Putting directories in a separate array to handle them correctly
FILES=(
    "burjanfannify.js"
    "settings.html"
    "settings.js"
    "settings.css"
    "icon.png"
    "manifest.json" 
)

DIRS=(
    "images"
    "lib"
)

# --- Build for Firefox (Manifest V2) ---
echo "Building for Firefox..."
BUILD_DIR="build/firefox"
mkdir -p "$BUILD_DIR"

# Copy files
cp "${FILES[@]}" "$BUILD_DIR/"

# Copy directories
for DIR in "${DIRS[@]}"; do
    cp -r "$DIR" "$BUILD_DIR/"
done

(cd "$BUILD_DIR" && zip -r -Z deflate ../../dist/MrBeastify-Youtube-firefox.xpi .)

echo "Firefox build created at dist/MrBeastify-Youtube-firefox.xpi"


# --- Build for Chrome (Manifest V3) ---
echo "Building for Chrome..."
# We can reuse the same files, just need to swap the manifest
CHROME_BUILD_DIR="build/chrome"
mkdir -p "$CHROME_BUILD_DIR"

# Copy files from firefox build
cp -r "$BUILD_DIR/"* "$CHROME_BUILD_DIR/"

# Overwrite with the correct manifest
cp "manifest v3.json" "$CHROME_BUILD_DIR/manifest.json"

(cd "$CHROME_BUILD_DIR" && zip -r -Z deflate ../../dist/burjanfannify-Youtube-chrome.zip .)

echo "Chrome build created at dist/burjanfannify-Youtube-chrome.zip"


# --- Clean up ---
rm -rf build

echo "Build process complete!" 