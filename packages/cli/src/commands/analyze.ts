import { JSONStorage } from '@cert/core';
import * as path from 'path';
import * as os from 'os';

interface AnalyzeOptions {
  detectDegradation?: boolean;
  testId?: string;
  days: string;
}

export async function analyzeCommand(options: AnalyzeOptions) {
  // Use same JSON storage as test command
  const resultsPath = path.join(os.homedir(), '.cert', 'results.json');
  const storage = new JSONStorage(resultsPath);
  const days = parseInt(options.days, 10);

  if (options.detectDegradation) {
    console.log('Checking for metric degradation...\n');

    if (options.testId) {
      // Check specific test
      const alert = storage.detectDegradation(options.testId);

      if (alert) {
        console.log(`⚠️  ${alert.severity.toUpperCase()}: ${alert.message}`);
        console.log(`Test: ${alert.testId}`);
        process.exit(1);
      } else {
        console.log(`✓ No degradation detected for ${options.testId}`);
        process.exit(0);
      }
    } else {
      // Check all tests
      console.log('Degradation detection for all tests not yet implemented');
      console.log('Please specify --test-id <id> to check a specific test');
      process.exit(0);
    }
  }

  if (options.testId) {
    console.log(`Analyzing test: ${options.testId}`);
    console.log(`History: ${days} days\n`);

    const history = storage.getHistory(options.testId, days);

    if (history.length === 0) {
      console.log('No test history found');
      process.exit(0);
    }

    console.log(`Found ${history.length} test runs\n`);

    // Calculate statistics
    const consistencyScores = history
      .map((r: any) => r.consistency)
      .filter((c: any): c is number => c !== undefined);

    if (consistencyScores.length > 0) {
      const avg =
        consistencyScores.reduce((a: number, b: number) => a + b, 0) / consistencyScores.length;
      const min = Math.min(...consistencyScores);
      const max = Math.max(...consistencyScores);

      console.log('Consistency Statistics:');
      console.log(`  Average: ${(avg * 100).toFixed(1)}%`);
      console.log(`  Min: ${(min * 100).toFixed(1)}%`);
      console.log(`  Max: ${(max * 100).toFixed(1)}%`);
      console.log(`  Range: ${((max - min) * 100).toFixed(1)}%`);
    }

    // Show recent failures
    const failures = history.filter((r: any) => r.status === 'fail').slice(0, 5);

    if (failures.length > 0) {
      console.log(`\nRecent Failures (${failures.length}):`);
      failures.forEach((f: any) => {
        console.log(`  ${f.timestamp.toISOString()}: ${f.diagnosis}`);
      });
    }
  } else {
    console.log('Please specify --test-id <id> to analyze a specific test');
    console.log('Or use --detect-degradation to check for metric degradation');
  }

  storage.close();
}
