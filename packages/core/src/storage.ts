import { TestResult, DegradationAlert } from './types.js';
import { mean } from './consistency.js';

/**
 * Interface for storing and retrieving test metrics over time.
 * This will use SQLite in production but can be implemented with other backends.
 */
export interface MetricsStorage {
  save(result: TestResult): void;
  getHistory(testId: string, days?: number): TestResult[];
  detectDegradation(testId: string): DegradationAlert | null;
  close(): void;
}

/**
 * In-memory implementation of MetricsStorage for testing.
 * For production use, implement with SQLite via better-sqlite3.
 */
export class InMemoryStorage implements MetricsStorage {
  private results: TestResult[] = [];

  save(result: TestResult): void {
    this.results.push(result);
  }

  getHistory(testId: string, days: number = 30): TestResult[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return this.results
      .filter((r) => r.testId === testId && r.timestamp >= cutoff)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  detectDegradation(testId: string): DegradationAlert | null {
    const recent = this.getHistory(testId, 7);
    const baseline = this.getHistory(testId, 90);

    if (recent.length < 3 || baseline.length < 10) {
      // Not enough data
      return null;
    }

    const recentAvg = mean(recent.map((r) => r.consistency));
    const baselineAvg = mean(baseline.map((r) => r.consistency));

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
    // No-op for in-memory storage
  }
}

/**
 * Factory function to create the appropriate storage implementation.
 *
 * @param dbPath - Optional path to SQLite database. If not provided, uses in-memory storage.
 * @returns MetricsStorage implementation
 *
 * @example
 * ```typescript
 * // Use in-memory storage
 * const storage = createStorage();
 *
 * // Use SQLite (when implemented)
 * const storage = createStorage('./cert-metrics.db');
 * ```
 */
export function createStorage(dbPath?: string): MetricsStorage {
  if (!dbPath) {
    return new InMemoryStorage();
  }

  // TODO: Implement SQLite storage when better-sqlite3 is available
  // For now, fall back to in-memory
  console.warn(
    'SQLite storage not yet implemented, using in-memory storage'
  );
  return new InMemoryStorage();
}

/**
 * Example SQLite implementation (to be implemented):
 *
 * ```typescript
 * import Database from 'better-sqlite3';
 *
 * export class SQLiteStorage implements MetricsStorage {
 *   private db: Database.Database;
 *
 *   constructor(dbPath: string) {
 *     this.db = new Database(dbPath);
 *     this.initSchema();
 *   }
 *
 *   private initSchema() {
 *     this.db.exec(`
 *       CREATE TABLE IF NOT EXISTS test_results (
 *         id INTEGER PRIMARY KEY,
 *         test_id TEXT NOT NULL,
 *         timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
 *         status TEXT NOT NULL,
 *         consistency REAL,
 *         accuracy REAL,
 *         evidence TEXT,
 *         diagnosis TEXT
 *       );
 *
 *       CREATE INDEX IF NOT EXISTS idx_test_timestamp
 *         ON test_results(test_id, timestamp);
 *     `);
 *   }
 *
 *   save(result: TestResult) {
 *     this.db.prepare(`
 *       INSERT INTO test_results (test_id, timestamp, status, consistency, accuracy, evidence, diagnosis)
 *       VALUES (?, ?, ?, ?, ?, ?, ?)
 *     `).run(
 *       result.testId,
 *       result.timestamp.toISOString(),
 *       result.status,
 *       result.consistency,
 *       result.accuracy,
 *       JSON.stringify(result.evidence),
 *       result.diagnosis
 *     );
 *   }
 *
 *   // ... other methods
 * }
 * ```
 */
