import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export async function GET() {
  try {
    const resultsPath = path.join(os.homedir(), '.cert', 'results.json');

    // Check if results file exists
    if (!fs.existsSync(resultsPath)) {
      return NextResponse.json([]);
    }

    // Read and parse results
    const data = fs.readFileSync(resultsPath, 'utf-8');
    const results = JSON.parse(data);

    // Convert timestamp strings back to Date objects for sorting
    const sorted = results
      .map((r: any) => ({
        ...r,
        timestamp: new Date(r.timestamp),
      }))
      .sort((a: any, b: any) => b.timestamp.getTime() - a.timestamp.getTime());

    return NextResponse.json(sorted);
  } catch (error) {
    console.error('Error reading test results:', error);
    return NextResponse.json({ error: 'Failed to load test results' }, { status: 500 });
  }
}
