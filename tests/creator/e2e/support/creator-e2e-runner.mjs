import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';

const composeFile = 'tests/creator/e2e/docker-compose.yml';
const projectName = `mondial_creator_e2e_${randomUUID().replaceAll('-', '').slice(0, 12)}`;
const databaseName = `MondialE2E_${randomUUID().replaceAll('-', '')}`;
const env = {
  ...process.env,
  COMPOSE_PROJECT_NAME: projectName,
  CREATOR_E2E_DB: databaseName,
  CREATOR_E2E_API_PORT: '5094',
  CREATOR_E2E_FRONTEND_PORT: '3001',
  NEXT_PUBLIC_API_BASE_URL: 'http://localhost:5094/api',
  CREATOR_E2E_RUN_ID: randomUUID(),
};
const playwrightCli = join(process.cwd(), 'tests', 'node_modules', '@playwright', 'test', 'cli.js');

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', env, shell: false, ...options });
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} exited with ${code ?? signal}`));
    });
  });
}

function capture(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], env, shell: false });
    let output = '';

    child.stdout.on('data', (chunk) => {
      output += chunk;
    });
    child.stderr.on('data', (chunk) => {
      output += chunk;
    });
    child.on('error', (error) => {
      resolve({ output, error });
    });
    child.on('close', (code, signal) => {
      resolve({ output, code, signal });
    });
  });
}

async function printDiagnostic(label, args) {
  console.error(`\nCreator E2E diagnostic: docker ${args.join(' ')}`);
  const result = await capture('docker', args);

  if (result.output) {
    process.stderr.write(result.output);
  }

  if (result.error) {
    console.error(`Creator E2E diagnostic unavailable (${label}): ${result.error.message}`);
  } else if (result.code !== 0) {
    console.error(`Creator E2E diagnostic command exited with ${result.code ?? result.signal}.`);
  }

  return result.output;
}

function indicatesDatabaseStartupProblem(apiLogs) {
  return /(?:mongo(?:db)?|database|replica\s*set|redis).*(?:fail|error|unable|cannot|refused|timeout|not primary|server selection)|(?:fail|error|unable|cannot|refused|timeout|not primary|server selection).*(?:mongo(?:db)?|database|replica\s*set|redis)/i.test(apiLogs);
}

async function printStartupDiagnostics() {
  const composeArgs = ['compose', '-f', composeFile];

  await printDiagnostic('compose status', [...composeArgs, 'ps', '-a']);
  const apiLogs = await printDiagnostic('API logs', [...composeArgs, 'logs', '--no-color', 'api']);

  if (indicatesDatabaseStartupProblem(apiLogs)) {
    await printDiagnostic('Mongo logs', [...composeArgs, 'logs', '--no-color', 'mongo', 'mongo-init']);
  }
}

async function hasDockerCompose() {
  try {
    await run('docker', ['--version'], { stdio: 'ignore' });
    await run('docker', ['compose', 'version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

if (!(await hasDockerCompose())) {
  console.error('Creator E2E requires Docker Desktop / Docker Engine with Compose v2.');
  process.exitCode = 1;
} else {
  let stackStartupAttempted = false;

  try {
    stackStartupAttempted = true;
    try {
      await run('docker', ['compose', '-f', composeFile, 'up', '--build', '--wait']);
    } catch (error) {
      await printStartupDiagnostics();
      throw error;
    }
    await run(process.execPath, [playwrightCli, 'test', '-c', 'tests/creator/e2e/config/playwright.creator.config.ts', ...process.argv.slice(2)]);
  } finally {
    if (stackStartupAttempted) {
      // Containers and the uniquely named database vanish together. Never delete a
      // shared Mongo database or preserve authentication state between runs.
      try {
        await run('docker', ['compose', '-f', composeFile, 'down', '--volumes', '--remove-orphans']);
      } catch (error) {
        console.error('Creator E2E cleanup failed:', error);
        process.exitCode ||= 1;
      }
    }
  }
}
