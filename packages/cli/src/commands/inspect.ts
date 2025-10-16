import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface InspectOptions {
  port: string;
  config: string;
}

export async function inspectCommand(options: InspectOptions) {
  console.log('Starting CERT Inspector...');
  console.log(`Port: ${options.port}`);
  console.log(`Config: ${options.config}\n`);

  // Find inspector package
  const inspectorPath = path.join(__dirname, '../../../inspector');

  if (!fs.existsSync(inspectorPath)) {
    console.error('❌ Inspector package not found');
    console.error(`   Expected at: ${inspectorPath}`);
    console.error('\nTroubleshooting:');
    console.error('  1. Ensure you are in a CERT project directory');
    console.error('  2. Run: npm install @cert/inspector');
    console.error('  3. Or use the inspector from the monorepo\n');
    process.exit(1);
  }

  // Skip dependency check in monorepo - dependencies are handled by workspace

  console.log(`Inspector UI will be available at: http://localhost:${options.port}\n`);
  console.log('Starting Next.js development server...\n');

  // Start Next.js dev server
  const inspector = spawn('npm', ['run', 'dev', '--', '-p', options.port], {
    cwd: inspectorPath,
    stdio: 'inherit',
    shell: true,
  });

  inspector.on('error', (error) => {
    console.error('\n❌ Failed to start Inspector:', error);
    console.error('\nTroubleshooting:');
    console.error(`  1. cd ${inspectorPath}`);
    console.error('  2. npm install');
    console.error('  3. npm run dev\n');
    process.exit(1);
  });

  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    console.log('\n\nStopping Inspector...');
    inspector.kill();
    process.exit(0);
  });

  // Wait for inspector process
  await new Promise((resolve) => {
    inspector.on('close', resolve);
  });
}
