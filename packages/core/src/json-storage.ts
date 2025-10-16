import { TestResult, DegradationAlert } from './types.js';
import { MetricsStorage } from './storage.js';
import { mean } from './consistency.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * JSON file-based storage implementation.
 * Simpler than SQLite, no native dependencies, works everywhere.
 */
export class JSONStorage implements MetricsStorage {
  private filePath: string;
  private results: TestResult[] = [];

  constructor(filePath: string) {
    this.filePath = filePath;
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(data);
        // Convert timestamp strings back to Date objects
        this.results = parsed.map((r: any) => ({
          ...r,
          timestamp: new Date(r.timestamp),
        }));
      }
    } catch (error) {
      console.warn(`Warning: Could not load test results from ${this.filePath}`);
      this.results = [];
    }
  }

  private persist(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.results, null, 2), 'utf-8');
    } catch (error) {
      console.warn(`Warning: Could not save test results to ${this.filePath}`);
    }
  }

  save(result: TestResult): void {
    this.results.push(result);
    this.persist();
  }

  getHistory(testId: string, days: number = 30): TestResult[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return this.results
      .filter((r) => r.testId === testId && r.timestamp >= cutoff)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getAllResults(limit?: number): TestResult[] {
    const sorted = [...this.results].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
    return limit ? sorted.slice(0, limit) : sorted;
  }

  getAllTestIds(): string[] {
    const ids = new Set(this.results.map((r) => r.testId));
    return Array.from(ids);
  }

  detectDegradation(testId: string): DegradationAlert | null {
    const recent = this.getHistory(testId, 7);
    const baseline = this.getHistory(testId, 90);

    if (recent.length < 3 || baseline.length < 10) {
      return null;
    }

    const recentAvg = mean(recent.map((r) => r.consistency || 0));
    const baselineAvg = mean(baseline.map((r) => r.consistency || 0));

    const degradation = baselineAvg - recentAvg;

    if (degradation > 0.1) {
      return {
        testId,
        message: `Consistency dropped from ${baselineAvg.toFixed(
          2
        )} to ${recentAvg.toFixed(2)}`,
        severity: degradation > 0.2 ? 'critical' : 'warning',
      };
    }

    return null;
  }

  close(): void {
    // Final persist on close
    this.persist();
  }
}
