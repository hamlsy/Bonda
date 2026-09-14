import { readFileSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceRoots = [fileURLToPath(new URL('../src/', import.meta.url))];

function collectFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? collectFiles(path) : ['.ts', '.tsx'].includes(extname(path)) ? [path] : [];
  });
}

const sourceFiles = sourceRoots.flatMap(collectFiles).map((path) => ({ path, content: readFileSync(path, 'utf8') }));
const source = sourceFiles.map(({ content }) => content).join('\n');
const appSource = readFileSync(fileURLToPath(new URL('../src/App.tsx', import.meta.url)), 'utf8');
const monitoringSource = readFileSync(fileURLToPath(new URL('../src/MonitoringPage.tsx', import.meta.url)), 'utf8');
const stylesSource = readFileSync(fileURLToPath(new URL('../src/styles.css', import.meta.url)), 'utf8');
const evidenceStyles = stylesSource.split('/* Evidence Rail — canonical monitoring workspace */')[1]?.split('/* Monitoring workspace inspired')[0] ?? '';
const failures = [];

const forbiddenPatterns = [
  ['decorative gradient', /bg-gradient-/],
  ['unsupported real-time claim', /실시간\s*(연계|모니터링|분석)/],
  ['unsupported 100% fact claim', /100%\s*(팩트|원문|인용|일치)/],
  ['unsupported zero-error claim', /오차\s*0%/],
  ['hard-coded model version', /Gemini\s*3\.8/],
  ['decorative filter emoji', /[🚨🚀💎🔴🟡🟢]/u],
  ['investment recommendation copy', /(매수|매도|만기보유)\s*(추천|적합)/],
  ['default-risk guarantee copy', /(부도\s*리스크.*차단|확정\s*수취|상환\s*보장)/],
];

for (const [label, pattern] of forbiddenPatterns) {
  if (pattern.test(source)) failures.push(label);
}

const clickableDivFiles = sourceFiles.filter(({ content }) => /<div[^>]*onClick=/s.test(content)).map(({ path }) => path);
if (clickableDivFiles.length) failures.push(`clickable div without native button semantics (${clickableDivFiles.join(', ')})`);

if (/bonda_mock_main/.test(appSource)) failures.push('monitoring route imports legacy mock source');
if (/transition\s*:\s*all|transition-all|animate-pulse|linear-gradient\(/.test(`${monitoringSource}\n${evidenceStyles}`)) failures.push('monitoring contains decorative or catch-all motion');
if (/<form(?![^>]*noValidate)[^>]*>/s.test(monitoringSource)) failures.push('monitoring form without app-owned validation');

if (failures.length) {
  console.error(`Monitoring UI guardrail failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log('Monitoring UI guardrail passed.');
