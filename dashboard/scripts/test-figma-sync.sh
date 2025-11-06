#!/bin/bash

# Test Figma Sync Setup
# This script helps you test the Figma sync locally

echo "🎨 Figma Sync Test Script"
echo "========================="
echo ""

# Check if environment variables are set
if [ -z "$FIGMA_FILE_ID" ]; then
    echo "❌ FIGMA_FILE_ID is not set"
    echo "Please set it:"
    echo "  export FIGMA_FILE_ID=\"your-file-id-here\""
    echo ""
    exit 1
fi

if [ -z "$FIGMA_ACCESS_TOKEN" ]; then
    echo "❌ FIGMA_ACCESS_TOKEN is not set"
    echo "Please set it:"
    echo "  export FIGMA_ACCESS_TOKEN=\"figd_your-token-here\""
    echo ""
    exit 1
fi

echo "✅ Environment variables are set"
echo "   File ID: $FIGMA_FILE_ID"
echo "   Token: ${FIGMA_ACCESS_TOKEN:0:10}..."
echo ""

# Test Figma API connection
echo "🔌 Testing Figma API connection..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "X-Figma-Token: $FIGMA_ACCESS_TOKEN" \
    "https://api.figma.com/v1/files/$FIGMA_FILE_ID")

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Connected to Figma API successfully"
else
    echo "❌ Failed to connect to Figma API (HTTP $HTTP_STATUS)"
    if [ "$HTTP_STATUS" = "403" ]; then
        echo "   → Check your access token"
    elif [ "$HTTP_STATUS" = "404" ]; then
        echo "   → Check your file ID"
    fi
    exit 1
fi

echo ""
echo "🚀 Running sync script..."
echo ""

# Run the sync script
node scripts/figma-sync.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Sync completed successfully!"
    echo ""
    echo "📁 Generated files:"
    if [ -d "generated" ]; then
        ls -lh generated/
        echo ""
        if [ -f "generated/sync-report.json" ]; then
            echo "📊 Sync Report:"
            cat generated/sync-report.json | node -e "
                const data = JSON.parse(require('fs').readFileSync(0));
                console.log('   Figma File: ' + data.figmaFile);
                console.log('   Colors: ' + data.colorsCount);
                console.log('   Typography: ' + data.typographyCount);
                console.log('   Components: ' + data.componentsCount);
            "
        fi
    else
        echo "⚠️  No generated folder found"
    fi
else
    echo ""
    echo "❌ Sync failed"
    exit 1
fi
