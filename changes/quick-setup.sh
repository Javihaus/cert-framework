#!/bin/bash
# CERT Dashboard 2.0 - Quick Implementation Script
# Execute this from the dashboard directory

echo "🚀 Starting CERT Dashboard 2.0 Migration..."

# Step 1: Backup current dashboard
echo "📦 Step 1: Creating backup..."
cp -r . ../dashboard-backup-$(date +%Y%m%d)

# Step 2: Install dependencies
echo "📦 Step 2: Installing dependencies..."
npm install framer-motion@^11.0.0 recharts@^2.12.0 @heroicons/react@^2.1.1 tailwindcss@^3.4.0 @tailwindcss/forms@^0.5.7 react-hot-toast@^2.4.1 swr@^2.2.4 zustand@^4.4.7

# Step 3: Create directory structure
echo "📁 Step 3: Creating directory structure..."
mkdir -p app/components/layout
mkdir -p app/components/charts
mkdir -p app/components/cards
mkdir -p app/monitoring
mkdir -p app/compliance
mkdir -p app/assessments
mkdir -p app/reports
mkdir -p app/analytics
mkdir -p app/settings
mkdir -p public/images

# Step 4: Download CERT logo
echo "🎨 Step 4: Downloading CERT logo..."
curl -o public/images/cert-logo.png https://raw.githubusercontent.com/Javihaus/cert-framework/master/docs/CERT_LOGO_NEW_1.png

# Step 5: Create main layout component
echo "🔧 Step 5: Creating layout component..."
cat > app/components/layout/DashboardLayout.tsx << 'LAYOUT_END'
// Copy content from new-dashboard-layout.tsx here
LAYOUT_END

# Step 6: Create main page
echo "📊 Step 6: Creating main overview page..."
cat > app/page.tsx << 'PAGE_END'
// Copy content from overview-dashboard.tsx here
PAGE_END

# Step 7: Create monitoring page
echo "📡 Step 7: Creating monitoring page..."
cat > app/monitoring/page.tsx << 'MONITORING_END'
// Copy content from monitoring-dashboard.tsx here
MONITORING_END

# Step 8: Update tailwind config
echo "🎨 Step 8: Updating Tailwind configuration..."
cat > tailwind.config.js << 'TAILWIND_END'
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          950: '#0a0a0b',
        },
      },
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
TAILWIND_END

# Step 9: Create environment variables
echo "🔐 Step 9: Creating environment variables..."
cat > .env.local << 'ENV_END'
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_DASHBOARD_URL=http://localhost:3000
NEXT_PUBLIC_ENVIRONMENT=development
ENV_END

cat > .env.production << 'ENV_PROD_END'
NEXT_PUBLIC_API_URL=https://api.cert-framework.com
NEXT_PUBLIC_DASHBOARD_URL=https://dashboard.cert-framework.com
NEXT_PUBLIC_ENVIRONMENT=production
ENV_PROD_END

# Step 10: Create other necessary pages
echo "📄 Step 10: Creating additional pages..."

# Compliance Page
cat > app/compliance/page.tsx << 'COMPLIANCE_END'
'use client';
import React from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function CompliancePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          EU AI Act Compliance Center
        </h1>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
        <p className="text-gray-600 dark:text-gray-400">
          Article 15 compliance tracking and documentation coming soon...
        </p>
      </div>
    </div>
  );
}
COMPLIANCE_END

# Assessments Page
cat > app/assessments/page.tsx << 'ASSESSMENTS_END'
'use client';
import React from 'react';
import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';

export default function AssessmentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <ClipboardDocumentCheckIcon className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Risk Assessment
        </h1>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
        <p className="text-gray-600 dark:text-gray-400">
          AI system risk classification and evaluation coming soon...
        </p>
      </div>
    </div>
  );
}
ASSESSMENTS_END

# Reports Page
cat > app/reports/page.tsx << 'REPORTS_END'
'use client';
import React from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <DocumentTextIcon className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Reports & Documentation
        </h1>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
        <p className="text-gray-600 dark:text-gray-400">
          Generate compliance documentation and reports...
        </p>
      </div>
    </div>
  );
}
REPORTS_END

# Analytics Page
cat > app/analytics/page.tsx << 'ANALYTICS_END'
'use client';
import React from 'react';
import { ChartPieIcon } from '@heroicons/react/24/outline';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <ChartPieIcon className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Analytics & Insights
        </h1>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
        <p className="text-gray-600 dark:text-gray-400">
          Cost analysis and performance insights coming soon...
        </p>
      </div>
    </div>
  );
}
ANALYTICS_END

# Settings Page
cat > app/settings/page.tsx << 'SETTINGS_END'
'use client';
import React from 'react';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Cog6ToothIcon className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
        <p className="text-gray-600 dark:text-gray-400">
          Configuration and API keys management coming soon...
        </p>
      </div>
    </div>
  );
}
SETTINGS_END

# Step 11: Run development server
echo "✅ Migration complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the content from the provided files into the created components"
echo "2. Run: npm run dev"
echo "3. Visit: http://localhost:3000"
echo ""
echo "🎯 Remember to:"
echo "- Test dark mode toggle"
echo "- Check responsive design on mobile"
echo "- Verify all navigation links work"
echo "- Test chart rendering"
echo "- Check performance metrics"
echo ""
echo "🚀 Your CERT Dashboard 2.0 is ready for development!"