import { TestResult } from '@cert/core';

interface TestOptions {
  watch?: boolean;
  inspect?: boolean;
  junit?: boolean;
  config: string;
}

/**
 * Formats a test result for console output with colors.
 */
function formatResult(result: TestResult): string {
  const statusIcon = result.status === 'pass' ? '✓' : '✗';
  const statusColor = result.status === 'pass' ? '\x1b[32m' : '\x1b[31m';
  const resetColor = '\x1b[0m';

  let output = `${statusColor}${statusIcon}${resetColor} ${result.testId}`;

  if (result.consistency !== undefined) {
    output += ` (consistency: ${(result.consistency * 100).toFixed(1)}%)`;
  }

  if (result.accuracy !== undefined) {
    output += ` (accuracy: ${(result.accuracy * 100).toFixed(1)}%)`;
  }

  if (result.status === 'fail' && result.diagnosis) {
    output += `\n  ${result.diagnosis}`;

    if (result.suggestions && result.suggestions.length > 0) {
      output += '\n  Suggestions:';
      result.suggestions.forEach((s: string) => {
        output += `\n    - ${s}`;
      });
    }

    if (result.evidence && result.evidence.examples.length > 0) {
      output += `\n  Examples of outputs (${result.evidence.uniqueCount} unique):`;
      result.evidence.examples.slice(0, 3).forEach((ex: string) => {
        output += `\n    ${ex}`;
      });
    }
  }

  return output;
}

/**
 * Converts test results to JUnit XML format for CI/CD.
 */
function toJUnit(results: TestResult[]): string {
  const timestamp = new Date().toISOString();
  const totalTests = results.length;
  const failures = results.filter((r) => r.status === 'fail').length;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<testsuites name="CERT Tests" tests="${totalTests}" failures="${failures}" timestamp="${timestamp}">\n`;
  xml += `  <testsuite name="CERT" tests="${totalTests}" failures="${failures}">\n`;

  results.forEach((result) => {
    xml += `    <testcase name="${result.testId}" classname="CERT">\n`;

    if (result.status === 'fail') {
      xml += `      <failure message="${escapeXml(result.diagnosis || 'Test failed')}">\n`;
      xml += `${escapeXml(JSON.stringify(result, null, 2))}\n`;
      xml += `      </failure>\n`;
    }

    xml += `    </testcase>\n`;
  });

  xml += `  </testsuite>\n`;
  xml += `</testsuites>\n`;

  return xml;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function testCommand(pattern: string, options: TestOptions) {
  console.log(`Running tests matching: ${pattern}`);
  console.log(`Config: ${options.config}\n`);

  // TODO: Load config file and run tests
  // For now, show placeholder
  console.log('Test execution will be implemented once config loading is added.');
  console.log('\nExample test results:\n');

  const mockResults: TestResult[] = [
    {
      testId: 'retrieval-test',
      timestamp: new Date(),
      status: 'pass',
      accuracy: 0.95,
    },
    {
      testId: 'accuracy-test',
      timestamp: new Date(),
      status: 'pass',
      accuracy: 1.0,
    },
    {
      testId: 'consistency-test',
      timestamp: new Date(),
      status: 'fail',
      consistency: 0.75,
      evidence: {
        outputs: ['42', '43', '42'],
        uniqueCount: 2,
        examples: ['"42"', '"43"'],
      },
      diagnosis: 'Output alternates between two values',
      suggestions: [
        'Set temperature=0 if not already',
        'Check for non-deterministic data sources',
      ],
    },
  ];

  mockResults.forEach((result) => {
    console.log(formatResult(result));
    console.log();
  });

  // Output JUnit XML if requested
  if (options.junit) {
    const xml = toJUnit(mockResults);
    const { writeFile } = await import('fs/promises');
    await writeFile('cert-results.xml', xml, 'utf-8');
    console.log('✓ Wrote JUnit XML to cert-results.xml');
  }

  // Open inspector if requested
  if (options.inspect) {
    console.log('\nOpening inspector...');
    // TODO: Start inspector server
  }

  // Exit with failure code if any tests failed
  const hasFailures = mockResults.some((r: any) => r.status === 'fail');
  process.exit(hasFailures ? 1 : 0);
}
