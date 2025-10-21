#!/bin/bash
# Build and ship CERT Framework v0.3.1 to PyPI

set -e  # Exit on error

echo "=================================================="
echo "Building CERT Framework v0.3.1 for PyPI"
echo "=================================================="
echo ""

# Clean old builds
echo "Step 1: Cleaning old build artifacts..."
rm -rf dist/ build/ *.egg-info cert_framework.egg-info
echo "✓ Clean complete"
echo ""

# Build package
echo "Step 2: Building package..."
python3 -m build || python3 setup.py sdist bdist_wheel
echo "✓ Build complete"
echo ""

# List built files
echo "Step 3: Verifying build..."
ls -lh dist/
echo ""

# Check version
echo "Step 4: Verifying version..."
python3 -c "from cert import __version__; print(f'Package version: {__version__}')"
echo ""

# Upload to PyPI
echo "Step 5: Uploading to PyPI..."
echo "This will prompt for PyPI credentials..."
twine upload dist/*

echo ""
echo "=================================================="
echo "✅ CERT Framework v0.3.1 shipped to PyPI!"
echo "=================================================="
echo ""
echo "Verify at: https://pypi.org/project/cert-framework/"
