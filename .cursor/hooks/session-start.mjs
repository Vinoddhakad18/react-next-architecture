#!/usr/bin/env node
// Superpowers SessionStart hook (Cursor, cross-platform).
// Injects the `using-superpowers` skill so the agent always checks skills
// before acting. Bash-free on purpose: this machine only has WSL bash,
// which cannot resolve the Windows paths the upstream run-hook.cmd passes.

import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

async function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const pluginRoot = resolve(here, '..'); // .cursor
  const skillPath = join(pluginRoot, 'skills', 'using-superpowers', 'SKILL.md');

  let skill;
  try {
    skill = await readFile(skillPath, 'utf8');
  } catch (err) {
    // Fail open: never block a session because the bootstrap is missing.
    process.stdout.write('{}\n');
    return;
  }

  const context =
    '<EXTREMELY_IMPORTANT>\n' +
    'You have superpowers.\n\n' +
    "**Below is the full content of your 'superpowers:using-superpowers' skill - " +
    "your introduction to using skills. For all other skills, load the matching " +
    '.cursor/skills/<name>/SKILL.md:**\n\n' +
    skill +
    '\n</EXTREMELY_IMPORTANT>';

  // Cursor sessionStart consumes `additional_context` (snake_case).
  process.stdout.write(JSON.stringify({ additional_context: context }) + '\n');
}

main().catch(() => {
  process.stdout.write('{}\n');
});
