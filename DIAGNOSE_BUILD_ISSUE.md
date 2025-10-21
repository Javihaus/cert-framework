# Build Process Being Killed - Diagnosis & Solutions

## What's Happening

`[1] 76336 killed` means macOS is sending SIGKILL to the Python process. This typically means:

1. **Out of Memory**: System ran out of RAM and killed the process
2. **Resource Limits**: User/system process limits exceeded
3. **Large Files**: setup.py is trying to package large files

## Diagnosis Steps

### 1. Check Available Memory
```bash
vm_stat | head -5
```
Look at "Pages free" - if it's very low, that's the problem.

### 2. Check What's Being Packaged
```bash
cd /Users/javiermarin/cert-framework
du -sh *
```
Look for unexpectedly large directories.

### 3. Check for Large Model Files
```bash
find . -type f -size +100M 2>/dev/null
```
If you see model files cached in the repo, that's the issue.

## Solutions (Try in Order)

### Solution 1: Exclude Large Files from Build

Check your `MANIFEST.in` or create one:

```bash
cat > MANIFEST.in << 'EOF'
include README.md
include LICENSE
include setup.py
recursive-include cert *.py
recursive-include examples *.py
exclude *.pyc
exclude .DS_Store
prune .git
prune __pycache__
prune .pytest_cache
prune models
prune .cache
EOF
```

Then try building again:
```bash
rm -rf dist/ build/ *.egg-info
python3 setup.py sdist bdist_wheel
```

### Solution 2: Close Memory-Hungry Apps

Before building:
```bash
# Close browsers, IDEs, etc.
# Then check available memory
vm_stat

# Try build again
python3 setup.py sdist bdist_wheel
```

### Solution 3: Increase Process Limits

```bash
# Check current limits
ulimit -a

# Increase memory limit (if possible)
ulimit -m unlimited
ulimit -v unlimited

# Try build
python3 setup.py sdist bdist_wheel
```

### Solution 4: Build Only Source Distribution (Faster)

```bash
# Build just the .tar.gz (no wheel)
rm -rf dist/ build/ *.egg-info
python3 setup.py sdist

# Upload just that
twine upload dist/*.tar.gz
```

### Solution 5: Minimal Build Using Tarball

Create the package manually:

```bash
cd /Users/javiermarin/cert-framework
VERSION="0.3.1"

# Create source distribution manually
mkdir -p dist
tar --exclude='.git' \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='.pytest_cache' \
    --exclude='models' \
    --exclude='dist' \
    --exclude='build' \
    -czf "dist/cert-framework-${VERSION}.tar.gz" \
    cert/ examples/ setup.py README.md LICENSE

# Upload
twine upload dist/cert-framework-${VERSION}.tar.gz
```

### Solution 6: Build on Different Machine

If all else fails:
1. Push to GitHub (already done ✓)
2. Clone on a machine with more RAM
3. Build there: `python3 setup.py sdist bdist_wheel`
4. Upload from there: `twine upload dist/*`

## Most Likely Culprit

Check if you have cached model files:

```bash
cd /Users/javiermarin/cert-framework
ls -lh ~/.cache/huggingface/
du -sh ~/.cache/torch/
```

If models are somehow getting included in the package, that's why it's being killed.

## Quick Fix (Recommended)

Try this first:

```bash
cd /Users/javiermarin/cert-framework

# Create MANIFEST.in to exclude unnecessary files
echo "include README.md LICENSE setup.py" > MANIFEST.in
echo "recursive-include cert *.py" >> MANIFEST.in
echo "recursive-include examples *.py" >> MANIFEST.in
echo "global-exclude *.pyc __pycache__ .DS_Store" >> MANIFEST.in

# Clean everything
rm -rf dist/ build/ *.egg-info .eggs

# Build just source dist
python3 setup.py sdist

# Check size
ls -lh dist/

# If it's reasonable (<5MB), upload
twine upload dist/*
```

## Expected Package Size

The built package should be:
- Source (.tar.gz): ~50-200KB
- Wheel (.whl): ~50-200KB

If you see files >10MB, something is wrong.
