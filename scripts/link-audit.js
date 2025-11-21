const fs = require('fs');
const path = require('path');

const targetDirs = ['app', 'components'];
const exts = new Set(['.ts', '.tsx']);

const listFiles = (dir) => {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(listFiles(fullPath));
    } else if (exts.has(path.extname(entry.name))) {
      results.push(fullPath);
    }
  }
  return results;
};

const files = targetDirs.flatMap((dir) => (fs.existsSync(dir) ? listFiles(dir) : []));

const hrefRegex = /href\s*=\s*(?:\{\s*)?(["'`])([^"'`]+)\1/gm;
const hrefTemplateRegex = /href\s*=\s*\{\s*`([^`]+)`\s*\}/gm;
const pushRegex = /router\.push\(\s*(?:\{\s*)?(["'`])([^"'`]+)\1/gm;
const pushTemplateRegex = /router\.push\(\s*`([^`]+)`\s*\)/gm;

const references = new Map();

const addRef = (file, value, type) => {
  if (!value.startsWith('/')) return;
  const clean = value.split(/\s/)[0];
  if (!references.has(clean)) {
    references.set(clean, []);
  }
  references.get(clean).push({ file: file.replace(process.cwd() + path.sep, ''), type, raw: value });
};

files.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = hrefRegex.exec(content)) !== null) {
    addRef(file, match[2], 'href');
  }
  while ((match = hrefTemplateRegex.exec(content)) !== null) {
    addRef(file, match[1], 'href-template');
  }
  while ((match = pushRegex.exec(content)) !== null) {
    addRef(file, match[2], 'router.push');
  }
  while ((match = pushTemplateRegex.exec(content)) !== null) {
    addRef(file, match[1], 'router.push-template');
  }
});

const listPageFiles = (dir) => {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(listPageFiles(fullPath));
    } else if (entry.name === 'page.tsx') {
      results.push(fullPath);
    }
  }
  return results;
};

const pageFiles = fs.existsSync('app') ? listPageFiles('app') : [];
const routePatterns = pageFiles.map((file) => {
  const rel = path.relative('app', file).replace(/\\/g, '/');
  const routePath = '/' + rel.replace(/\/page\.tsx$/, '').replace(/page\.tsx$/, '');
  const normalized = routePath === '/' ? '/' : routePath.replace(/\/+/, '/');
  const patternStr = '^' + normalized
    .replace(/\(.*?\)\//g, '')
    .replace(/\[\.\.\.([^\]]+)\]/g, '(.+)')
    .replace(/\[([^\]]+)\]/g, '([^/]+)')
    .replace(/\//g, '\\/') + '$';
  return { route: normalized === '' ? '/' : normalized, regex: new RegExp(patternStr) };
});

const routeExists = (value) => {
  const pathWithoutQuery = value.split('?')[0];
  return routePatterns.some(({ regex }) => regex.test(pathWithoutQuery));
};

const unresolved = [];
for (const [value, refs] of references.entries()) {
  const hasTemplate = value.includes('${');
  let testValue = value;
  if (hasTemplate) {
    testValue = value.replace(/\$\{[^}]+\}/g, 'placeholder');
  }
  if (!routeExists(testValue)) {
    unresolved.push({ value, refs });
  }
}

fs.writeFileSync('link-audit.json', JSON.stringify({ totalReferences: references.size, unresolved }, null, 2));
console.log('Audit saved to link-audit.json with', unresolved.length, 'unresolved references.');
