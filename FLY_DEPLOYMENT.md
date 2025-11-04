# Deploy CERT Report API to Fly.io

This guide walks you through deploying the Python FastAPI backend to Fly.io's free tier.

## Why Fly.io?

✅ **Free Tier:** 3 shared-cpu VMs, 160GB bandwidth/month
✅ **No Cold Starts:** Always-on instances (unlike Render)
✅ **Auto-scaling:** Scales to zero when idle, auto-starts on request
✅ **Global Edge Network:** Fast response times worldwide
✅ **Simple Deployment:** Similar ease to Railway

## Prerequisites

- Fly.io account (sign up at https://fly.io)
- Docker installed locally (for testing)
- Git repository pushed to GitHub

## Step 1: Install Fly.io CLI

### macOS/Linux:
```bash
curl -L https://fly.io/install.sh | sh
```

### Windows (PowerShell):
```powershell
pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

Verify installation:
```bash
flyctl version
```

## Step 2: Authenticate

```bash
cd /Users/javiermarin/cert-framework
flyctl auth login
```

This opens your browser for authentication. Sign in with:
- GitHub (recommended)
- Email
- Google

## Step 3: Launch the App

```bash
flyctl launch
```

This interactive command will:
1. **Detect configuration:** Uses `fly.toml` we created
2. **Choose app name:** Press Enter to accept `cert-report-api` or customize
3. **Select region:** Choose closest to your users (default: `iad` - Washington D.C.)
4. **Setup Postgres?** → **No** (we don't need a database)
5. **Deploy now?** → **Yes**

Expected output:
```
Creating app in /Users/javiermarin/cert-framework
We're about to launch your app on Fly.io. Here's what you're getting:

Organization: Your Name              (fly launch defaults to the personal org)
Name:         cert-report-api        (from fly.toml)
Region:       Washington D.C. (iad)  (from fly.toml)
App Machines: shared-cpu-1x, 512MB RAM (from fly.toml)

? Do you want to deploy now? Yes

==> Building image
...
--> Building Dockerfile.api
...
==> Pushing image to fly.io
...
==> Creating release
...
--> v0 deployed successfully

Visit your newly deployed app at https://cert-report-api.fly.dev
```

## Step 4: Verify Deployment

Test the health endpoint:

```bash
# Get your app URL
flyctl status

# Test health check
curl https://cert-report-api.fly.dev/health
```

Expected response:
```json
{"status":"healthy","service":"CERT Report API"}
```

## Step 5: Configure Vercel Environment Variable

Now connect your Vercel dashboard to the Fly.io backend:

### Option A: Vercel Dashboard (Recommended)

1. Go to: https://vercel.com/javihaus-projects/dashboard/settings/environment-variables
2. Click **"Add New"**
3. Configure:
   - **Key:** `PYTHON_BACKEND_URL`
   - **Value:** `https://cert-report-api.fly.dev` (your Fly.io URL)
   - **Environments:** Select all (Production, Preview, Development)
4. Click **"Save"**
5. **Redeploy:** Go to Deployments → Click "..." on latest → "Redeploy"

### Option B: Vercel CLI

```bash
cd dashboard

# Add environment variable
vercel env add PYTHON_BACKEND_URL production

# When prompted, enter: https://cert-report-api.fly.dev

# Redeploy
vercel --prod
```

## Step 6: Test End-to-End! 🎉

1. Visit: https://dashboard-javihaus-projects.vercel.app
2. Click **"Load Data"** → Upload evaluation JSON
3. Click **"Report"** tab
4. Fill in metadata fields
5. Click **"Download PDF Report"**
6. ✅ **PDF downloads successfully!**

## Fly.io CLI Commands Reference

```bash
# View deployment status
flyctl status

# View live logs
flyctl logs

# Open app in browser
flyctl open

# Open Fly.io dashboard
flyctl dashboard

# Scale machines (if needed)
flyctl scale count 1  # Run 1 instance always

# Update after code changes
git push  # Push to GitHub
flyctl deploy  # Deploy to Fly.io

# SSH into running machine (debugging)
flyctl ssh console

# View secrets/environment variables
flyctl secrets list

# Destroy app (if needed)
flyctl apps destroy cert-report-api
```

## Configuration Details

### Dockerfile.api
- Multi-stage build for smaller image (~200MB)
- Includes WeasyPrint system dependencies (cairo, pango, gdk-pixbuf)
- Python 3.10 slim base image
- Health check endpoint

### fly.toml
- **Auto-scaling:** Scales to 0 when idle (free tier friendly)
- **Auto-start:** Starts on first request
- **Health checks:** `/health` endpoint monitored every 30s
- **Memory:** 512MB (enough for PDF generation)
- **Region:** `iad` (Washington D.C.) - change if needed

### Cost Breakdown

**Free Tier Includes:**
- 3 shared-cpu-1x VMs (256MB RAM each)
- 3GB persistent volume storage
- 160GB outbound data transfer

**Your App Uses:**
- 1 VM with 512MB RAM (counts as 2 VMs from free tier)
- Minimal bandwidth (PDFs are ~1-5MB each)
- No persistent storage needed

**Estimate:** Stays within free tier for moderate use (few hundred reports/month)

## Customization

### Change Region

Edit `fly.toml`:
```toml
primary_region = "fra"  # Frankfurt
# or "lax" (Los Angeles), "syd" (Sydney), etc.
```

Then:
```bash
flyctl deploy
```

### Always-On (No Auto-Stop)

Edit `fly.toml`:
```toml
[http_service]
  auto_stop_machines = "off"
  min_machines_running = 1
```

**Note:** Uses more free tier resources but eliminates startup delay.

### Add More Memory

Edit `fly.toml`:
```toml
[[vm]]
  memory = '1gb'
```

**Note:** Uses more of your free tier quota.

## Troubleshooting

### Build Fails

**Error:** `failed to solve: failed to copy files`

**Solution:** Check `.dockerignore` - ensure it's not excluding required files.

```bash
# Test Docker build locally
docker build -f Dockerfile.api -t cert-api-test .
docker run -p 8080:8080 cert-api-test
```

### Health Check Fails

**Error:** `Health check on port 8080 failed`

**Solution:** Verify the `/health` endpoint responds:

```bash
flyctl logs
```

Look for startup errors. Common issues:
- Missing dependencies in requirements.txt
- Import errors in Python code

### WeasyPrint Errors

**Error:** `OSError: cannot load library 'gobject-2.0-0'`

**Solution:** Verify Dockerfile.api includes all WeasyPrint dependencies:
```dockerfile
libcairo2 libpango-1.0-0 libpangoft2-1.0-0 libgdk-pixbuf2.0-0 libffi8
```

### App Won't Start

Check logs:
```bash
flyctl logs --app cert-report-api
```

Common issues:
- Port mismatch (ensure using port 8080)
- Import errors (check `cert.api.report_api` path)
- Missing environment variables

### Slow Response Times

**Cause:** App scaled to zero, cold start on first request

**Solutions:**

**Option 1:** Keep 1 instance running:
```bash
flyctl scale count 1 --region iad
```

**Option 2:** Use Fly.io's "keep warm" service (paid)

## Monitoring

### View Metrics

```bash
# App dashboard
flyctl dashboard

# Real-time logs
flyctl logs --app cert-report-api

# Machine status
flyctl status
```

### Fly.io Dashboard

Web interface: https://fly.io/dashboard

View:
- Deployment history
- Metrics (CPU, memory, requests)
- Logs
- Certificates (SSL)
- Secrets

## Updating the App

After code changes:

```bash
# Commit changes
git add .
git commit -m "Update report API"
git push

# Deploy to Fly.io
flyctl deploy
```

Fly.io rebuilds the Docker image and deploys with zero downtime.

## Security Notes

- ✅ Fly.io provides automatic SSL/TLS certificates
- ✅ Dockerfile runs as non-root user (security best practice)
- ✅ Health checks ensure app availability
- ✅ Auto-scaling prevents resource exhaustion

## Alternative: Deploy from GitHub

Fly.io can auto-deploy from GitHub:

1. Go to: https://fly.io/dashboard
2. Click "Create App"
3. Choose "Deploy from GitHub"
4. Select repository: `Javihaus/cert-framework`
5. Fly.io auto-detects `fly.toml` and `Dockerfile.api`
6. Configure auto-deploy on push

## Comparing to Railway

| Feature | Fly.io | Railway |
|---------|--------|---------|
| Free Tier | ✅ 3 VMs, 160GB | ✅ $5 credit |
| Cold Starts | ❌ No (always on) | ❌ No |
| Setup Time | 5 min | 3 min |
| Docker | ✅ Required | ❌ Optional |
| Auto-deploy | ✅ Yes | ✅ Yes |
| Global Edge | ✅ Yes | ❌ Limited |

## Next Steps

✅ Backend deployed to Fly.io
✅ Vercel configured with backend URL
✅ End-to-end PDF generation working

**Optional Enhancements:**
1. Add Fly.io monitoring/alerts
2. Deploy to multiple regions for global performance
3. Set up staging environment
4. Configure GitHub Actions for CI/CD

## Support

- Fly.io Docs: https://fly.io/docs
- Community Forum: https://community.fly.io
- Status Page: https://status.fly.io

---

**Ready to deploy?** Just run:
```bash
flyctl launch
```

Your CERT Report API will be live in ~5 minutes! 🚀
