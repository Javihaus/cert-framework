# cert-framework Integration Guide

## Overview

The cert-framework ecosystem has two parts:

1. **Python SDK** (`cert-framework`): Core monitoring and evaluation
2. **TypeScript Dashboard**: Visualization and reporting

## Workflow

### Step 1: Install Python SDK
```bash
pip install cert-framework[evaluation]
```

### Step 2: Instrument Your Code
```python
from cert import trace

@trace(log_path="production_traces.jsonl")
def your_rag_pipeline(query: str) -> dict:
    context = retrieve_documents(query)
    answer = llm.generate(context, query)
    return {"context": context, "answer": answer, "query": query}
```

### Step 3: Run Evaluation
```python
from cert.evaluation import Evaluator

evaluator = Evaluator(threshold=0.7)
results = evaluator.evaluate_log_file(
    log_file="production_traces.jsonl",
    output="evaluation_results.json"
)
```

### Step 4: Visualize in Dashboard

1. Start the dashboard: `cd dashboard && npm run dev`
2. Open http://localhost:3000
3. Upload `evaluation_results.json`
4. View accuracy metrics, confidence scores, and individual results

## File Formats

### Trace File (JSONL)

Each line is a JSON object:
```json
{
  "timestamp": "2025-10-31T10:30:00Z",
  "query": "What was revenue?",
  "context": "Apple reported Q4 revenue of $89.5B",
  "answer": "Revenue was $89.5B",
  "latency_ms": 234
}
```

### Evaluation Results (JSON)
```json
{
  "summary": {
    "total_traces": 100,
    "accuracy": 0.95,
    "mean_confidence": 0.823,
    ...
  },
  "results": [
    {
      "trace_id": "trace_001",
      "measurement": {
        "confidence": 0.89,
        "matched": true,
        ...
      }
    }
  ]
}
```

## Deployment

### Development
```bash
# Terminal 1: Python evaluation
python your_evaluation_script.py

# Terminal 2: Dashboard
cd dashboard && npm run dev
```

### Production
```bash
# Build dashboard for production
cd dashboard
npm run build
npm run start

# Or deploy to Vercel
vercel deploy
```

## API Integration (Future)

The dashboard currently works with file uploads. Future versions will support:

- Real-time API endpoints
- Automatic evaluation scheduling
- Multi-system dashboards
- Team collaboration features

For now, use the file-based workflow - it's simple and works.
