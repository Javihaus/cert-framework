#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { testCommand } from './commands/test.js';
import { inspectCommand } from './commands/inspect.js';
import { analyzeCommand } from './commands/analyze.js';

const program = new Command();

program
  .name('cert')
  .description('CERT - LLM system reliability testing')
  .version('1.0.0');

// cert init - Initialize configuration
program
  .command('init')
  .description('Initialize CERT configuration')
  .option('-f, --force', 'Overwrite existing configuration')
  .action(initCommand);

// cert test - Run tests
program
  .command('test')
  .description('Run tests matching pattern')
  .argument('[pattern]', 'Test pattern to match', '*')
  .option('-w, --watch', 'Watch mode')
  .option('--inspect', 'Open inspector UI after running tests')
  .option('--junit', 'Output JUnit XML for CI/CD')
  .option('--config <path>', 'Path to config file', 'cert.config.ts')
  .action(testCommand);

// cert inspect - Start inspector UI
program
  .command('inspect')
  .description('Start inspector UI')
  .option('-p, --port <port>', 'Port number', '3000')
  .option('--config <path>', 'Path to config file', 'cert.config.ts')
  .action(inspectCommand);

// cert analyze - Analyze test results
program
  .command('analyze')
  .description('Analyze test results and metrics')
  .option('--detect-degradation', 'Check for metric degradation')
  .option('--test-id <id>', 'Specific test to analyze')
  .option('--days <days>', 'Days of history to analyze', '30')
  .action(analyzeCommand);

program.parse();
