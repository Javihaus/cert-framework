# CERT Dashboard - Figma Design Setup Guide

This guide will help you recreate your current dashboard design in Figma.

## 🎨 Step 1: Set Up Color Styles (15 minutes)

Open your Figma file: https://www.figma.com/file/CC7FsahlRr99qPRunNErR4/

### Create a Color Palette Frame

1. Press **F** to create a Frame
2. Name it "Color Palette"
3. Make it 1000x800px

### Add Each Color

For each color below:
1. Press **R** for Rectangle
2. Draw a 200x200px square
3. Click the **fill color** in the right panel
4. Enter the **hex code**
5. Click the **4-dots icon** (☰) next to the color
6. Select **"Create style"**
7. Name it exactly as shown below

#### Primary Colors

| Name | Hex Code | Usage |
|------|----------|-------|
| **Cobalt** | `#3C6098` | Primary brand color, main buttons |
| **Navy** | `#112358` | Dark text, headings |
| **Coral** | `#E48B59` | Warnings, accents |

#### Neutrals

| Name | Hex Code | Usage |
|------|----------|-------|
| **Background** | `#FBF5F0` | Page background |
| **Patience** | `#E6DDD6` | Card borders, dividers |
| **Mist** | `#BFC8D8` | Hover states |

#### Semantic Colors

| Name | Hex Code | Usage |
|------|----------|-------|
| **Success** | `#48bb78` | Passed tests, success messages |
| **Warning** | `#E48B59` | Warning messages |
| **Error** | `#fc8181` | Failed tests, error messages |

#### Text Colors

| Name | Hex Code | Usage |
|------|----------|-------|
| **Text/Primary** | `#112358` | Main text |
| **Text/Secondary** | `#3C6098` | Secondary text |
| **Text/Muted** | `#718096` | Placeholder, disabled text |

---

## 📝 Step 2: Set Up Typography Styles (10 minutes)

### Create a Typography Frame

1. Press **F** to create a new Frame
2. Name it "Typography"
3. Make it 1200x1500px

### Add Each Text Style

For each style below:
1. Press **T** for Text tool
2. Type the style name (e.g., "Heading 1")
3. Set the properties as shown
4. Click the **4-dots icon** (☰) in the text properties
5. Select **"Create style"**
6. Name it exactly as shown

#### Headings

**Heading 1 - Hero**
```
Font: Inter (or system default)
Weight: Bold (700)
Size: 56px
Line Height: 1.1
Letter Spacing: -2px
Color: Navy (#112358)
```

**Heading 2 - Page Title**
```
Font: Inter
Weight: Bold (700)
Size: 36px
Line Height: 1.2
Letter Spacing: -1px
Color: Navy (#112358)
```

**Heading 3 - Section**
```
Font: Inter
Weight: Bold (700)
Size: 28px
Line Height: 1.3
Letter Spacing: -0.5px
Color: Navy (#112358)
```

**Heading 4 - Card Title**
```
Font: Inter
Weight: Bold (700)
Size: 24px
Line Height: 1.3
Color: Navy (#112358)
```

**Heading 5 - Subsection**
```
Font: Inter
Weight: Semi-Bold (600)
Size: 18px
Line Height: 1.4
Color: Navy (#112358)
```

#### Body Text

**Body/Large**
```
Font: Inter
Weight: Regular (400)
Size: 18px
Line Height: 1.6
Color: Text/Secondary (#3C6098)
```

**Body/Default**
```
Font: Inter
Weight: Regular (400)
Size: 16px
Line Height: 1.6
Color: Text/Primary (#112358)
```

**Body/Small**
```
Font: Inter
Weight: Regular (400)
Size: 15px
Line Height: 1.6
Color: Text/Secondary (#3C6098)
```

**Caption**
```
Font: Inter
Weight: Medium (500)
Size: 14px
Line Height: 1.5
Color: Text/Muted (#718096)
```

#### UI Text

**Button/Large**
```
Font: Inter
Weight: Semi-Bold (600)
Size: 17px
Color: White (#FFFFFF)
```

**Button/Default**
```
Font: Inter
Weight: Medium (500)
Size: 15px
Color: White (#FFFFFF)
```

**Label**
```
Font: Inter
Weight: Semi-Bold (600)
Size: 15px
Color: Navy (#112358)
```

---

## 🧩 Step 3: Create Component Library (30 minutes)

### Create a Components Frame

1. Press **F** to create a new Frame
2. Name it "Components"
3. Make it 2000x2000px

### Component 1: Button/Primary

1. Press **R** for Rectangle
2. Size: **180px × 56px**
3. Fill: **Cobalt** (#3C6098)
4. Corner Radius: **8px**
5. Add text: **"Button Text"**
6. Text Style: **Button/Default**
7. Center the text
8. Select everything (Shift + Click)
9. Right-click → **"Create Component"** (or Ctrl/Cmd + Alt + K)
10. Name: **"Button/Primary"**

### Component 2: Button/Secondary

1. Duplicate the Primary button (Alt + Drag)
2. Fill: **White** (#FFFFFF)
3. Border: **1px solid Patience** (#E6DDD6)
4. Text Color: **Navy** (#112358)
5. Right-click → **"Create Component"**
6. Name: **"Button/Secondary"**

### Component 3: Card

1. Press **R** for Rectangle
2. Size: **400px × 300px**
3. Fill: **White** (#FFFFFF)
4. Border: **1px solid Patience** (#E6DDD6)
5. Corner Radius: **12px**
6. Shadow: **0px 2px 8px rgba(0,0,0,0.05)**
7. Add padding frame inside (24px all sides)
8. Right-click → **"Create Component"**
9. Name: **"Card/Default"**

### Component 4: MetricCard

1. Create a Card (400px × 200px)
2. Inside, add:
   - **Text**: "Metric Label" (Caption style)
   - **Text**: "92.5%" (56px, Bold, Cobalt)
   - **Icon** box: 64px circle with background Patience
3. Arrange in layout
4. Right-click → **"Create Component"**
5. Name: **"Card/Metric"**

### Component 5: Navigation

1. Press **R** for Rectangle
2. Size: **1600px × 64px**
3. Fill: **White** (#FFFFFF)
4. Border Bottom: **1px solid Patience**
5. Add logo placeholder (40px circle)
6. Add text: **"CERT"** (24px, Bold, Cobalt)
7. Add tab buttons (use Button/Secondary style)
8. Right-click → **"Create Component"**
9. Name: **"Navigation/Header"**

### Component 6: Status Banner

1. Press **R** for Rectangle
2. Size: **800px × 80px**
3. Fill: **Success gradient** (linear gradient: #48bb78 → #38a169, 135°)
4. Corner Radius: **12px**
5. Add icon circle (56px) with white background
6. Add text: **"Status Title"** (20px, Bold, White)
7. Add text: **"Status message"** (16px, Regular, White)
8. Right-click → **"Create Component"**
9. Name: **"Banner/Success"**

---

## 📐 Step 4: Create Page Layouts (30 minutes)

### Layout 1: Home Page

1. Press **F** for Frame
2. Select **"Desktop"** preset (1440px wide)
3. Name: **"Page/Home"**
4. Add:
   - Navigation component at top
   - Hero section with Heading 1
   - Feature cards in grid (2 columns)
   - Workflow section
5. Use **Auto Layout** (Shift + A) for spacing

### Layout 2: Monitoring Dashboard

1. Create new Desktop frame: **"Page/Monitoring"**
2. Add:
   - Navigation component
   - Status Banner
   - 4 Metric Cards in grid
   - Quick Actions section
   - Chart placeholder (800px × 400px gray box)

### Layout 3: Document Generation

1. Create new Desktop frame: **"Page/Documents"**
2. Add:
   - Navigation component
   - Form sections (4 sections)
   - Input fields (44px height)
   - Generate button (large)

---

## 🎬 Step 5: Organize Your File

### Create Pages

1. Click **"+"** next to "Page 1" in left panel
2. Create these pages:
   - **🎨 Design System** (colors, typography, components)
   - **📱 Pages** (all page layouts)
   - **🔍 Prototypes** (interactive flows)

3. Move your frames:
   - Color Palette, Typography → Design System page
   - Components → Design System page
   - All Pages → Pages page

---

## ✅ Step 6: Run Sync & Verify

After setting up everything in Figma:

1. **Go to GitHub Actions**:
   https://github.com/Javihaus/cert-framework/actions

2. **Run "Figma Design Sync"**

3. **Check the PR** - You should see:
   ```
   generated/colors.ts      // All your color styles
   generated/typography.ts   // All your text styles
   generated/components/     // React components for each Figma component
   ```

4. **Review and merge!**

---

## 📸 Quick Visual Reference

### Your Color Palette in Figma Should Look Like:

```
┌─────────────────────────────────────────┐
│  Color Palette                          │
│                                         │
│  ███  ███  ███                          │
│ Cobalt Navy Coral                       │
│                                         │
│  ███  ███  ███                          │
│  BG   Patience Mist                     │
│                                         │
│  ███  ███  ███                          │
│Success Warning Error                    │
└─────────────────────────────────────────┘
```

### Your Components Should Look Like:

```
┌──────────────────────┐
│ Button/Primary       │  (Blue, rounded)
└──────────────────────┘

┌──────────────────────┐
│ Button/Secondary     │  (White, bordered)
└──────────────────────┘

┌────────────────────────────┐
│                            │
│   Card/Default             │
│                            │
└────────────────────────────┘

┌─────────────────────────────────────┐
│ CERT  Home  Monitoring  Docs        │
└─────────────────────────────────────┘
```

---

## 🚀 Time Estimate

- **Colors**: 15 minutes
- **Typography**: 10 minutes
- **Components**: 30 minutes
- **Layouts**: 30 minutes
- **Organization**: 5 minutes

**Total**: ~90 minutes to complete setup

---

## 💡 Pro Tips

1. **Use Auto Layout** (Shift + A) for all components - makes them responsive
2. **Name layers clearly** - helps the sync tool generate better code
3. **Use consistent spacing** - 8px, 16px, 24px, 32px
4. **Group related items** - keeps things organized
5. **Save often** - Figma auto-saves, but cmd/ctrl + S doesn't hurt

---

## ❓ Need Help?

**Figma Resources:**
- Figma Basics: https://help.figma.com/hc/en-us/articles/360040450213
- Creating Styles: https://help.figma.com/hc/en-us/articles/360040316193
- Components: https://help.figma.com/hc/en-us/articles/360038662654

**Your Dashboard:**
- Current Design: http://localhost:3000
- Figma File: https://www.figma.com/file/CC7FsahlRr99qPRunNErR4/

---

## ✨ After Setup

Once you've created everything:

1. **Make a change** in Figma (change a color, add a component)
2. **Run the sync** workflow
3. **Review the PR** with generated code
4. **Merge** and your code will match your design!

Your dashboard design system is now sync-ready! 🎉
