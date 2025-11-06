# Figma Sync Quick Start 🚀

Get your Figma designs syncing to code in 5 minutes!

## TL;DR

```bash
# 1. Get Figma credentials
# Visit: https://www.figma.com/settings → Generate token
# Copy your file ID from URL: https://www.figma.com/file/ABC123xyz/...

# 2. Add to GitHub Secrets
# Go to: GitHub repo → Settings → Secrets → Actions
# Add: FIGMA_ACCESS_TOKEN and FIGMA_FILE_ID

# 3. Run sync
# GitHub: Actions → "Figma Design Sync" → Run workflow
# Or locally:
cd dashboard
export FIGMA_FILE_ID="your-id"
export FIGMA_ACCESS_TOKEN="figd_your-token"
./scripts/test-figma-sync.sh
```

## What Gets Synced?

| Figma | Generated File | What It Does |
|-------|---------------|--------------|
| Color Styles | `generated/colors.ts` | All your color tokens |
| Text Styles | `generated/typography.ts` | Font sizes, weights, line heights |
| Components | `generated/components/*.tsx` | React/Chakra UI components |

## File Structure

```
dashboard/
├── scripts/
│   ├── figma-sync.js              # Main sync script
│   ├── figma-component-generator.js # React code generator
│   └── test-figma-sync.sh         # Test script
├── generated/                      # Auto-generated files
│   ├── colors.ts
│   ├── typography.ts
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── ...
│   └── sync-report.json
└── FIGMA_SYNC_SETUP.md            # Full documentation
```

## Quick Commands

```bash
# Test connection
./scripts/test-figma-sync.sh

# Run sync manually
node scripts/figma-sync.js

# View sync report
cat generated/sync-report.json | jq

# Use generated colors in code
import { colors } from '@/generated/colors';
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| 403 Error | Invalid token → Regenerate in Figma |
| 404 Error | Wrong file ID → Check URL |
| No PR created | No changes detected → Modify Figma file |
| Bad code generated | Edit `figma-component-generator.js` |

## GitHub Action

The workflow automatically:
1. ✅ Runs daily at 2 AM UTC
2. ✅ Runs on manual trigger
3. ✅ Fetches Figma file
4. ✅ Generates code
5. ✅ Creates Pull Request if changes detected

## What to Do with Generated Files?

### Option 1: Direct Import (Quick)
```typescript
import { colors } from '@/generated/colors';
<Box bg={colors.primary} />
```

### Option 2: Merge with Theme (Recommended)
```bash
# Review generated/colors.ts
# Copy values to theme/colors.ts
# Keep manual control
```

### Option 3: Auto-Replace Components
```typescript
// Create figma-component-mapping.ts
export const MAP = {
  'Button/Primary': 'components/Button.tsx',
};
```

## Next Steps

1. 📖 Read full docs: `FIGMA_SYNC_SETUP.md`
2. 🎨 Set up Figma styles and components
3. 🔄 Run first sync
4. 👀 Review generated code
5. 🚀 Merge and iterate

## Resources

- [Figma API Docs](https://www.figma.com/developers/api)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Full Setup Guide](./FIGMA_SYNC_SETUP.md)

---

Made with ❤️ for designers and developers
