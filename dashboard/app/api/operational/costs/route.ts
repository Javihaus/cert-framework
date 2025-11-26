import { NextRequest, NextResponse } from 'next/server';
import { getCostMetrics } from '@/lib/trace-store';

/**
 * GET /api/operational/costs - Get cost metrics
 */
export async function GET(request: NextRequest) {
  const costs = await getCostMetrics();

  if (!costs) {
    return NextResponse.json({ costs: null, suggestions: [] });
  }

  // Generate optimization suggestions
  const suggestions: Array<{
    type: string;
    title: string;
    description: string;
    potentialSavings: number;
    confidence: number;
  }> = [];

  // Check for expensive model usage
  const expensiveModels = Object.entries(costs.byModel)
    .filter(([model]) => 
      model.includes('opus') || 
      (model.includes('gpt-4') && !model.includes('mini'))
    )
    .sort((a, b) => b[1] - a[1]);

  if (expensiveModels.length > 0) {
    const [model, cost] = expensiveModels[0];
    suggestions.push({
      type: 'model_downgrade',
      title: `Consider using a smaller model for some ${model} calls`,
      description: `Some of your ${model} calls could potentially use a smaller, cheaper model.`,
      potentialSavings: cost * 0.3 * 0.6,
      confidence: 0.7,
    });
  }

  return NextResponse.json({ costs, suggestions });
}
