import path from 'node:path';
import { projectRoot } from './fixtures.mjs';
import { runNode, runNodeAsync, runNodeResult, runNodeResultAsync } from './process.mjs';

export const skillsCli = path.join(projectRoot, 'node_modules/skills/bin/cli.mjs');

// A deliberately minimal environment: no inherited agent-detection variables,
// global skill state or user configuration. Git needs PATH for clone/fetch.
export function isolatedEnvironment(consumer) {
  return {
    PATH: process.env.PATH,
    HOME: path.join(consumer, 'home'),
    XDG_CACHE_HOME: path.join(consumer, 'cache'),
    XDG_STATE_HOME: path.join(consumer, 'state'),
    CI: '1',
    NO_COLOR: '1',
    DISABLE_TELEMETRY: '1',
    DO_NOT_TRACK: '1',
    NODE_DISABLE_COMPILE_CACHE: '1',
    GIT_TERMINAL_PROMPT: '0',
  };
}

// Synchronous helpers are retained for local-directory installs. Git-source
// fixtures must use the asynchronous helpers because their smart-HTTP server
// runs in this process.
export function runSkills(args, { cwd, env }) {
  return runNode([skillsCli, ...args], { cwd, env });
}

export function runSkillsResult(args, { cwd, env }) {
  return runNodeResult([skillsCli, ...args], { cwd, env });
}

export function runSkillsAsync(args, { cwd, env }) {
  return runNodeAsync([skillsCli, ...args], { cwd, env, timeout: 60000 });
}

export function runSkillsResultAsync(args, { cwd, env }) {
  return runNodeResultAsync([skillsCli, ...args], { cwd, env, timeout: 60000 });
}
