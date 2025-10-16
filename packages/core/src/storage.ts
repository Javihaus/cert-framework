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
 * SQLite-based storage implementation for production use.
 * Requires better-sqlite3 package to be installed.
 */
export class SQLiteStorage implements MetricsStorage {
  private db: any;

  constructor(dbPath: string) {
    try {
      // Dynamic import to make better-sqlite3 optional
      const Database = require('better-sqlite3');
      this.db = new Database(dbPath);
      this.initSchema();
    } catch (error) {
      throw new Error(
        'better-sqlite3 is required for SQLite storage. Install it with: npm install better-sqlite3'
      );
    }
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS test_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_id TEXT NOT NULL,
        timestamp DATETIME NOT NULL,
        status TEXT NOT NULL,
        consistency REAL,
        accuracy REAL,
        evidence TEXT,
        diagnosis TEXT,
        suggestions TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_test_timestamp
        ON test_results(test_id, timestamp DESC);

      CREATE INDEX IF NOT EXISTS idx_status
        ON test_results(status);
    `);
  }

  save(result: TestResult): void {
    const stmt = this.db.prepare(`
      INSERT INTO test_results (
        test_id, timestamp, status, consistency, accuracy, evidence, diagnosis, suggestions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      result.testId,
      result.timestamp.toISOString(),
      result.status,
      result.consistency ?? null,
      result.accuracy ?? null,
      result.evidence ? JSON.stringify(result.evidence) : null,
      result.diagnosis ?? null,
      result.suggestions ? JSON.stringify(result.suggestions) : null
    );
  }

  getHistory(testId: string, days: number = 30): TestResult[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const stmt = this.db.prepare(`
      SELECT * FROM test_results
      WHERE test_id = ? AND timestamp >= ?
      ORDER BY timestamp DESC
    `);

    const rows = stmt.all(testId, cutoff.toISOString());

    return rows.map((row: any) => ({
      testId: row.test_id,
      status: row.status,
      timestamp: new Date(row.timestamp),
      consistency: row.consistency,
      accuracy: row.accuracy,
      evidence: row.evidence ? JSON.parse(row.evidence) : undefined,
      diagnosis: row.diagnosis,
      suggestions: row.suggestions ? JSON.parse(row.suggestions) : undefined,
    }));
  }

  detectDegradation(testId: string): DegradationAlert | null {
    const recent = this.getHistory(testId, 7);
    const baseline = this.getHistory(testId, 90);

    if (recent.length < 3 || baseline.length < 10) {
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
        )} to ${recentAvg.toFixed(2)} over the last 7 days`,
        severity: degradation > 0.2 ? 'critical' : 'warning',
      };
    }

    return null;
  }

  /**
   * Get statistics for a test.
   */
  getStats(testId: string, days: number = 30): {
    totalRuns: number;
    passRate: number;
    avgConsistency: number;
    avgAccuracy: number;
  } {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const stmt = this.db.prepare(`
      SELECT
        COUNT(*) as total_runs,
        SUM(CASE WHEN status = 'pass' THEN 1 ELSE 0 END) as passes,
        AVG(consistency) as avg_consistency,
        AVG(accuracy) as avg_accuracy
      FROM test_results
      WHERE test_id = ? AND timestamp >= ?
    `);

    const row = stmt.get(testId, cutoff.toISOString());

    return {
      totalRuns: row.total_runs || 0,
      passRate: row.passes ? row.passes / row.total_runs : 0,
      avgConsistency: row.avg_consistency || 0,
      avgAccuracy: row.avg_accuracy || 0,
    };
  }

  /**
   * Get all test IDs in the database.
   */
  getAllTestIds(): string[] {
    const stmt = this.db.prepare('SELECT DISTINCT test_id FROM test_results');
    const rows = stmt.all();
    return rows.map((row: any) => row.test_id);
  }

  /**
   * Delete old test results.
   */
  cleanup(days: number = 90): number {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const stmt = this.db.prepare(
      'DELETE FROM test_results WHERE timestamp < ?'
    );

    const result = stmt.run(cutoff.toISOString());
    return result.changes;
  }

  close(): void {
    if (this.db) {
      this.db.close();
    }
  }
}

/**
 * Factory function to create the appropriate storage implementation.
 *
 * @param dbPath - Optional path to database file. If not provided, uses in-memory storage.
 *                 Use .json extension for JSON storage, .db for SQLite.
 * @returns MetricsStorage implementation
 *
 * @example
 * ```typescript
 * // Use in-memory storage
 * const storage = createStorage();
 *
 * // Use JSON storage (no native dependencies)
 * const storage = createStorage('./cert-metrics.json');
 *
 * // Use SQLite
 * const storage = createStorage('./cert-metrics.db');
 * ```
 */
export function createStorage(dbPath?: string): MetricsStorage {
  if (!dbPath) {
    return new InMemoryStorage();
  }

  // Use JSON storage for .json files (no native dependencies required)
  if (dbPath.endsWith('.json')) {
    try {
      // Import JSONStorage - will be available after build
      // Use dynamic require for CommonJS compatibility
      let JSONStorageClass;
      try {
        // Try ESM import first
        JSONStorageClass = (global as any).__JSONStorage;
      } catch {
        // Fall back to require
        try {
          const mod = eval('require')('./json-storage.js');
          JSONStorageClass = mod.JSONStorage;
        } catch {
          // If neither works, throw to fall back to in-memory
          throw new Error('JSONStorage not available');
        }
      }

      if (JSONStorageClass) {
        return new JSONStorageClass(dbPath);
      }
      throw new Error('JSONStorage class not found');
    } catch (error) {
      console.warn(
        `Failed to create JSON storage: ${error}. Falling back to in-memory storage.`
      );
      return new InMemoryStorage();
    }
  }

  // Try SQLite for .db files
  try {
    return new SQLiteStorage(dbPath);
  } catch (error) {
    console.warn(
      `Failed to create SQLite storage: ${error}. Falling back to in-memory storage.`
    );
    return new InMemoryStorage();
  }
}
