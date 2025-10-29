#!/bin/bash
set -e

VERSION=$1

if [ -z "$VERSION" ]; then
    echo "Usage: ./scripts/release.sh 4.0.0"
    exit 1
fi

echo "======================================"
echo "CERT Framework v4.0 Release Process"
echo "Version: $VERSION"
echo "======================================"
echo ""

# Step 1: Update version in multiple places
echo "Step 1: Updating version..."
sed -i '' "s/__version__ = .*/__version__ = \"$VERSION\"/" cert/__init__.py
sed -i '' "s/version = .*/version = \"$VERSION\"/" pyproject.toml
echo "✓ Version updated to $VERSION in cert/__init__.py and pyproject.toml"
echo ""

# Step 2: Clean and build
echo "Step 2: Building distributions..."
rm -rf dist/ build/ *.egg-info
python3 -m build
echo "✓ Built distributions"
echo ""

# Step 3: List built files
echo "Built files:"
ls -lh dist/
echo ""

# Step 4: Test core package (zero dependencies)
echo "Step 3: Testing core package (zero dependencies)..."
echo "Creating clean test environment..."
python3 -m venv /tmp/test-cert-core-$VERSION
source /tmp/test-cert-core-$VERSION/bin/activate

echo "Installing core from wheel..."
pip install --quiet dist/cert_framework-${VERSION}-py3-none-any.whl

echo "Running core tests..."
python3 -c "from cert import trace; print('✓ Core import successful (zero dependencies)')"
python3 -c "from cert import __version__; assert __version__ == '$VERSION'; print(f'✓ Version correct: {__version__}')"
python3 -c "
from cert import trace

@trace(log_path='/tmp/test_trace.jsonl')
def test_func():
    return {'context': 'test', 'answer': 'test'}

test_func()
print('✓ Basic trace test passed')
"

deactivate
rm -rf /tmp/test-cert-core-$VERSION
echo "✓ Core package tests passed"
echo ""

# Step 5: Test with evaluation extras
echo "Step 4: Testing with [evaluation] extras..."
echo "Creating clean test environment..."
python3 -m venv /tmp/test-cert-eval-$VERSION
source /tmp/test-cert-eval-$VERSION/bin/activate

echo "Installing with [evaluation] extras from wheel..."
pip install --quiet "dist/cert_framework-${VERSION}-py3-none-any.whl[evaluation]"

echo "Running evaluation tests..."
python3 -c "from cert import trace, measure; print('✓ Evaluation imports successful')"
python3 -c "from cert.evaluation import Evaluator; print('✓ Evaluator import successful')"

deactivate
rm -rf /tmp/test-cert-eval-$VERSION
echo "✓ Evaluation extras tests passed"
echo ""

# Step 6: Upload to TestPyPI
echo "Step 5: Uploading to TestPyPI..."
read -p "Press Enter to upload to TestPyPI (or Ctrl+C to cancel)..."
python3 -m twine upload --repository testpypi dist/*
echo "✓ Uploaded to TestPyPI"
echo ""

# Step 7: Test install from TestPyPI
echo "Step 6: Testing install from TestPyPI..."
echo "Run these commands to test:"
echo ""
echo "# Test core (zero dependencies):"
echo "  python3 -m venv /tmp/test-from-testpypi"
echo "  source /tmp/test-from-testpypi/bin/activate"
echo "  pip install --index-url https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple/ cert-framework"
echo "  python3 -c 'from cert import trace; print(\"✓ Core works\")'"
echo "  deactivate"
echo ""
echo "# Test with evaluation:"
echo "  python3 -m venv /tmp/test-eval-testpypi"
echo "  source /tmp/test-eval-testpypi/bin/activate"
echo "  pip install --index-url https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple/ cert-framework[evaluation]"
echo "  python3 -c 'from cert.evaluation import Evaluator; print(\"✓ Evaluation works\")'"
echo "  deactivate"
echo ""
read -p "Press Enter after testing TestPyPI install to continue..."

# Step 8: Upload to production PyPI
echo "Step 7: Uploading to production PyPI..."
read -p "Press Enter to upload to PRODUCTION PyPI (or Ctrl+C to cancel)..."
python3 -m twine upload dist/*
echo "✓ Uploaded to PyPI"
echo ""

# Step 9: Verify production install
echo "Step 8: Verifying production install..."
echo "Run these commands to verify:"
echo ""
echo "# Test core:"
echo "  python3 -m venv /tmp/test-from-pypi"
echo "  source /tmp/test-from-pypi/bin/activate"
echo "  pip install cert-framework"
echo "  python3 -c 'from cert import trace; print(\"✓ Core install works\")'"
echo "  cert --version"
echo "  deactivate"
echo ""
echo "# Test with extras:"
echo "  python3 -m venv /tmp/test-extras-pypi"
echo "  source /tmp/test-extras-pypi/bin/activate"
echo "  pip install cert-framework[evaluation,cli]"
echo "  python3 -c 'from cert.evaluation import Evaluator; print(\"✓ Extras work\")'"
echo "  cert --help"
echo "  deactivate"
echo ""
read -p "Press Enter after testing PyPI install to continue..."

# Step 10: Tag the release
echo "Step 9: Tagging the release..."
git add cert/__init__.py pyproject.toml
git commit -m "Release version $VERSION"
git tag "v$VERSION"
git push origin master
git push origin "v$VERSION"
echo "✓ Tagged and pushed v$VERSION"
echo ""

echo "======================================"
echo "Release $VERSION Complete!"
echo "======================================"
echo ""
echo "Package is now available at:"
echo "  https://pypi.org/project/cert-framework/$VERSION/"
echo ""
echo "Users can install with:"
echo "  pip install cert-framework              # Core only (5MB)"
echo "  pip install cert-framework[evaluation]  # With evaluation"
echo "  pip install cert-framework[cli]         # With CLI tools"
echo "  pip install cert-framework[all]         # Everything"
echo ""
echo "Next steps:"
echo "  1. Create GitHub release at https://github.com/Javihaus/cert-framework/releases/new"
echo "  2. Attach CHANGELOG.md content to release notes"
echo "  3. Announce on social media / community channels"
echo ""
