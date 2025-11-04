# CERT Dashboard - Report Generation Setup

This guide explains how to set up and use the PDF report generation feature in the CERT Dashboard.

## Overview

The Report tab allows you to generate professional PDF reports containing:
- Executive summary with compliance status
- Detailed evaluation metrics and statistics
- Score distribution visualization
- Failed trace analysis
- Recommendations for compliance improvement
- EU AI Act Article 15 & 19 alignment documentation

## Architecture

The report generation system consists of three components:

1. **Frontend (Next.js)**: `components/ReportView.tsx` - User interface for report configuration
2. **Next.js API Route**: `app/api/generate-report/route.ts` - Proxy to Python backend
3. **Python FastAPI Backend**: `cert/api/report_api.py` - PDF generation service

## Prerequisites

### Python Dependencies

Install the required Python packages:

```bash
# From the cert-framework root directory
pip install fastapi uvicorn weasyprint pydantic
```

Or install all requirements:

```bash
pip install -r requirements.txt
```

### System Dependencies for WeasyPrint

WeasyPrint requires system libraries for PDF generation:

**macOS:**
```bash
brew install python3 cairo pango gdk-pixbuf libffi
```

**Ubuntu/Debian:**
```bash
sudo apt-get install python3-pip python3-cffi python3-brotli libpango-1.0-0 libpangoft2-1.0-0
```

**Windows:**
Follow the [WeasyPrint Windows installation guide](https://doc.courtbouillon.org/weasyprint/stable/first_steps.html#windows)

## Configuration

### 1. Set Up Environment Variables

Create a `.env.local` file in the `dashboard` directory:

```bash
cd dashboard
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# For local development
PYTHON_BACKEND_URL=http://localhost:8000

# For production (example)
# PYTHON_BACKEND_URL=https://api.example.com
```

### 2. Start the Python Backend

From the cert-framework root directory:

```bash
# Development mode
python -m cert.api.report_api

# Or with uvicorn directly
uvicorn cert.api.report_api:app --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

### 3. Start the Next.js Dashboard

In a separate terminal:

```bash
cd dashboard
npm run dev
```

The dashboard will be available at `http://localhost:3000`

## Usage

1. **Load Evaluation Data**: Use the "Load Data" tab to upload your evaluation results JSON file

2. **Navigate to Report Tab**: Click on the "Report" tab in the navigation

3. **Configure Report Metadata**:
   - Report Title: Custom title for your report
   - Organization: Your organization name
   - Evaluator: Name of person conducting the evaluation
   - Additional Notes: Any context or notes to include

4. **Download Report**: Click "Download PDF Report" to generate and download the PDF

## Testing

### Test the Python Backend

```bash
# Check health endpoint
curl http://localhost:8000/health

# Should return: {"status":"healthy","service":"CERT Report API"}
```

### Test Report Generation

1. Load sample data in the dashboard
2. Navigate to the Report tab
3. Fill in the metadata fields
4. Click "Download PDF Report"
5. Verify the PDF downloads and opens correctly

## Deployment

### Development

For local development, run both servers on your machine:
- Python backend on port 8000
- Next.js dashboard on port 3000

### Production

#### Option 1: Same Server

1. Deploy Python backend as a systemd service or with supervisord
2. Configure nginx to proxy `/api/` requests to the Python backend
3. Deploy Next.js dashboard (build and serve with `npm run build && npm start`)

Example nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Next.js dashboard
    location / {
        proxy_pass http://localhost:3000;
    }

    # Python API backend
    location /api/ {
        proxy_pass http://localhost:8000/api/;
    }
}
```

#### Option 2: Separate Servers

1. Deploy Python backend to a separate server (e.g., `api.example.com`)
2. Deploy Next.js dashboard to Vercel or similar
3. Set `PYTHON_BACKEND_URL=https://api.example.com` in dashboard environment variables
4. Configure CORS in `cert/api/report_api.py` to allow dashboard origin

#### Option 3: Vercel (Dashboard) + Serverless Functions

For the Next.js dashboard on Vercel:

1. Deploy dashboard to Vercel
2. Deploy Python backend separately (AWS Lambda, Google Cloud Functions, etc.)
3. Set `PYTHON_BACKEND_URL` as Vercel environment variable

## Troubleshooting

### "Failed to generate report" Error

**Cause**: Python backend is not running or unreachable

**Solution**:
1. Check if Python backend is running: `curl http://localhost:8000/health`
2. Verify `PYTHON_BACKEND_URL` in `.env.local`
3. Check Python backend logs for errors

### "WeasyPrint not installed" Error

**Cause**: WeasyPrint package or system dependencies missing

**Solution**:
1. Install WeasyPrint: `pip install weasyprint`
2. Install system dependencies (see Prerequisites section)
3. Verify installation: `python -c "from weasyprint import HTML; print('OK')"`

### CORS Errors

**Cause**: Dashboard and Python backend on different origins

**Solution**:
Edit `cert/api/report_api.py` to allow your dashboard origin:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-dashboard.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### PDF Generation Timeout

**Cause**: Large evaluation files or slow server

**Solution**:
1. Increase timeout in Next.js API route (`app/api/generate-report/route.ts`)
2. Consider pagination for very large result sets
3. Add loading indicators in the UI

## Customization

### Report Styling

Edit `cert/api/report_api.py` - `generate_html_report()` function to customize:
- CSS styles
- Layout and sections
- Colors and branding
- Logo (add logo in HTML template)

### Report Content

Modify these functions in `cert/api/report_api.py`:
- `generate_recommendations()` - Customize recommendation logic
- `compute_score_distribution()` - Change distribution buckets
- `generate_failed_trace_section()` - Adjust failed trace analysis

## API Documentation

When the Python backend is running, view the interactive API documentation:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review logs from both Next.js and Python backend
3. Open an issue on the GitHub repository

## Security Notes

- Never commit `.env.local` files with sensitive credentials
- Use environment variables for production API URLs
- Implement authentication for production deployments
- Validate and sanitize user input in report metadata
- Use HTTPS for production API endpoints
