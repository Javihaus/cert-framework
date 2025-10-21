# Manual PyPI Release Instructions for v0.3.1

## Issue
Automated build is being killed by system (SIGKILL). Need to build manually.

## Steps to Release

### 1. Open Terminal
```bash
cd /Users/javiermarin/cert-framework
```

### 2. Clean Previous Builds
```bash
rm -rf dist/ build/ *.egg-info
```

### 3. Build Package (try methods in order until one works)

**Method A: Using build module**
```bash
python3 -m pip install --upgrade build
python3 -m build
```

**Method B: Using setup.py directly**
```bash
python3 setup.py sdist bdist_wheel
```

**Method C: Build wheel only**
```bash
python3 -m pip install --upgrade wheel
python3 setup.py bdist_wheel
```

### 4. Verify Build
```bash
ls -lh dist/
# Should see: cert_framework-0.3.1-py3-none-any.whl
# And/or: cert-framework-0.3.1.tar.gz
```

### 5. Upload to PyPI
```bash
python3 -m pip install --upgrade twine
twine upload dist/*
```

Enter your PyPI credentials when prompted:
- Username: (your PyPI username)
- Password: (your PyPI password or API token)

### 6. Verify Release
Visit: https://pypi.org/project/cert-framework/

Should show version 0.3.1 with updated README.

## What's in v0.3.1

- NLI-based hallucination detection in compare() API
- Fast mode (~50ms) and NLI mode (~300ms)
- Updated documentation and examples
- No breaking changes from v0.3.0

## Troubleshooting

If build still fails:
1. Check available RAM: `vm_stat`
2. Close other applications
3. Try building in a fresh terminal session
4. As last resort, build on a different machine and copy dist/ folder back
