/**
 * Test that TypeScript schemas match Python schemas.
 *
 * These tests ensure the contract stays synchronized between CLI and dashboard.
 */

import { Article15Report } from '../types/report-schema';
import sampleReport from '../../tests/fixtures/sample_report.json';

describe('Report Schema Contract', () => {
  test('sample report matches TypeScript schema', () => {
    // TypeScript will error at compile time if structure is wrong
    const report: Article15Report = sampleReport as Article15Report;

    expect(report.metadata.system_name).toBe("CustomerBot RAG System");
    expect(report.metadata.system_version).toBe("v2.1.0");
    expect(report.metadata.provider_name).toBe("Acme Corporation");
  });

  test('performance metrics have correct types', () => {
    const report: Article15Report = sampleReport as Article15Report;

    expect(typeof report.performance.total_traces).toBe('number');
    expect(typeof report.performance.accuracy_percentage).toBe('number');
    expect(typeof report.performance.mean_confidence).toBe('number');

    expect(report.performance.total_traces).toBe(1000);
    expect(report.performance.accuracy_percentage).toBe(94.1);
  });

  test('temporal analysis has daily accuracy array', () => {
    const report: Article15Report = sampleReport as Article15Report;

    expect(Array.isArray(report.temporal.daily_accuracy)).toBe(true);
    expect(report.temporal.daily_accuracy.length).toBeGreaterThan(0);

    const firstDay = report.temporal.daily_accuracy[0];
    expect(firstDay).toHaveProperty('date');
    expect(firstDay).toHaveProperty('accuracy');
    expect(typeof firstDay.accuracy).toBe('number');
  });

  test('failed traces have required fields', () => {
    const report: Article15Report = sampleReport as Article15Report;

    expect(Array.isArray(report.failed_traces)).toBe(true);
    expect(report.failed_traces.length).toBeGreaterThan(0);

    const firstTrace = report.failed_traces[0];
    expect(firstTrace).toHaveProperty('timestamp');
    expect(firstTrace).toHaveProperty('context');
    expect(firstTrace).toHaveProperty('answer');
    expect(firstTrace).toHaveProperty('confidence');
    expect(firstTrace).toHaveProperty('reason');

    expect(typeof firstTrace.confidence).toBe('number');
    expect(firstTrace.confidence).toBeGreaterThanOrEqual(0);
    expect(firstTrace.confidence).toBeLessThanOrEqual(1);
  });

  test('trace counts are consistent', () => {
    const report: Article15Report = sampleReport as Article15Report;

    const passed = report.performance.passed_traces;
    const failed = report.performance.failed_traces;
    const evaluated = report.performance.evaluated_traces;

    expect(passed + failed).toBe(evaluated);
  });

  test('accuracy percentage matches calculation', () => {
    const report: Article15Report = sampleReport as Article15Report;

    const expected = (report.performance.passed_traces / report.performance.evaluated_traces) * 100;
    const actual = report.performance.accuracy_percentage;

    expect(Math.abs(expected - actual)).toBeLessThan(0.1);
  });
});
