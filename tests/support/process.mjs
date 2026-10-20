import { execFileSync, spawnSync } from 'node:child_process';
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
