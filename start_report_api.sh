#!/bin/bash
# Start CERT Report Generation API
#
# This script starts the Python FastAPI backend for report generation.
# The API runs on http://localhost:8000

set -e

echo "🚀 Starting CERT Report Generation API..."
echo ""
echo "API will be available at: http://localhost:8000"
echo "Health check: http://localhost:8000/health"
echo "API docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Check if dependencies are installed
if ! python3 -c "import fastapi" 2>/dev/null; then
    echo "❌ Error: fastapi not installed"
    echo "Run: pip install fastapi uvicorn weasyprint pydantic"
    exit 1
fi

if ! python3 -c "import weasyprint" 2>/dev/null; then
    echo "⚠️  Warning: weasyprint not installed"
    echo "PDF generation will not work without weasyprint"
    echo "Run: pip install weasyprint"
    echo ""
    echo "On macOS, you may also need: brew install python3 cairo pango gdk-pixbuf libffi"
    echo ""
fi

# Start the API server
python3 -m uvicorn cert.api.report_api:app --host 0.0.0.0 --port 8000 --reload
