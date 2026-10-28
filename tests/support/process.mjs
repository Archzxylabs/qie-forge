import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { closeSync, mkdtempSync, openSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Regular files also work in sandboxes that prohibit captured subprocess pipes.
// A nonzero child exit still fails the test, with its actual output attached.
export function runNode(args, options = {}) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'qie-forge-process-'));
  const stdoutPath = path.join(root, 'stdout');
  const stderrPath = path.join(root, 'stderr');
  const stdout = openSync(stdoutPath, 'w');
  const stderr = openSync(stderrPath, 'w');
  try {
    execFileSync(process.execPath, args, {
      timeout: 30000, ...options, stdio: ['ignore', stdout, stderr],
    });
    return readFileSync(stdoutPath, 'utf8');
  } catch (error) {
    error.message += `\nstdout: ${readFileSync(stdoutPath, 'utf8')}\nstderr: ${readFileSync(stderrPath, 'utf8')}`;
    throw error;
  } finally {
    closeSync(stdout); closeSync(stderr);
    rmSync(root, { recursive: true, force: true });
  }
}

// Asynchronous variants keep the test process event loop free. They are
// required whenever the child must talk to a fixture server running in the
// same Node process (for example the local smart-HTTP Git source).
export async function runNodeResultAsync(args, options = {}) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'qie-forge-process-'));
  const stdoutPath = path.join(root, 'stdout');
  const stderrPath = path.join(root, 'stderr');
  const stdout = openSync(stdoutPath, 'w');
  const stderr = openSync(stderrPath, 'w');
  try {
    const status = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, args, {
        timeout: 30000, ...options, stdio: ['ignore', stdout, stderr],
      });
      child.on('error', reject);
      child.on('close', (code) => resolve(code));
    });
    return {
      status,
      stdout: readFileSync(stdoutPath, 'utf8'),
      stderr: readFileSync(stderrPath, 'utf8'),
    };
  } finally {
    closeSync(stdout); closeSync(stderr);
    rmSync(root, { recursive: true, force: true });
  }
}

export async function runNodeAsync(args, options = {}) {
  const result = await runNodeResultAsync(args, options);
  if (result.status !== 0) {
    throw new Error(`Command failed with status ${result.status}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`);
  }
  return result.stdout;
}

// Non-throwing variant for CLI exit-code assertions (0 pass / 1 fail-closed / 2 usage).
export function runNodeResult(args, options = {}) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'qie-forge-process-'));
  const stdoutPath = path.join(root, 'stdout');
  const stderrPath = path.join(root, 'stderr');
  const stdout = openSync(stdoutPath, 'w');
  const stderr = openSync(stderrPath, 'w');
  try {
    const result = spawnSync(process.execPath, args, {
      timeout: 30000, ...options, stdio: ['ignore', stdout, stderr],
    });
    return {
      status: result.status,
      stdout: readFileSync(stdoutPath, 'utf8'),
      stderr: readFileSync(stderrPath, 'utf8'),
    };
  } finally {
    closeSync(stdout); closeSync(stderr);
    rmSync(root, { recursive: true, force: true });
  }
}
