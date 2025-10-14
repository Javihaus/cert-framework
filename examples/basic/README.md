# Basic CERT Example

This example demonstrates the core features of the CERT framework:

## Features Demonstrated

1. **Test Runner Setup**: Configure ground truth and semantic comparison
2. **Layer Enforcement**: Tests must pass retrieval → accuracy → consistency in order
3. **Consistency Testing**: Measure output stability across multiple runs
4. **Semantic Comparison**: Handle equivalent outputs (e.g., "$391B" = "$391 billion")
5. **Variance Diagnosis**: Automatic detection and explanation of inconsistencies
6. **Pipeline Analysis**: Identify which agent in a multi-step pipeline is causing failures

## Running the Example

```bash
npm install
npm test
```

## Expected Output

The example will:
- ✓ Pass all tests with temperature=0 (deterministic)
- ✗ Fail consistency test with temperature=0.5 (introduces variance)
- Show diagnostic messages explaining why variance occurred
- Provide actionable suggestions for fixing the issue
- Identify the specific agent in a pipeline that's causing variance

## Code Structure

```typescript
// 1. Set up test runner
const runner = new TestRunner();
runner.addGroundTruth({ ... });

// 2. Configure semantic comparison
const comparator = new SemanticComparator();
runner.setComparator(comparator);

// 3. Run tests (enforces order)
await runner.testRetrieval(...);  // Must pass first
await runner.testAccuracy(...);   // Requires retrieval to pass
await runner.testConsistency(...); // Requires accuracy to pass

// 4. Analyze pipelines
const analyzer = new PipelineAnalyzer();
const result = await analyzer.localizeFailure(pipeline, input, config);
```

## Key Concepts

### Ground Truth
Defines what the system should produce:
```typescript
{
  id: 'revenue-test',
  question: 'What was Apple revenue?',
  expected: '$391.035 billion',
  equivalents: ['391.035B', '$391,035,000,000']
}
```

### Layer Enforcement
Prevents testing consistency before validating accuracy:
```
❌ Cannot test consistency - accuracy test has not passed yet
```

### Consistency Measurement
Runs agent N times and counts unique outputs:
- Consistency = 1.0: All outputs identical (perfect)
- Consistency = 0.75: 25% of outputs differ (problematic)

### Pipeline Analysis
Binary search to find failing component:
```
Agent1: 100% consistent ✓
Agent1→2: 100% consistent ✓
Agent1→2→3: 75% consistent ✗ <- Formatter is the problem
```

## Next Steps

- Try modifying the `temperature` parameter
- Add more agents to the pipeline
- Experiment with different comparison rules
- Integrate with your own LLM system
