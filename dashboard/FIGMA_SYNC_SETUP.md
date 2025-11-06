# Figma to Code Sync Setup Guide

This guide will help you set up automatic syncing from Figma designs to your codebase using GitHub Actions.

## Overview

The Figma sync system:
- ✅ Extracts design tokens (colors, typography) from Figma
- ✅ Converts Figma components to React/Chakra UI code
- ✅ Automatically creates Pull Requests when designs change
- ✅ Runs daily or on-demand via GitHub Actions
- ✅ Optional: Real-time sync with Figma webhooks

---

## Step 1: Get Your Figma Access Token

1. **Log in to Figma** at https://www.figma.com/

2. **Go to Account Settings**
   - Click your profile picture (top-left)
   - Select "Settings"

3. **Generate Personal Access Token**
   - Scroll down to "Personal access tokens"
   - Click "Create new token"
   - Give it a name like "CERT Dashboard Sync"
   - Copy the token (starts with `figd_...`)
   - ⚠️ **Save it securely** - you won't see it again!

---

## Step 2: Find Your Figma File ID

1. **Open your Figma file** in the browser

2. **Copy the File ID from the URL**
   ```
   https://www.figma.com/file/ABC123xyz/YourFileName
                                 ^^^^^^^^^
                                 This is your File ID
   ```

   Example:
   - URL: `https://www.figma.com/file/Uv4XQzPqkBGJfQZ8x7J2k9/CERT-Dashboard`
   - File ID: `Uv4XQzPqkBGJfQZ8x7J2k9`

---

## Step 3: Add GitHub Secrets

1. **Go to your GitHub repository**
   - Navigate to https://github.com/YOUR_USERNAME/cert-framework

2. **Open Settings → Secrets and variables → Actions**

3. **Add two secrets:**

   **Secret 1: FIGMA_ACCESS_TOKEN**
   - Click "New repository secret"
   - Name: `FIGMA_ACCESS_TOKEN`
   - Value: Your Figma personal access token (from Step 1)
   - Click "Add secret"

   **Secret 2: FIGMA_FILE_ID**
   - Click "New repository secret"
   - Name: `FIGMA_FILE_ID`
   - Value: Your Figma file ID (from Step 2)
   - Click "Add secret"

---

## Step 4: Test the Sync Manually

### Option A: Run via GitHub Actions (Recommended)

1. **Go to Actions tab** in your GitHub repo
2. **Click "Figma Design Sync"** workflow
3. **Click "Run workflow"** button
4. **Select branch** (usually `main`)
5. **Click green "Run workflow"** button

The workflow will:
- Fetch your Figma file
- Extract design tokens and components
- Create a Pull Request if changes detected

### Option B: Run Locally

```bash
cd dashboard

# Set environment variables
export FIGMA_FILE_ID="your-file-id-here"
export FIGMA_ACCESS_TOKEN="figd_your-token-here"

# Run sync script
node scripts/figma-sync.js
```

Check the `dashboard/generated/` folder for output.

---

## Step 5: Review the Pull Request

When the sync detects changes:

1. **A Pull Request is automatically created** with:
   - Title: "🎨 Figma Design Sync - [number]"
   - Branch: `figma-sync-[number]`
   - Labels: `design`, `figma-sync`, `automated`

2. **Review the changes:**
   - `generated/colors.ts` - Updated color tokens
   - `generated/typography.ts` - Updated text styles
   - `generated/components/*.tsx` - New/updated React components
   - `generated/sync-report.json` - Detailed sync report

3. **Merge or close the PR:**
   - ✅ Merge if the changes look good
   - ❌ Close if you want to keep current code

---

## Step 6: Integrate Generated Code (Optional)

The generated files are in `dashboard/generated/`. You can:

### Option 1: Use Generated Tokens Directly

```typescript
// Import generated colors
import { colors } from '@/generated/colors';

// Use in your components
<Box bg={colors.primary} />
```

### Option 2: Copy/Paste Into Existing Files

```bash
# Copy colors to your theme
cp generated/colors.ts theme/figma-colors.ts

# Manually merge with existing theme/colors.ts
```

### Option 3: Auto-Import via Script

Create a script to merge generated tokens with existing theme:

```javascript
// scripts/merge-figma-tokens.js
const fs = require('fs');

// Read generated colors
const generatedColors = require('../generated/colors');

// Read existing theme
const existingTheme = require('../theme/colors');

// Merge (your logic here)
const merged = { ...existingTheme, ...generatedColors };

// Write back
fs.writeFileSync('theme/colors.ts', /* merged content */);
```

---

## Step 7: Automate Component Updates

### Create Component Mapping File

```typescript
// figma-component-mapping.ts
export const FIGMA_COMPONENT_MAP = {
  // Figma component name → Your component path
  'Button/Primary': 'components/Button.tsx',
  'Card/Default': 'components/Card.tsx',
  'Navigation/Header': 'components/Navigation.tsx',
};
```

### Update Sync Script to Replace Components

```javascript
// In figma-sync.js
const COMPONENT_MAP = require('./figma-component-mapping');

// After generating component:
if (COMPONENT_MAP[component.name]) {
  const targetPath = COMPONENT_MAP[component.name];
  await fs.writeFile(targetPath, generatedCode);
  console.log(`✅ Updated ${targetPath}`);
}
```

---

## Step 8: Set Up Figma Webhooks (Real-Time Sync)

### 8.1: Create Webhook Endpoint

Add to your GitHub repo (or use a service like Vercel):

```javascript
// api/figma-webhook.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { event, file_key } = req.body;

  if (event === 'FILE_UPDATE' && file_key === process.env.FIGMA_FILE_ID) {
    // Trigger GitHub Action
    await fetch('https://api.github.com/repos/YOUR_USER/cert-framework/dispatches', {
      method: 'POST',
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: 'figma-update',
      }),
    });

    return res.status(200).json({ success: true });
  }

  return res.status(400).json({ error: 'Invalid webhook' });
}
```

### 8.2: Register Webhook in Figma

```bash
curl -X POST 'https://api.figma.com/v2/webhooks' \
  -H 'X-Figma-Token: YOUR_FIGMA_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "event_type": "FILE_UPDATE",
    "team_id": "YOUR_TEAM_ID",
    "endpoint": "https://your-webhook-url.com/api/figma-webhook",
    "passcode": "your-secret-passcode"
  }'
```

Now when you update your Figma file, the sync runs automatically!

---

## Sync Frequency

The workflow runs:
- **Daily at 2 AM UTC** (configurable in `.github/workflows/figma-sync.yml`)
- **On manual trigger** (via GitHub Actions UI)
- **On Figma webhook** (if set up in Step 8)

To change the schedule:

```yaml
# .github/workflows/figma-sync.yml
schedule:
  - cron: '0 14 * * *'  # 2 PM UTC daily
  - cron: '0 */6 * * *' # Every 6 hours
```

---

## Troubleshooting

### Error: "Figma API error: 403"
- ❌ Your access token is invalid or expired
- ✅ Generate a new token in Figma settings

### Error: "Figma API error: 404"
- ❌ Your file ID is wrong or you don't have access
- ✅ Check the URL and ensure you have edit access

### No Pull Request Created
- Check if there are actual changes in Figma
- Look at the Action logs for errors
- Verify GitHub secrets are set correctly

### Generated Code Has Errors
- The code generator is a starting point
- Review and manually adjust generated components
- Consider it scaffolding, not production-ready code

---

## Advanced Configuration

### Customize Component Generation

Edit `scripts/figma-component-generator.js` to:
- Add custom prop mappings
- Include theme tokens automatically
- Generate TypeScript interfaces
- Add custom component wrappers

### Filter Components to Sync

```javascript
// In figma-sync.js
const COMPONENT_WHITELIST = [
  'Button',
  'Card',
  'Navigation',
];

const components = extractComponents(figmaData)
  .filter(c => COMPONENT_WHITELIST.some(name => c.name.startsWith(name)));
```

### Merge with Existing Theme

```javascript
// scripts/merge-theme.js
const generatedColors = require('../generated/colors');
const existingColors = require('../theme/colors');

// Merge strategy: Figma takes precedence
const merged = {
  ...existingColors,
  ...generatedColors,
  // Keep custom colors that aren't in Figma
  custom: existingColors.custom,
};
```

---

## Best Practices

1. **Use Figma Styles**
   - Define colors and text styles in Figma
   - The sync script extracts these automatically

2. **Name Components Clearly**
   - Use clear, descriptive names in Figma
   - Example: `Button/Primary`, `Card/Default`

3. **Review Before Merging**
   - Always review auto-generated PRs
   - Generated code is a starting point, not production-ready

4. **Keep Manual Changes Separate**
   - Don't edit files in `generated/` directory
   - Copy to your actual component files

5. **Version Control**
   - Commit the `generated/` folder
   - Track changes over time

---

## Next Steps

1. ✅ Complete Steps 1-5 to set up basic sync
2. 📋 Create a Figma design system with styles and components
3. 🔄 Run your first sync and review the output
4. 🎨 Integrate generated tokens into your theme
5. 🚀 Set up webhooks for real-time sync (optional)

---

## Questions?

- **Figma API Docs:** https://www.figma.com/developers/api
- **GitHub Actions Docs:** https://docs.github.com/en/actions
- **Chakra UI Docs:** https://chakra-ui.com/docs

Happy syncing! 🎨✨
