# Figma Plugin Quick Start

**1-Click Design System Setup** - No manual work needed!

## Prerequisites

- [ ] Figma Desktop App installed (not web browser)
- [ ] Your Figma file open: https://www.figma.com/file/CC7FsahlRr99qPRunNErR4/

## Installation (2 minutes)

1. **Open Figma Desktop App**

2. **Import Plugin:**
   - Menu → Plugins → Development → Import plugin from manifest...
   - Navigate to: `/Users/javiermarin/cert-framework/figma-plugin/`
   - Select `manifest.json`
   - Click Open

3. **Confirm:**
   - You should see: "Plugin 'CERT Dashboard Auto-Setup' successfully imported"

## Usage (30 seconds)

1. **Run Plugin:**
   - Menu → Plugins → Development → CERT Dashboard Auto-Setup

2. **Generate:**
   - Click "Generate Design System" button
   - Wait 30 seconds
   - Done!

## What You Get

- ✅ 12 color styles (Cobalt, Navy, Coral, etc.)
- ✅ 11 text styles (Headings, Body, Button, etc.)
- ✅ 3 components (Buttons, Cards)
- ✅ 2 pages with layouts
- ✅ Visual swatches and samples

## Sync to Code

After plugin completes:

1. **Go to GitHub Actions:**
   https://github.com/Javihaus/cert-framework/actions

2. **Run "Figma Design Sync"**
   - Click workflow
   - Click "Run workflow"
   - Select "master"
   - Click green button

3. **Wait for PR** (30 seconds)

4. **Review & Merge** - Your design is now in code!

## Troubleshooting

**Plugin not visible?**
- Make sure you're using Desktop app, not web browser

**Font errors?**
- Plugin uses Inter font (falls back to Roboto automatically)

**Need to re-run?**
- Delete the generated pages first
- Run plugin again

---

**Total Time**: 3 minutes from zero to complete design system!

**Full Documentation**: See `figma-plugin/README.md`
