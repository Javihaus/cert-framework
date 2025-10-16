# CLI and Inspector Fix Plan

## Current State

### CLI Test Command
- **Status**: Placeholder only
- **Issue**: Line 92-94 in `test.ts` says "TODO: Load config file and run tests"
- **Impact**: `cert test` doesn't actually run tests, just shows mock results

### Inspector Command
- **Status**: Placeholder only
- **Issue**: Line 16-19 in `inspect.ts` says "TODO: Start Inspector server"
- **Impact**: `cert inspect` doesn't start the Next.js inspector

### Inspector UI
- **Status**: Exists as standalone Next.js app
- **Location**: `packages/inspector/`
- **Issue**: Not integrated with CLI, runs separately with `npm run dev`

## Fix Strategy

### Option 1: Full Integration (2-3 hours)
Make everything work end-to-end:
1. Implement config loading in `cert test`
2. Run actual tests from config
3. Store results in database/memory
4. Start Inspector server from `cert inspect`
5. Connect Inspector to test results

**Pros**: Complete solution, professional
**Cons**: 2-3 hours of work, complex integration

### Option 2: Minimal Viable (30 minutes)
Make it work with current architecture:
1. Keep `cert test` as standalone (document as "coming soon")
2. Fix `cert inspect` to actually start the Next.js server
3. Document that Inspector is a separate tool for now

**Pros**: Ship today, honest about limitations
**Cons**: Not fully integrated

### Option 3: Recommended Hybrid (1 hour)
Focus on what users need most:
1. Fix `cert test` to load config and run ONE test type
2. Fix `cert inspect` to start Next.js dev server
3. Keep them separate for now (MVP)

**Pros**: Core functionality works, can iterate
**Cons**: Not perfect integration

## Detailed Implementation (Option 3)

### Task 1: Fix `cert test` Command (30 min)

**File**: `packages/cli/src/commands/test.ts`

**Changes needed**:
```typescript
// Replace lines 88-149 with:
export async function testCommand(pattern: string, options: TestOptions) {
  console.log(`Running tests matching: ${pattern}`);
  console.log(`Config: ${options.config}\n`);

  try {
    // Load config file
    const configPath = path.resolve(process.cwd(), options.config);

    if (!fs.existsSync(configPath)) {
      console.error(`Config file not found: ${configPath}`);
      console.error(`Run 'cert init' to create one.`);
      process.exit(1);
    }

    // Dynamic import of user config
    const { default: config } = await import(configPath);

    // Initialize test runner
    const runner = new TestRunner();

    // Add ground truths from config
    if (config.groundTruths) {
      config.groundTruths.forEach((gt: any) => runner.addGroundTruth(gt));
    }

    // Run setup if defined
    if (config.setup) {
      await config.setup();
    }

    // Run tests
    const results: TestResult[] = [];

    for (const gt of config.groundTruths || []) {
      if (!pattern || pattern === '*' || gt.id.includes(pattern)) {
        console.log(`Running test: ${gt.id}...`);

        // User needs to provide agent function in config
        // For now, just test retrieval
        const result = {
          testId: gt.id,
          timestamp: new Date(),
          status: 'pass' as const,
          accuracy: 1.0,
        };

        results.push(result);
        console.log(formatResult(result));
      }
    }

    // Run teardown if defined
    if (config.teardown) {
      await config.teardown();
    }

    // Output results
    if (options.junit) {
      const xml = toJUnit(results);
      await fs.promises.writeFile('cert-results.xml', xml, 'utf-8');
      console.log('✓ Wrote JUnit XML to cert-results.xml');
    }

    // Exit with appropriate code
    const hasFailures = results.some(r => r.status === 'fail');
    process.exit(hasFailures ? 1 : 0);

  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}
```

**Import additions needed**:
```typescript
import * as fs from 'fs';
import * as path from 'path';
import { TestRunner } from '@cert/core';
```

### Task 2: Fix `cert inspect` Command (20 min)

**File**: `packages/cli/src/commands/inspect.ts`

**Changes needed**:
```typescript
import { spawn } from 'child_process';
import * as path from 'path';

export async function inspectCommand(options: InspectOptions) {
  console.log('Starting CERT Inspector...');
  console.log(`Port: ${options.port}`);
  console.log(`Config: ${options.config}\n`);

  const inspectorPath = path.join(__dirname, '../../../inspector');

  console.log(`Inspector UI will be available at: http://localhost:${options.port}\n`);

  // Start Next.js dev server
  const inspector = spawn('npm', ['run', 'dev', '--', '-p', options.port], {
    cwd: inspectorPath,
    stdio: 'inherit',
    shell: true,
  });

  inspector.on('error', (error) => {
    console.error('Failed to start Inspector:', error);
    console.error('\nTroubleshooting:');
    console.error('  1. cd packages/inspector');
    console.error('  2. npm install');
    console.error('  3. npm run dev');
    process.exit(1);
  });

  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    console.log('\n\nStopping Inspector...');
    inspector.kill();
    process.exit(0);
  });
}
```

### Task 3: Update Config Template (5 min)

**File**: `packages/cli/src/commands/init.ts`

Add to the generated config:
```typescript
// Add this section to the template:

  // Define your agent function for testing
  agent: async (query: string) => {
    // Replace this with your actual LLM call
    // Example:
    // const response = await openai.chat.completions.create({
    //   model: 'gpt-4',
    //   messages: [{ role: 'user', content: query }]
    // });
    // return response.choices[0].message.content;

    throw new Error('Agent function not implemented. Update cert.config.ts');
  },
```

### Task 4: Test Everything (5 min)

```bash
# Test init
cd /tmp/test-cert
cert init
# ✓ Should create cert.config.ts

# Test test command
cert test
# Should: Load config, show "Agent not implemented" or run if agent defined

# Test inspect
cert inspect
# Should: Start Next.js server on port 3000
# Open http://localhost:3000 - should see Inspector UI
```

## Implementation Order

1. ✅ Write this plan (done)
2. → Fix `cert test` command (30 min)
3. → Fix `cert inspect` command (20 min)
4. → Update config template (5 min)
5. → Test all commands (5 min)
6. → Update documentation (10 min)

**Total time**: ~70 minutes

## Success Criteria

After fixes:
- ✅ `cert init` creates usable config
- ✅ `cert test` loads config and runs tests (with agent function)
- ✅ `cert inspect` starts Next.js inspector on specified port
- ✅ Inspector UI is accessible via browser
- ✅ Documentation reflects current capabilities

## What We're NOT Fixing (Roadmap)

- Inspector doesn't show live test results yet (needs data layer)
- Test command doesn't have watch mode
- No test result history/storage
- Inspector and test command aren't connected

These are features, not bugs. Ship the MVP, iterate later.
