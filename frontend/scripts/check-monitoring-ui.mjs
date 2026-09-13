import { readFileSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceRoots = [
  fileURLToPath(new URL('../mock/bonda_mock_main/src/', import.meta.url)),
  fileURLToPath(new URL('../mock/bonda_mock_onboarding/src/', import.meta.url)),
];

function collectFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? collectFiles(path) : ['.ts', '.tsx'].includes(extname(path)) ? [path] : [];
  });
}

const sourceFiles = sourceRoots.flatMap(collectFiles).map((path) => ({ path, content: readFileSync(path, 'utf8') }));
const source = sourceFiles.map(({ content }) => content).join('\n');
const failures = [];

const forbiddenPatterns = [
  ['decorative gradient', /bg-gradient-/],
  ['unsupported real-time claim', /실시간\s*(연계|모니터링|분석)/],
  ['unsupported 100% fact claim', /100%\s*(팩트|원문|인용|일치)/],
  ['unsupported zero-error claim', /오차\s*0%/],
  ['hard-coded model version', /Gemini\s*3\.8/],
  ['decorative filter emoji', /[🚨🚀💎🔴🟡🟢]/u],
];

for (const [label, pattern] of forbiddenPatterns) {
  if (pattern.test(source)) failures.push(label);
}

const clickableDivFiles = sourceFiles
  .filter(({ path }) => path.includes('bonda_mock_main'))
  .filter(({ content }) => /<div[^>]*onClick=/s.test(content))
  .map(({ path }) => path);
if (clickableDivFiles.length) failures.push(`clickable div without native button semantics (${clickableDivFiles.join(', ')})`);

if (failures.length) {
  console.error(`Monitoring UI guardrail failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log('Monitoring UI guardrail passed.');
