#!/bin/bash
# Quick build script that avoids importing heavy dependencies

set -e

echo "Building cert-framework 0.3.1..."
echo ""

# Clean
echo "Cleaning..."
rm -rf dist/ build/ *.egg-info cert_framework.egg-info

# Create dist directory
mkdir -p dist

# Build source distribution only (no wheel to avoid import issues)
echo "Building source distribution..."
python3 setup.py sdist --dist-dir=dist 2>&1 | grep -v "warning"

echo ""
echo "Build complete!"
ls -lh dist/

echo ""
echo "Package size:"
du -sh dist/*

echo ""
echo "Ready to upload! Run:"
echo "  twine upload dist/*"
