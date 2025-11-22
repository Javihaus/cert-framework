# CERT Dashboard Design Specification

## For Claude Code: Professional Dashboard Redesign

This document provides exact specifications for rebuilding the CERT dashboard with a professional, Stripe-quality design. Follow these specifications precisely.

---

## The Problem with the Current Dashboard

1. **Mixed design systems** — Chakra UI + custom Tailwind + raw CSS = inconsistent UI
2. **No clear hierarchy** — Everything looks the same importance
3. **Cluttered metrics** — Too many numbers, no story
4. **Inconsistent spacing** — Sometimes 16px, sometimes 24px, feels random
5. **Generic charts** — Default Recharts styling without customization

---

## Design Philosophy

**Reference: Stripe Dashboard, Linear, Vercel**

Key principles:
- **Hierarchy through typography, not color** — Important things are bigger, not louder
- **One spacing scale, used everywhere** — 4, 8, 12, 16, 24, 32, 48, 64px
- **Neutral base, color for meaning** — Gray UI, color = status (green=good, red=bad, yellow=warning)
- **Dense but not cluttered** — Show lots of data, but with rhythm and grouping
- **Motion with purpose** — Subtle transitions, no gratuitous animation

---

## Design System

### 1. Color Palette

```typescript
// theme/colors.ts - REPLACE ENTIRELY

export const colors = {
  // Background hierarchy (light mode)
  background: {
    page: '#FAFAFA',      // Page background
    surface: '#FFFFFF',   // Cards, panels
    elevated: '#FFFFFF',  // Modals, dropdowns
    subtle: '#F4F4F5',    // Secondary surfaces
  },
  
  // Background hierarchy (dark mode)
  backgroundDark: {
    page: '#09090B',      // Page background
    surface: '#18181B',   // Cards, panels
    elevated: '#27272A',  // Modals, dropdowns
    subtle: '#27272A',    // Secondary surfaces
  },
  
  // Text hierarchy
  text: {
    primary: '#09090B',   // Headings, important text
    secondary: '#71717A', // Body text, descriptions
    tertiary: '#A1A1AA',  // Placeholder, disabled
    inverse: '#FAFAFA',   // Text on dark backgrounds
  },
  
  // Borders
  border: {
    default: '#E4E4E7',   // Card borders
    subtle: '#F4F4F5',    // Subtle dividers
    strong: '#D4D4D8',    // Emphasized borders
  },
  
  // Status colors — ONLY use these for semantic meaning
  status: {
    success: {
      bg: '#F0FDF4',
      bgSubtle: '#DCFCE7',
      text: '#166534',
      icon: '#22C55E',
    },
    warning: {
      bg: '#FFFBEB',
      bgSubtle: '#FEF3C7',
      text: '#A16207',
      icon: '#F59E0B',
    },
    error: {
      bg: '#FEF2F2',
      bgSubtle: '#FEE2E2',
      text: '#B91C1C',
      icon: '#EF4444',
    },
    info: {
      bg: '#EFF6FF',
      bgSubtle: '#DBEAFE',
      text: '#1D4ED8',
      icon: '#3B82F6',
    },
  },
  
  // Brand — Use sparingly (buttons, active states only)
  brand: {
    primary: '#2563EB',   // Primary actions
    hover: '#1D4ED8',     // Hover state
    active: '#1E40AF',    // Active/pressed state
  },
};
```

### 2. Typography

```typescript
// theme/typography.ts

export const typography = {
  // Font family
  fontFamily: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "SF Mono", Consolas, monospace',
  },
  
  // Font sizes with line heights
  fontSize: {
    xs: ['12px', { lineHeight: '16px', letterSpacing: '0' }],
    sm: ['13px', { lineHeight: '20px', letterSpacing: '0' }],
    base: ['14px', { lineHeight: '20px', letterSpacing: '0' }],
    lg: ['16px', { lineHeight: '24px', letterSpacing: '-0.01em' }],
    xl: ['18px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
    '2xl': ['24px', { lineHeight: '32px', letterSpacing: '-0.02em' }],
    '3xl': ['30px', { lineHeight: '36px', letterSpacing: '-0.02em' }],
  },
  
  // Font weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
  },
};
```

### 3. Spacing

```typescript
// theme/spacing.ts

// ONE scale. Use it everywhere.
export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
};

// Layout-specific values
export const layout = {
  sidebarWidth: '240px',
  headerHeight: '56px',
  maxContentWidth: '1200px',
  cardPadding: spacing[5],  // 20px
  sectionGap: spacing[6],   // 24px
  pageGutter: spacing[6],   // 24px
};
```

### 4. Shadows

```typescript
// theme/shadows.ts

export const shadows = {
  // Card shadow — subtle, barely visible
  card: '0 1px 2px 0 rgb(0 0 0 / 0.03), 0 1px 6px -1px rgb(0 0 0 / 0.02)',
  
  // Elevated — dropdowns, modals
  elevated: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
  
  // Focus ring — accessibility
  focus: '0 0 0 2px #FFFFFF, 0 0 0 4px #2563EB',
};
```

### 5. Border Radius

```typescript
// theme/radius.ts

export const radius = {
  sm: '4px',    // Small elements (badges, pills)
  md: '6px',    // Buttons, inputs
  lg: '8px',    // Cards
  xl: '12px',   // Large cards, modals
};
```

---

## Component Specifications

### 1. Sidebar Navigation

```tsx
// components/Sidebar.tsx

/**
 * SPECIFICATIONS:
 * - Width: 240px fixed
 * - Background: #FFFFFF (light) / #18181B (dark)
 * - Border-right: 1px solid #E4E4E7
 * - Padding: 16px
 * 
 * Logo section:
 * - Height: 56px (matches header)
 * - Logo + "CERT" text
 * - Font: 18px, semibold, tracking tight
 * 
 * Navigation items:
 * - Padding: 8px 12px
 * - Border-radius: 6px
 * - Font: 13px, medium
 * - Icon: 16px, 12px gap from text
 * - Default: text-secondary (#71717A)
 * - Hover: background #F4F4F5, text-primary (#09090B)
 * - Active: background #F4F4F5, text-primary, font-medium
 * 
 * Sections:
 * - Section label: 11px, uppercase, semibold, text-tertiary, 24px margin-top
 * - Items within section: 2px gap
 */

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: number;
}

const navigation: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, href: '/' },
  { id: 'assessment', label: 'Assessment', icon: ClipboardCheck, href: '/assessment' },
  { id: 'monitoring', label: 'Monitoring', icon: Activity, href: '/monitoring' },
  { id: 'costs', label: 'Costs & ROI', icon: DollarSign, href: '/costs' },
  { id: 'optimization', label: 'Optimization', icon: Zap, href: '/optimization', badge: 3 },
  { id: 'compliance', label: 'Compliance', icon: Shield, href: '/compliance' },
];
```

### 2. Metric Cards

```tsx
// components/MetricCard.tsx

/**
 * SPECIFICATIONS:
 * - Background: #FFFFFF
 * - Border: 1px solid #E4E4E7
 * - Border-radius: 8px
 * - Padding: 20px
 * - Shadow: card shadow
 * 
 * Layout:
 * ┌─────────────────────────────────────┐
 * │ Label                    +12% ▲    │  <- 13px, text-secondary | 12px, status color
 * │                                     │
 * │ $1,247.32                          │  <- 24px, semibold, text-primary
 * │                                     │
 * │ ████████████░░░░░░░░ 67%           │  <- Optional progress bar
 * └─────────────────────────────────────┘
 * 
 * Variants:
 * - default: Just label + value
 * - withTrend: Label + value + trend indicator
 * - withProgress: Label + value + progress bar
 * - withSparkline: Label + value + mini chart
 */

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    positive: boolean; // Is up good or bad?
  };
  progress?: {
    value: number;
    max: number;
  };
  sparklineData?: number[];
}
```

### 3. Data Tables

```tsx
// components/DataTable.tsx

/**
 * SPECIFICATIONS:
 * - Container: No border, no shadow (contained by card)
 * - Header row:
 *   - Background: #FAFAFA
 *   - Font: 11px, uppercase, semibold, text-tertiary
 *   - Padding: 12px 16px
 *   - Border-bottom: 1px solid #E4E4E7
 * 
 * - Body rows:
 *   - Font: 13px, normal, text-primary
 *   - Padding: 16px
 *   - Border-bottom: 1px solid #F4F4F5
 *   - Hover: background #FAFAFA
 * 
 * - Numeric columns: Right-aligned, font-mono
 * - Status columns: Badge component
 * - Action columns: Icon buttons, appear on row hover
 */
```

### 4. Status Badges

```tsx
// components/Badge.tsx

/**
 * SPECIFICATIONS:
 * - Padding: 2px 8px
 * - Border-radius: 4px
 * - Font: 12px, medium
 * - Display: inline-flex, center aligned
 * 
 * Variants (use status colors):
 * - success: bg #F0FDF4, text #166534
 * - warning: bg #FFFBEB, text #A16207
 * - error: bg #FEF2F2, text #B91C1C
 * - info: bg #EFF6FF, text #1D4ED8
 * - neutral: bg #F4F4F5, text #71717A
 * 
 * With icon:
 * - 12px icon, 4px gap
 * - Icon color matches text
 * 
 * With count (notification style):
 * - Min-width: 20px
 * - Border-radius: full (9999px)
 * - Font: 11px, semibold
 */
```

### 5. Buttons

```tsx
// components/Button.tsx

/**
 * SPECIFICATIONS:
 * - Height: 36px (default), 32px (sm), 40px (lg)
 * - Padding: 0 16px
 * - Border-radius: 6px
 * - Font: 13px, medium
 * - Transition: all 150ms ease
 * 
 * Variants:
 * 
 * Primary:
 * - Background: #2563EB
 * - Text: #FFFFFF
 * - Hover: #1D4ED8
 * - Active: #1E40AF
 * 
 * Secondary:
 * - Background: #FFFFFF
 * - Border: 1px solid #E4E4E7
 * - Text: #09090B
 * - Hover: background #FAFAFA
 * 
 * Ghost:
 * - Background: transparent
 * - Text: #71717A
 * - Hover: background #F4F4F5, text #09090B
 * 
 * Danger:
 * - Background: #EF4444
 * - Text: #FFFFFF
 * - Hover: #DC2626
 * 
 * With icon:
 * - 16px icon, 8px gap
 * - Icon-only: square button, centered icon
 */
```

### 6. Charts

```tsx
// components/charts/AreaChart.tsx

/**
 * SPECIFICATIONS:
 * 
 * Container:
 * - Padding: 20px
 * - Height: 240px (default)
 * 
 * Grid:
 * - Horizontal lines only
 * - Color: #F4F4F5
 * - Stroke-dasharray: none (solid lines)
 * 
 * Axis:
 * - Font: 11px, text-tertiary
 * - X-axis: bottom, no line
 * - Y-axis: left, no line
 * - Ticks: inside, 4px padding
 * 
 * Area:
 * - Stroke: 2px, brand-primary (#2563EB)
 * - Fill: linear-gradient(to bottom, rgba(37, 99, 235, 0.1), transparent)
 * - Curve: monotone (smooth)
 * 
 * Tooltip:
 * - Background: #09090B
 * - Text: #FFFFFF
 * - Padding: 8px 12px
 * - Border-radius: 6px
 * - Font: 12px
 * - Shadow: elevated
 * 
 * Legend:
 * - Position: top-right, inline with title
 * - Items: 12px colored dot, 8px gap, 13px text
 */
```

---

## Page Layouts

### Overview Page

```
┌─────────────────────────────────────────────────────────────────┐
│ SIDEBAR │                    MAIN CONTENT                       │
│         │                                                       │
│ Overview│  ┌──────────────────────────────────────────────────┐ │
│ ───────│  │ Overview                              [Actions ▼] │ │
│ Assess  │  │ AI Implementation Pipeline Dashboard             │ │
│ Monitor │  └──────────────────────────────────────────────────┘ │
│ Costs   │                                                       │
│ Optimize│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│ Comply  │  │ Active  │ │ Monthly │ │  ROI    │ │Complianc│    │
│         │  │ Systems │ │  Cost   │ │         │ │  Score  │    │
│         │  │   12    │ │ €1,247  │ │ 3,554%  │ │   87%   │    │
│         │  └─────────┘ └─────────┘ └─────────┘ └─────────┘    │
│         │                                                       │
│         │  ┌────────────────────────┐ ┌──────────────────────┐ │
│         │  │                        │ │                      │ │
│         │  │   Cost Trend (30d)     │ │  Pipeline Progress   │ │
│         │  │   [Area Chart]         │ │  [Status List]       │ │
│         │  │                        │ │                      │ │
│         │  └────────────────────────┘ └──────────────────────┘ │
│         │                                                       │
│         │  ┌──────────────────────────────────────────────────┐ │
│         │  │ Registered AI Systems                   [+ Add]  │ │
│         │  ├──────────────────────────────────────────────────┤ │
│         │  │ NAME          RISK    ACCURACY   COST    STATUS  │ │
│         │  │ CustomerBot   High    94.2%      €423    ✓ OK    │ │
│         │  │ DocAnalyzer   Ltd     87.1%      €156    ⚠ Review│ │
│         │  │ FraudDetect   High    96.8%      €668    ✓ OK    │ │
│         │  └──────────────────────────────────────────────────┘ │
│         │                                                       │
└─────────────────────────────────────────────────────────────────┘
```

### Assessment Page

```
┌──────────────────────────────────────────────────────────────────┐
│ SIDEBAR │                    ASSESSMENT                          │
│         │                                                        │
│         │  ┌────────────────────────────────────────────────────┐│
│         │  │ EU AI Act Risk Assessment                          ││
│         │  │ Determine your compliance obligations              ││
│         │  └────────────────────────────────────────────────────┘│
│         │                                                        │
│         │  ┌────────────────────────────────────────────────────┐│
│         │  │ Progress: ████████░░░░░░░░░░░░ 4 of 12 questions   ││
│         │  └────────────────────────────────────────────────────┘│
│         │                                                        │
│         │  ┌────────────────────────────────────────────────────┐│
│         │  │                                                    ││
│         │  │  Does your AI system make or significantly        ││
│         │  │  influence decisions about employment,            ││
│         │  │  including recruitment or termination?            ││
│         │  │                                                    ││
│         │  │  ┌────────────────┐  ┌────────────────┐           ││
│         │  │  │      Yes       │  │       No       │           ││
│         │  │  └────────────────┘  └────────────────┘           ││
│         │  │                                                    ││
│         │  │  ℹ️ Why this matters:                              ││
│         │  │  Employment decisions are classified as "high-risk"││
│         │  │  under EU AI Act Annex III, Category 4.           ││
│         │  │                                                    ││
│         │  └────────────────────────────────────────────────────┘│
│         │                                                        │
│         │           [← Back]                    [Continue →]     │
│         │                                                        │
└──────────────────────────────────────────────────────────────────┘
```

### Results Page (Post-Assessment)

```
┌──────────────────────────────────────────────────────────────────┐
│ SIDEBAR │                    RESULTS                             │
│         │                                                        │
│         │  ┌────────────────────────────────────────────────────┐│
│         │  │ 🔴  HIGH-RISK SYSTEM                                ││
│         │  │     EU AI Act Annex III, Category 4                ││
│         │  └────────────────────────────────────────────────────┘│
│         │                                                        │
│         │  ┌─────────────────────┐ ┌───────────────────────────┐│
│         │  │ Readiness Score     │ │ Required Actions          ││
│         │  │                     │ │                           ││
│         │  │       34%           │ │ ☐ Conformity assessment   ││
│         │  │   ┌─────────────┐   │ │ ☐ Technical documentation ││
│         │  │   │ ██░░░░░░░░░ │   │ │ ☐ Quality management      ││
│         │  │   └─────────────┘   │ │ ☐ Human oversight         ││
│         │  │                     │ │ ☐ Accuracy monitoring     ││
│         │  │ Data:    45%        │ │                           ││
│         │  │ Infra:   28%        │ │ Timeline: 8-12 months     ││
│         │  │ Team:    52%        │ │ Est. cost: €75K-€300K     ││
│         │  │ Security:31%        │ │ With CERT: €0             ││
│         │  │ Docs:    15%        │ │                           ││
│         │  └─────────────────────┘ └───────────────────────────┘│
│         │                                                        │
│         │  ┌────────────────────────────────────────────────────┐│
│         │  │ Legal Reference                                    ││
│         │  │                                                    ││
│         │  │ Article 6(2): High-risk AI systems referred to in ││
│         │  │ Annex III shall comply with the requirements...   ││
│         │  └────────────────────────────────────────────────────┘│
│         │                                                        │
│         │  [Download Report PDF]        [Start Compliance Flow]  │
│         │                                                        │
└──────────────────────────────────────────────────────────────────┘
```

---

## Implementation Instructions

### Step 1: Clean Slate

1. Remove Chakra UI completely. Use only Tailwind CSS.
2. Delete all `.tsx.OLD` files
3. Create new `theme/` with the color/typography/spacing files above
4. Update `tailwind.config.ts` to use these tokens

### Step 2: Core Components

Build in this order:
1. Layout (Sidebar + Main container)
2. MetricCard
3. Button
4. Badge
5. DataTable
6. Charts (AreaChart, BarChart)
7. Forms (Input, Select, Checkbox)

### Step 3: Pages

Rebuild pages using only the new components:
1. Overview (dashboard home)
2. Assessment (wizard flow)
3. Costs (cost analytics)
4. Optimization (recommendations)
5. Compliance (document generation)

### Step 4: Polish

1. Add transitions (150ms ease on all interactive elements)
2. Add focus states (visible focus ring for accessibility)
3. Add dark mode (use backgroundDark colors)
4. Add loading states (skeleton components)
5. Add empty states (helpful illustrations + CTAs)

---

## Tailwind Config

```typescript
// tailwind.config.ts

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          page: '#FAFAFA',
          surface: '#FFFFFF',
          elevated: '#FFFFFF',
          subtle: '#F4F4F5',
        },
        foreground: {
          primary: '#09090B',
          secondary: '#71717A',
          tertiary: '#A1A1AA',
        },
        border: {
          DEFAULT: '#E4E4E7',
          subtle: '#F4F4F5',
        },
        brand: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          active: '#1E40AF',
        },
        success: {
          bg: '#F0FDF4',
          text: '#166534',
          icon: '#22C55E',
        },
        warning: {
          bg: '#FFFBEB',
          text: '#A16207',
          icon: '#F59E0B',
        },
        error: {
          bg: '#FEF2F2',
          text: '#B91C1C',
          icon: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SF Mono"', 'Consolas', 'monospace'],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['13px', { lineHeight: '20px' }],
        base: ['14px', { lineHeight: '20px' }],
        lg: ['16px', { lineHeight: '24px' }],
        xl: ['18px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
      },
      spacing: {
        sidebar: '240px',
        header: '56px',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 / 0.03), 0 1px 6px -1px rgb(0 0 0 / 0.02)',
        elevated: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        lg: '8px',
        xl: '12px',
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## Example Component: MetricCard

```tsx
// components/MetricCard.tsx

import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    positive: boolean;
  };
  className?: string;
}

export function MetricCard({ label, value, trend, className }: MetricCardProps) {
  return (
    <div
      className={cn(
        'bg-background-surface border border-border rounded-lg p-5 shadow-card',
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-foreground-secondary">{label}</span>
        {trend && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-medium',
              trend.positive ? 'text-success-text' : 'text-error-text'
            )}
          >
            {trend.direction === 'up' ? (
              <ArrowUp className="w-3 h-3" />
            ) : (
              <ArrowDown className="w-3 h-3" />
            )}
            {trend.value}%
          </span>
        )}
      </div>
      <div className="text-2xl font-semibold text-foreground-primary tracking-tight">
        {value}
      </div>
    </div>
  );
}
```

---

## Final Checklist

Before shipping, verify:

- [ ] No Chakra UI imports anywhere
- [ ] All colors come from theme tokens
- [ ] All spacing uses the 4/8/12/16/24/32/48/64 scale
- [ ] All interactive elements have hover/focus states
- [ ] All text uses the typography scale (no arbitrary font sizes)
- [ ] Charts use consistent styling (grid, axes, tooltips)
- [ ] Tables are scannable (good alignment, clear hierarchy)
- [ ] Loading states exist for async operations
- [ ] Dark mode works and looks intentional
- [ ] Mobile responsive (sidebar collapses, cards stack)

---

## Reference Links

Study these dashboards:
- Stripe Dashboard: https://dashboard.stripe.com
- Linear: https://linear.app
- Vercel: https://vercel.com/dashboard
- Posthog: https://app.posthog.com

Study these design systems:
- Radix Themes: https://www.radix-ui.com/themes
- shadcn/ui: https://ui.shadcn.com
- Tailwind UI: https://tailwindui.com

---

**Remember:** The goal is not to copy Stripe. The goal is to create a dashboard that feels as trustworthy and professional as Stripe. That comes from consistency, hierarchy, and restraint—not from any specific visual treatment.
