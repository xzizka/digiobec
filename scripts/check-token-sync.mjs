import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const dart = readFileSync(
  join(root, 'apps/mobile/lib/theme/broumy_tokens.dart'),
  'utf-8',
);
const cssRaw = readFileSync(
  join(root, 'apps/admin-web/src/theme/broumy-tokens.css'),
  'utf-8',
);

// Only the light-theme :root block mirrors the Dart tokens; media-query
// overrides intentionally differ.
const rootBlock = cssRaw.slice(0, cssRaw.indexOf('@media'));

const upperHex = (v) => v.toUpperCase().padStart(8, 'FF');
const stripAlpha = (hex8) => hex8.slice(2);

const parseDart = () => {
  const map = {};
  for (const m of dart.matchAll(/Color ([a-zA-Z0-9_]+) = Color\(0x([0-9A-Fa-f]{8})\)/g)) {
    map[m[1]] = stripAlpha(upperHex(m[2]));
  }
  return map;
};

const parseCss = () => {
  const raw = {};
  for (const m of rootBlock.matchAll(/--color-([a-z0-9-]+):\s*([^;]+);/g)) {
    raw[m[1]] = m[2].trim();
  }
  const resolve = (name, depth = 0) => {
    if (depth > 5) return null;
    let value = raw[name];
    const ref = value?.match(/^var\(--color-([a-z0-9-]+)\)$/);
    if (ref) return resolve(ref[1], depth + 1);
    return value ?? null;
  };
  const map = {};
  for (const name of Object.keys(raw)) {
    const value = resolve(name);
    if (/^#[0-9A-Fa-f]{6}$/.test(value ?? '')) {
      map[name] = stripAlpha(upperHex(value));
    }
  }
  return map;
};

const dartTokens = parseDart();
const cssTokens = parseCss();

const TOKEN_MAP = {
  primary: 'primary',
  primaryHover: 'primary-hover',
  primaryDark: 'primary-dark',
  secondary: 'secondary',
  secondaryHover: 'secondary-hover',
  accent: 'accent',
  onPrimary: 'on-primary',
  textPrimary: 'text-primary',
  textSecondary: 'text-secondary',
  textLink: 'text-link',
  surfaceMuted: 'surface-muted',
  surfaceContainer: 'surface-container',
  border: 'border',
  borderStrong: 'border-dark',
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error',
  infoContainer: 'info-container',
  successContainer: 'success-container',
  warningContainer: 'warning-container',
  errorContainer: 'error-container',
};

const failures = [];
for (const [dartKey, cssKey] of Object.entries(TOKEN_MAP)) {
  const dartValue = dartTokens[dartKey];
  const cssValue = cssTokens[cssKey];
  if (!dartValue) {
    failures.push(`Missing in broumy_tokens.dart: BroumyColors.${dartKey}`);
    continue;
  }
  if (!cssValue) {
    failures.push(`Missing in broumy-tokens.css: --color-${cssKey}`);
    continue;
  }
  if (dartValue !== cssValue) {
    failures.push(
      `Mismatch: BroumyColors.${dartKey}=#${dartValue} vs --color-${cssKey}=#${cssValue}`,
    );
  }
}

if (failures.length > 0) {
  console.error('Token sync FAILED:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log('Token sync OK: Flutter <-> CSS tokens are in sync.');
