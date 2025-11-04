# Deploy CERT Report API to Railway

This guide will help you deploy the Python FastAPI backend to Railway.

## Prerequisites

✅ Railway CLI is already installed
✅ Configuration files are ready (railway.toml, nixpacks.toml)
✅ Code is pushed to GitHub

## Step 1: Login to Railway

Open a terminal and run:

```bash
cd /Users/javiermarin/cert-framework
railway login
```

This will open your browser for authentication. Log in with:
- GitHub account (recommended)
- Email
- Or create a new Railway account

## Step 2: Initialize Railway Project

```bash
railway init
```

When prompted:
- **Project name:** `cert-report-api` (or your preferred name)
- **Link to existing project?** Choose "No" (create new) unless you already have one

This creates a `.railway` directory (already in .gitignore).

## Step 3: Deploy to Railway

```bash
railway up
```

This command will:
1. Upload your code to Railway
2. Detect Python project automatically
3. Install system dependencies from `nixpacks.toml`:
   - python310
   - cairo (for PDF generation)
   - pango (for text rendering)
   - gdk-pixbuf (for image handling)
   - libffi (for WeasyPrint)
4. Install Python dependencies from `requirements.txt`
5. Start the app with: `uvicorn cert.api.report_api:app --host 0.0.0.0 --port $PORT`

**Expected output:**
```
🚀 Building...
✓ Build successful
🚂 Deploying...
✓ Deployment successful
```

## Step 4: Get Your API URL

After deployment completes, get your public URL:

```bash
railway domain
```

Or run:
```bash
railway status
```

This will show your deployment URL, something like:
```
https://cert-report-api-production.up.railway.app
```

**Save this URL** - you'll need it for Vercel configuration!

## Step 5: Test the Deployment

Test the health check endpoint:

```bash
# Replace with your actual Railway URL
curl https://your-app.up.railway.app/health
```

Expected response:
```json
{"status":"healthy","service":"CERT Report API"}
```

## Step 6: Configure Vercel Environment Variable

Now connect your Vercel dashboard to the Railway backend:

### Option A: Using Vercel Dashboard (Recommended)

1. Go to: https://vercel.com/javihaus-projects/dashboard/settings/environment-variables
2. Click "Add New"
3. Enter:
   - **Key:** `PYTHON_BACKEND_URL`
   - **Value:** Your Railway URL (e.g., `https://cert-report-api-production.up.railway.app`)
   - **Environment:** Select "Production", "Preview", and "Development"
4. Click "Save"
5. Redeploy dashboard: Go to Deployments → Click "..." → "Redeploy"

### Option B: Using Vercel CLI

```bash
cd dashboard

# Set production environment variable
vercel env add PYTHON_BACKEND_URL production

# When prompted, paste your Railway URL
# Example: https://cert-report-api-production.up.railway.app

# Redeploy
vercel --prod
```

## Step 7: Verify End-to-End

1. Go to: https://dashboard-javihaus-projects.vercel.app
2. Load evaluation data (Load Data tab)
3. Navigate to Report tab
4. Fill in metadata
5. Click "Download PDF Report"
6. ✅ PDF should download successfully!

## Railway CLI Commands Reference

```bash
# View deployment logs
railway logs

# Open Railway dashboard in browser
railway open

# Check deployment status
railway status

# View environment variables
railway variables

# Redeploy (after code changes)
git push  # Push to GitHub
railway up  # Redeploy to Railway

# Delete service (if needed)
railway down
```

## Troubleshooting

### Build Fails - Missing System Dependencies

If build fails with WeasyPrint errors, verify `nixpacks.toml` includes:
```toml
nixPkgs = ["python310", "cairo", "pango", "gdk-pixbuf", "libffi"]
```

### Service Won't Start

Check logs:
```bash
railway logs
```

Common issues:
- Port binding: Railway sets `$PORT` automatically, our config uses it
- Import errors: Check all dependencies in `requirements.txt`

### Health Check Fails

Railway health check hits `/health` endpoint. Verify it responds:
```bash
curl https://your-app.up.railway.app/health
```

### PDF Generation Fails

Test the API directly:
```bash
curl -X POST https://your-app.up.railway.app/api/generate-report \
  -H "Content-Type: application/json" \
  -d @test_payload.json \
  --output test_report.pdf
```

## Cost Information

Railway offers:
- **Free Trial:** $5 credit (no credit card required)
- **Hobby Plan:** $5/month for 500 hours
- **Pay as you go:** After free hours

The CERT Report API is lightweight:
- Small memory footprint (~200MB)
- Only uses resources when generating reports
- Should stay within free tier for moderate use

## Alternative: Deploy with GitHub Integration

Railway can auto-deploy from GitHub:

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose `Javihaus/cert-framework`
5. Railway will automatically detect Python and deploy
6. Set root directory to `/` (default)
7. Railway uses `railway.toml` for configuration

## Environment Variables

Railway automatically provides:
- `PORT` - Port to bind to
- `RAILWAY_ENVIRONMENT` - production/staging
- `RAILWAY_PUBLIC_DOMAIN` - Your public URL

No additional environment variables needed for the report API!

## Next Steps After Deployment

Once Railway backend is deployed and Vercel is configured:

1. ✅ Report tab visible in dashboard
2. ✅ Python backend running on Railway
3. ✅ Vercel knows backend URL
4. ✅ End-to-end PDF generation works!

---

**Questions?** Check Railway docs: https://docs.railway.app/
