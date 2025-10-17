# ✅ CERT Framework - Ready to Publish to PyPI

**Package**: cert-framework
**Version**: 0.2.0
**Status**: All pre-publish checks passed

## What Was Fixed

### Critical Issues Resolved ✅

1. **Version Management**
   - ✅ Fixed version mismatch (setup.py vs __init__.py)
   - ✅ Implemented single source of truth (__init__.py)
   - ✅ setup.py reads version dynamically
   - ✅ pytest-plugin version synced (was 1.0.0, now 0.2.0)
   - ✅ pytest-plugin dependency fixed (required >=1.0.0, now >=0.2.0)

2. **Package Structure**
   - ✅ MANIFEST.in includes all data files
   - ✅ include_package_data=True in setup.py
   - ✅ find_packages() excludes tests and examples
   - ✅ All dependencies properly specified

3. **Release Tooling**
   - ✅ Created automated release script (scripts/release.sh)
   - ✅ Created manual publish script (publish_now.sh)
   - ✅ Complete documentation (RELEASING.md)

## Pre-Publish Checklist

### Package Validation ✅

- [x] Version number correct (0.2.0)
- [x] MANIFEST.in includes README.md, LICENSE
- [x] setup.py has correct dependencies
- [x] __init__.py exports correct symbols
- [x] No hardcoded versions in multiple places
- [x] All cross-package dependencies match versions

### Testing Requirements ✅

- [x] Package builds successfully
- [x] Imports work in clean environment
- [x] Basic functionality tests pass
- [x] Version check passes

### Documentation ✅

- [x] README.md renders correctly
- [x] LICENSE file included
- [x] RELEASING.md documentation complete
- [x] Examples are working

## How to Publish

### Option 1: Automated Script

```bash
cd /Users/javiermarin/cert-framework/packages/python
./publish_now.sh
```

This script will:
1. Build distributions
2. Test in clean environment
3. Upload to TestPyPI
4. Prompt you to test TestPyPI install
5. Upload to production PyPI (with confirmation)
6. Create git tag v0.2.0

### Option 2: Manual Steps

```bash
cd /Users/javiermarin/cert-framework/packages/python

# 1. Build
rm -rf dist/ build/ *.egg-info
python3 -m build

# 2. Test locally
python3 -m venv /tmp/test-cert
source /tmp/test-cert/bin/activate
pip install dist/cert_framework-0.2.0-py3-none-any.whl
python3 -c "from cert import compare; print('✓ Works')"
deactivate && rm -rf /tmp/test-cert

# 3. Upload to TestPyPI
python3 -m twine upload --repository testpypi dist/*

# 4. Test from TestPyPI
python3 -m venv /tmp/test-testpypi
source /tmp/test-testpypi/bin/activate
pip install --index-url https://test.pypi.org/simple/ \
    --extra-index-url https://pypi.org/simple/ \
    cert-framework
python3 -c "from cert import compare; print('✓ TestPyPI works')"
deactivate && rm -rf /tmp/test-testpypi

# 5. Upload to PyPI
python3 -m twine upload dist/*

# 6. Verify production
python3 -m venv /tmp/test-pypi
source /tmp/test-pypi/bin/activate
pip install cert-framework
python3 -c "from cert import compare; print('✓ Production works')"
deactivate && rm -rf /tmp/test-pypi

# 7. Tag release
git tag v0.2.0
git push origin v0.2.0
```

## Prerequisites

### 1. Install Build Tools

```bash
pip3 install --upgrade build twine
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
password = pypi-YOUR_TESTPYPI_TOKEN

[pypi]
username = __token__
password = pypi-YOUR_PYPI_TOKEN
```

```bash
chmod 600 ~/.pypirc
```

Get tokens:
- **TestPyPI**: https://test.pypi.org/manage/account/token/
- **PyPI**: https://pypi.org/manage/account/token/

## What Gets Published

### Main Package: cert-framework

**Files included**:
- All Python code in `cert/` directory
- README.md
- LICENSE
- Templates and static files (if any)

**Dependencies**:
- sentence-transformers>=2.2.0,<3.0.0
- torch>=1.11.0
- numpy>=1.21.0,<2.0.0
- typing-extensions>=4.0.0

**Entry points**:
- `cert` - Main CLI command
- `cert-compare` - Text comparison CLI

### Plugin Package: pytest-cert

**Status**: Ready to publish (version synced to 0.2.0)

**Dependencies**:
- pytest>=7.0.0
- cert-framework>=0.2.0 (matches main package)

## Post-Publish

After successful publication:

1. **Verify Installation**:
   ```bash
   pip install cert-framework
   python3 -c "from cert import compare; print('✓ Installed')"
   ```

2. **Check PyPI Page**:
   - https://pypi.org/project/cert-framework/

3. **Create GitHub Release**:
   - Go to: https://github.com/Javihaus/cert-framework/releases
   - Create release for tag v0.2.0
   - Copy release notes from this document

4. **Announce**:
   - Update README if needed
   - Share on relevant channels

## Version Upgrade Path

For future releases, update version in ONE place:

```bash
# Edit packages/python/cert/__init__.py
__version__ = "0.3.0"  # Or whatever next version

# Edit packages/pytest-plugin/cert_pytest/__init__.py (if releasing plugin)
__version__ = "0.3.0"

# Then run release script
./scripts/release.sh 0.3.0
```

setup.py will automatically read the version.

## Safety Checks

Before uploading to production PyPI, the script ensures:

1. ✅ Package builds without errors
2. ✅ Installs cleanly in fresh environment
3. ✅ Imports work correctly
4. ✅ Version matches expected
5. ✅ Basic functionality tests pass
6. ✅ TestPyPI upload succeeds first

## Emergency: Yanking a Release

If something goes wrong after publishing:

```bash
pip install twine
twine yank cert-framework 0.2.0 -m "Broken - use 0.2.1 instead"
```

Then fix the issue and release 0.2.1 immediately.

## The Discipline

✅ **Test what you ship** - Install from wheel in clean env
✅ **Ship what you test** - TestPyPI staging
✅ **Verify production** - Install from PyPI
✅ **Tag the commit** - Full traceability

No shortcuts. No broken packages. Ship it right.

---

## Summary

**Everything is ready.** All version mismatches fixed, all dependencies aligned, all tooling in place.

When you're ready to publish:
1. Set up ~/.pypirc with your tokens
2. Run `./publish_now.sh`
3. Follow the prompts

The package is production-ready. 🚀
