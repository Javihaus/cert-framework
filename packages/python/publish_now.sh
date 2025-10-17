#!/bin/bash
set -e

echo "======================================"
echo "CERT Framework - PyPI Publishing"
echo "Version: 0.2.0"
echo "======================================"
echo ""

# Step 1: Build the package
echo "Step 1: Building distributions..."
rm -rf dist/ build/ *.egg-info 2>/dev/null || true
python3 -m build
echo "✓ Built distributions"
echo ""

# Step 2: List what was built
echo "Built files:"
ls -lh dist/
echo ""

# Step 3: Test in clean environment
echo "Step 2: Testing built package in clean environment..."
python3 -m venv /tmp/test-cert-build
source /tmp/test-cert-build/bin/activate

echo "Installing from wheel..."
pip install --quiet dist/cert_framework-0.2.0-py3-none-any.whl

echo "Running import test..."
python3 -c "from cert import compare; print('✓ Import successful')"

echo "Running basic test..."
python3 -c "from cert import compare; result = compare('hello', 'hello'); assert result.matched; print('✓ Basic test passed')"

echo "Checking version..."
python3 -c "from cert import __version__; print(f'✓ Version: {__version__}')"

deactivate
rm -rf /tmp/test-cert-build
echo "✓ Package tests passed"
echo ""

# Step 4: Check for PyPI credentials
echo "Step 3: Checking PyPI credentials..."
if [ ! -f ~/.pypirc ]; then
    echo "⚠️  No ~/.pypirc found"
    echo ""
    echo "You need to set up PyPI credentials first:"
    echo ""
    echo "1. Get API tokens:"
    echo "   - TestPyPI: https://test.pypi.org/manage/account/token/"
    echo "   - PyPI: https://pypi.org/manage/account/token/"
    echo ""
    echo "2. Create ~/.pypirc with:"
    echo ""
    cat << 'PYPIRC'
[distutils]
index-servers =
    pypi
    testpypi

[testpypi]
repository = https://test.pypi.org/legacy/
username = __token__
password = pypi-YOUR_TESTPYPI_TOKEN

[pypi]
username = __token__
password = pypi-YOUR_PYPI_TOKEN
PYPIRC
    echo ""
    echo "3. Set permissions: chmod 600 ~/.pypirc"
    echo ""
    exit 1
fi

echo "✓ Found ~/.pypirc"
echo ""

# Step 5: Upload to TestPyPI
echo "Step 4: Uploading to TestPyPI (staging)..."
echo ""
echo "This will upload to TEST PyPI first for validation."
read -p "Press Enter to continue or Ctrl+C to cancel..."
echo ""

python3 -m twine upload --repository testpypi dist/*
echo "✓ Uploaded to TestPyPI"
echo ""

# Step 6: Test from TestPyPI
echo "Step 5: Testing install from TestPyPI..."
echo ""
echo "Run these commands in a new terminal to test:"
echo ""
echo "  python3 -m venv /tmp/test-testpypi"
echo "  source /tmp/test-testpypi/bin/activate"
echo "  pip install --index-url https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple/ cert-framework"
echo "  python3 -c 'from cert import compare; print(\"✓ Works!\")'"
echo "  deactivate"
echo ""
echo "Package on TestPyPI: https://test.pypi.org/project/cert-framework/"
echo ""
read -p "After testing, press Enter to upload to PRODUCTION PyPI or Ctrl+C to stop..."
echo ""

# Step 7: Upload to Production PyPI
echo "Step 6: Uploading to PRODUCTION PyPI..."
echo ""
echo "⚠️  WARNING: This will publish to the REAL PyPI!"
echo "⚠️  The package will be public and the version is immutable!"
echo ""
read -p "Type 'YES' to confirm upload to production PyPI: " confirm

if [ "$confirm" != "YES" ]; then
    echo "Cancelled. Package NOT uploaded to production."
    exit 1
fi

python3 -m twine upload dist/*
echo ""
echo "✓ Uploaded to PyPI"
echo ""

# Step 8: Verify
echo "Step 7: Verifying production install..."
echo ""
echo "Run these commands to verify:"
echo ""
echo "  python3 -m venv /tmp/test-pypi"
echo "  source /tmp/test-pypi/bin/activate"
echo "  pip install cert-framework"
echo "  python3 -c 'from cert import compare; print(\"✓ Production install works!\")'"
echo "  deactivate"
echo ""
echo "Package on PyPI: https://pypi.org/project/cert-framework/"
echo ""
read -p "After verifying, press Enter to create git tag..."

# Step 9: Git tag
echo ""
echo "Step 8: Creating git tag..."
git tag v0.2.0
git push origin v0.2.0
echo "✓ Tagged v0.2.0 and pushed"
echo ""

echo "======================================"
echo "🎉 Release 0.2.0 Complete!"
echo "======================================"
echo ""
echo "Package is now available at:"
echo "  https://pypi.org/project/cert-framework/0.2.0/"
echo ""
echo "Users can install with:"
echo "  pip install cert-framework"
echo ""
