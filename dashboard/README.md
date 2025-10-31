# cert-framework Dashboard

A Next.js dashboard for visualizing cert-framework evaluation results.

## Getting Started

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Production Build

```bash
npm run build
npm run start
```

## Usage

1. Generate evaluation results using cert-framework:
   ```python
   from cert.evaluation import Evaluator

   evaluator = Evaluator(threshold=0.7)
   results = evaluator.evaluate_log_file(
       log_file="production_traces.jsonl",
       output="evaluation_results.json"
   )
   ```

2. Open the dashboard and upload `evaluation_results.json`

3. View accuracy metrics, confidence scores, and detailed results

## Features

- Upload evaluation result files (JSON)
- View summary metrics (accuracy, confidence, pass/fail counts)
- Browse individual evaluation results
- Detailed view for each trace evaluation

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment instructions.
