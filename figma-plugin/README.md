# CERT Dashboard Auto-Setup Figma Plugin

This plugin automatically creates your complete CERT Dashboard design system in Figma with one click.

## What It Creates

- **12 Color Styles**: Cobalt, Navy, Coral, Background, Patience, Mist, Success, Warning, Error, and 3 text colors
- **11 Text Styles**: Headings (1-5), Body styles (Large, Default, Small), Button, Label, Caption
- **3 Core Components**: Button/Primary, Button/Secondary, Card/Default
- **2 Pages**: Design System page with all styles and components, Sample Pages with layouts

## Installation

### Step 1: Open Figma Desktop App

This plugin requires the Figma desktop app (not web browser).

Download: https://www.figma.com/downloads/

### Step 2: Import the Plugin

1. Open Figma Desktop
2. Go to **Menu → Plugins → Development → Import plugin from manifest...**
3. Navigate to this folder: `/Users/javiermarin/cert-framework/figma-plugin/`
4. Select the `manifest.json` file
5. Click **Open**

You'll see: "Plugin 'CERT Dashboard Auto-Setup' successfully imported"

### Step 3: Open Your Figma File

Open your CERT Dashboard Figma file:
https://www.figma.com/file/CC7FsahlRr99qPRunNErR4/

## Usage

### Run the Plugin

1. In your Figma file, go to **Menu → Plugins → Development → CERT Dashboard Auto-Setup**
2. The plugin UI will open
3. Click **"Generate Design System"** button
4. Wait 30 seconds while it creates everything
5. Done!

### What Happens

The plugin will:
1. Create a new page called "🎨 Design System"
2. Generate all 12 color styles with visual swatches
3. Create all 11 typography styles with samples
4. Build 3 reusable components
5. Create a "📱 Pages" page with sample layouts
6. Automatically zoom to show your new design system

## After Running

### View Your Design System

1. Navigate to the "🎨 Design System" page (left sidebar)
2. You'll see three sections:
   - **Color Palette**: Visual swatches of all colors
   - **Typography**: Samples of all text styles
   - **Components**: Button and Card components

### Use the Styles

**Colors:**
1. Select any shape
2. Click the fill color
3. Click the 4-dots icon
4. Your colors are now in the styles list!

**Typography:**
1. Select any text
2. Click the text style dropdown
3. Choose from Heading 1, Body/Default, etc.

**Components:**
1. Open Assets panel (left sidebar)
2. Find Button/Primary, Button/Secondary, Card/Default
3. Drag onto your canvas

## Sync with Code

After the plugin creates your design system:

1. **Go to GitHub Actions**:
   https://github.com/Javihaus/cert-framework/actions

2. **Run "Figma Design Sync" workflow**:
   - Click "Run workflow"
   - Select "master" branch
   - Click green "Run workflow" button

3. **Wait for PR**:
   - The workflow will extract your styles
   - Generate TypeScript code
   - Create a Pull Request automatically

4. **Review and merge**:
   ```typescript
   // You'll get files like:
   import { colors } from '@/generated/colors';
   import { typography } from '@/generated/typography';
   ```

## Troubleshooting

### Plugin Not Appearing

**Issue**: Can't find plugin in menu
**Fix**: Make sure you're using Figma Desktop app, not web browser

### Font Loading Errors

**Issue**: Text styles show wrong font
**Fix**: The plugin uses Inter font. If not available, it falls back to Roboto (system font)

### "Permission Denied" Error

**Issue**: Plugin can't create elements
**Fix**: Make sure you have edit access to the Figma file

### UI Not Showing

**Issue**: Plugin runs but no UI appears
**Fix**:
1. Close the plugin
2. Refresh Figma (Cmd/Ctrl + R)
3. Try running the plugin again

## File Structure

```
figma-plugin/
├── manifest.json          # Plugin metadata
├── code.js                # Main plugin logic (creates design system)
├── ui.html                # User interface with button
└── README.md              # This file
```

## Development

### Updating the Plugin

If you make changes to `code.js` or `ui.html`:

1. In Figma, go to **Menu → Plugins → Development**
2. Right-click your plugin
3. Select **"Re-import plugin from manifest"**
4. Run the plugin again

### Adding More Components

Edit `code.js` and add new components in the "STEP 3: Create Component Library" section:

```javascript
// Example: Add a new input component
const input = figma.createComponent();
input.name = 'Input/Default';
input.resize(300, 44);
// ... configure input properties
componentFrame.appendChild(input);
```

### Customizing Colors

Edit the `colors` object at the top of `code.js`:

```javascript
const colors = {
  yourColor: {
    name: 'Your Color',
    hex: 'FF0000',
    r: 255/255,
    g: 0/255,
    b: 0/255
  },
  // ... add more colors
};
```

## Support

**Figma Plugin API Docs**: https://www.figma.com/plugin-docs/
**CERT Dashboard**: http://localhost:3000
**GitHub Repo**: https://github.com/Javihaus/cert-framework

## Next Steps

1. ✅ Run the plugin to create your design system
2. ✅ Customize components in Figma as needed
3. ✅ Run GitHub Action to sync to code
4. ✅ Use generated styles in your Next.js app
5. ✅ Make updates in Figma, sync automatically!

---

**Note**: This plugin creates a starting point. Feel free to customize colors, typography, and components in Figma after generation. Then run the sync workflow to update your code!
