# Deployment Information

## Production Dashboard

**Live URL:** https://dashboard-5u0pn29i0-javihaus-projects.vercel.app

## Deployment Details

- **Platform:** Vercel
- **Project Name:** dashboard
- **Repository:** https://github.com/Javihaus/cert-framework
- **Branch:** master
- **Deploy Directory:** /dashboard
- **Framework:** Next.js 16.0.1
- **Node Version:** 20.x (Vercel default)

## Automatic Deployments

The dashboard is configured for automatic deployments via Vercel's GitHub integration:

### How it works:
1. Push code to `master` branch
2. Vercel automatically detects the push
3. Builds the dashboard (`npm run build`)
4. Deploys to production
5. Updates the production URL
6. Sends deployment notification

### Deployment triggers:
- ✅ Push to master → Production deployment
- ✅ Pull request → Preview deployment (separate URL)
- ✅ Manual: `vercel --prod` from CLI

## Testing the Dashboard

### Sample Data
A sample evaluation file is included at:
- **URL:** https://dashboard-5u0pn29i0-javihaus-projects.vercel.app/sample_evaluation.json
- **Local:** `/dashboard/public/sample_evaluation.json`

### Test Steps:
1. Open the production URL
2. Download the sample evaluation file
3. Upload it to the dashboard
4. Verify metrics display (90% accuracy, 0.85 confidence)
5. Click "Details" on a result to view full information

## Generating Evaluation Files

To generate evaluation files for the dashboard:

```python
from cert.evaluation import Evaluator

evaluator = Evaluator(threshold=0.7)
results = evaluator.evaluate_log_file(
    log_file="production_traces.jsonl",
    output="evaluation_results.json"
)
```

The output file can be directly uploaded to the dashboard.

## File Format

The dashboard expects JSON files with this structure:

```json
{
  "summary": {
    "total_traces": 100,
    "evaluated_traces": 100,
    "passed_traces": 95,
    "failed_traces": 5,
    "accuracy": 0.95,
    "mean_confidence": 0.823,
    "threshold_used": 0.7,
    "date_range": {
      "start": "2025-10-01",
      "end": "2025-10-31"
    }
  },
  "results": [
    {
      "trace_id": "trace_001",
      "timestamp": "2025-10-15T10:30:00Z",
      "query": "Your query here",
      "measurement": {
        "matched": true,
        "confidence": 0.89,
        "semantic_score": 0.92,
        "grounding_score": 0.86,
        "threshold_used": 0.7,
        "rule": "Match (confidence 0.89 >= threshold 0.70)",
        "components_used": ["semantic", "grounding"]
      },
      "passed": true
    }
  ]
}
```

## Monitoring

### Vercel Dashboard
- View deployment logs: https://vercel.com/javihaus-projects/dashboard
- Monitor analytics and performance metrics
- Check build status and errors

### CLI Commands
```bash
# Check deployment status
vercel inspect <deployment-url> --logs

# Redeploy
vercel redeploy <deployment-url>

# Deploy to production
cd dashboard && vercel --prod
```

## Troubleshooting

### Build Fails
1. Check Vercel deployment logs
2. Verify build works locally: `npm run build`
3. Check for TypeScript errors
4. Verify dependencies in package.json

### Upload Errors
1. Verify JSON file is valid (use https://jsonlint.com)
2. Check browser console (F12) for errors
3. Ensure file has `summary` and `results` fields
4. Verify `results` is an array

### Performance Issues
- Dashboard is client-side only (no backend needed)
- Large files (>10MB) may be slow to process
- Consider pagination for files with >1000 results

## Production Checklist

✅ Production build tested locally
✅ Vercel CLI installed and authenticated
✅ Deployed to production
✅ File upload working
✅ Metrics displaying correctly
✅ Detail modal working
✅ Sample data available
✅ GitHub integration active
✅ Documentation complete

## Next Steps

1. **Generate real evaluation data** from your production traces
2. **Test with larger datasets** to verify performance
3. **Share the URL** with stakeholders for feedback
4. **Monitor usage** via Vercel analytics
5. **Iterate based on feedback**

## Support

For issues or questions:
- GitHub Issues: https://github.com/Javihaus/cert-framework/issues
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
