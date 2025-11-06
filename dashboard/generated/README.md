# Generated Files from Figma

This folder contains auto-generated code from your Figma designs.

## ⚠️ Important

- **DO NOT** manually edit files in this folder
- They will be overwritten on next sync
- Copy code to your actual component files instead

## Files

- `colors.ts` - Color design tokens from Figma color styles
- `typography.ts` - Typography tokens from Figma text styles
- `components/*.tsx` - React components generated from Figma components
- `sync-report.json` - Detailed sync metadata

## Usage

### Option 1: Import Directly
```typescript
import { colors } from '@/generated/colors';
```

### Option 2: Copy Values
Copy the generated values into your actual theme files:
- `generated/colors.ts` → `theme/colors.ts`
- `generated/typography.ts` → `theme/typography.ts`

### Option 3: Reference for Manual Implementation
Use generated components as reference for building real components.

## Last Sync

Check `sync-report.json` for details about the last sync.
