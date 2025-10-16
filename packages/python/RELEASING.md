# Releasing CERT Framework to PyPI

This document describes the professional release process for publishing to PyPI.

## Prerequisites

### 1. Install Build Tools

```bash
pip install --upgrade build twine
```

### 2. Set Up PyPI Credentials

Create `~/.pypirc`:

```ini
[distutils]
index-servers =
    pypi
    testpypi

[testpypi]
repository = https://test.pypi.org/legacy/
username = __token__
password = pypi-YOUR_TESTPYPI_TOKEN_HERE

[pypi]
username = __token__
password = pypi-YOUR_PYPI_TOKEN_HERE
```

Set permissions:

```bash
chmod 600 ~/.pypirc
```

### 3. Get API Tokens

- **TestPyPI**: https://test.pypi.org/manage/account/token/
- **PyPI**: https://pypi.org/manage/account/token/

## Release Process

### Automated Release (Recommended)

```bash
cd packages/python
./scripts/release.sh 0.2.0
```

The script will:
1. Update version in `cert/__init__.py`
2. Clean old builds
3. Build source distribution and wheel
4. Test the built package in a clean venv
5. Upload to TestPyPI
6. Prompt you to test TestPyPI install
7. Upload to production PyPI
8. Prompt you to test PyPI install
9. Create git tag and push

### Manual Release (Step by Step)

#### Step 1: Update Version

Edit `cert/__init__.py`:

```python
__version__ = "0.2.0"  # Update this
```

#### Step 2: Clean and Build

```bash
cd packages/python
rm -rf dist/ build/ *.egg-info
python3 -m build
```

This creates:
- `dist/cert-framework-0.2.0.tar.gz` (source)
- `dist/cert_framework-0.2.0-py3-none-any.whl` (wheel)

#### Step 3: Test Built Package

**CRITICAL**: Always test from the wheel, not from source!

```bash
# Create clean test environment
python3 -m venv /tmp/test-cert
source /tmp/test-cert/bin/activate

# Install from wheel
pip install dist/cert_framework-0.2.0-py3-none-any.whl

# Test imports
python3 -c "from cert import compare; print(compare.__doc__)"

# Run basic test
python3 -c "
from cert import compare
result = compare('hello', 'hello')
assert result.matched
print('✓ Basic test passed')
"

# Check version
python3 -c "from cert import __version__; print(f'Version: {__version__}')"

# Clean up
deactivate
rm -rf /tmp/test-cert
```

If this fails, **DO NOT UPLOAD**. Fix the issues first.

#### Step 4: Upload to TestPyPI

```bash
python3 -m twine upload --repository testpypi dist/*
```

#### Step 5: Test Install from TestPyPI

```bash
# Create clean environment
python3 -m venv /tmp/test-from-testpypi
source /tmp/test-from-testpypi/bin/activate

# Install from TestPyPI
# Note: --extra-index-url is needed because TestPyPI doesn't have dependencies
pip install --index-url https://test.pypi.org/simple/ \
    --extra-index-url https://pypi.org/simple/ \
    cert-framework

# Test it
python3 -c "from cert import compare; print('✓ TestPyPI install works')"

# Clean up
deactivate
rm -rf /tmp/test-from-testpypi
```

#### Step 6: Upload to Production PyPI

```bash
python3 -m twine upload dist/*
```

Package is now live at: `https://pypi.org/project/cert-framework/`

#### Step 7: Verify Production Install

```bash
# Final verification
python3 -m venv /tmp/test-from-pypi
source /tmp/test-from-pypi/bin/activate

pip install cert-framework

python3 -c "from cert import compare; print('✓ Installed from PyPI')"

deactivate
rm -rf /tmp/test-from-pypi
```

#### Step 8: Tag the Release

```bash
git add cert/__init__.py
git commit -m "Release version 0.2.0"
git tag v0.2.0
git push origin master
git push origin v0.2.0
```

## Professional Checklist

Before uploading to PyPI, verify:

- [ ] MANIFEST.in includes all data files
- [ ] `python3 -m build` succeeds without errors
- [ ] Install from wheel works in clean venv
- [ ] Version number is correct in `cert/__init__.py`
- [ ] Dependencies are correctly specified in `setup.py`
- [ ] README renders correctly on TestPyPI
- [ ] LICENSE file is included
- [ ] All tests pass
- [ ] Package imports successfully after pip install

## Common Issues

### 1. "No module named cert" after pip install

**Cause**: `packages=find_packages()` found wrong packages

**Fix**: Verify with:
```bash
python3 -c "from setuptools import find_packages; print(find_packages())"
```
Should output: `['cert']`

### 2. "FileNotFoundError: README.md"

**Cause**: Missing from MANIFEST.in

**Fix**: Add `include README.md` to MANIFEST.in

### 3. "Version already exists"

**Cause**: Tried to re-upload same version

**Fix**: PyPI versions are immutable. Bump to 0.2.1 and re-upload

### 4. Dependencies fail to install

**Cause**: Version pins too strict or too loose

**Fix**: Test in clean environment, adjust `setup.py`

### 5. Package installs but imports fail

**Cause**: Tested with `pip install -e .` (editable mode) instead of from wheel

**Fix**: Always test from wheel, not editable install

## Version Management

The version is defined in a single location:

- **Source of Truth**: `cert/__init__.py` → `__version__ = "0.2.0"`
- **setup.py reads from** `__init__.py` dynamically

To release a new version, only update `cert/__init__.py`.

## Post-Release

After a successful release:

1. Announce on GitHub Releases: https://github.com/Javihaus/cert-framework/releases
2. Update documentation if needed
3. Monitor PyPI stats: https://pypistats.org/packages/cert-framework

## Emergency: Yanking a Release

If you released a broken version:

```bash
# Mark the version as "yanked" (users won't get it by default)
pip install twine
twine yank cert-framework 0.2.0 -m "Broken import - use 0.2.1 instead"
```

Then release a fixed version immediately.

## The Discipline

The difference between amateur and professional releases:

- **Amateur**: Run `twine upload`, hope it works, discover broken package after users complain
- **Professional**:
  1. Test what you ship (install from wheel in clean env)
  2. Ship what you test (TestPyPI staging)
  3. Verify production (install from PyPI)
  4. Tag the commit (traceability)

Every shortcut will bite you when a user reports "pip install cert-framework doesn't work".

Ship it right the first time.
