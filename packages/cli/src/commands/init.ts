import { writeFile, access } from 'fs/promises';
import { constants } from 'fs';

const DEFAULT_CONFIG_TEMPLATE = `import { defineConfig } from '@cert/core';

export default defineConfig({
  // Define ground truths for your tests
  groundTruths: [
    {
      id: 'example-test',
      question: 'What is the answer?',
      expected: '42',
      equivalents: ['forty-two', 'forty two'],
      metadata: {
        source: 'example.txt',
        category: 'basic'
      }
    }
  ],

  // Test configuration
  tests: {
    consistency: 0.85,  // Minimum consistency threshold
    accuracy: 0.80,     // Minimum accuracy threshold
    nTrials: 10,        // Number of consistency test trials
    semanticComparison: true
  },

  // Optional: Setup function to run before tests
  setup: async () => {
    // Load data, initialize clients, etc.
    console.log('Setting up test environment...');
  },

  // Optional: Teardown function to run after tests
  teardown: async () => {
    console.log('Cleaning up test environment...');
  }
});
`;

interface InitOptions {
  force?: boolean;
}

export async function initCommand(options: InitOptions) {
  const configPath = './cert.config.ts';

  // Check if file already exists
  if (!options.force) {
    try {
      await access(configPath, constants.F_OK);
      console.error(
        `Error: ${configPath} already exists. Use --force to overwrite.`
      );
      process.exit(1);
    } catch {
      // File doesn't exist, proceed
    }
  }

  try {
    await writeFile(configPath, DEFAULT_CONFIG_TEMPLATE, 'utf-8');
    console.log(`✓ Created ${configPath}`);
    console.log('\nNext steps:');
    console.log('  1. Edit cert.config.ts to define your tests');
    console.log('  2. Run: cert test');
    console.log('  3. Open inspector: cert inspect');
  } catch (error: any) {
    console.error(`Error creating config file: ${error.message}`);
    process.exit(1);
  }
}
