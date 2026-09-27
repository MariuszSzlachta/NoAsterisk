const fs = require('node:fs');
const path = require('node:path');
const ts = require(
  require.resolve('typescript', { paths: [path.resolve('server')] }),
);

const arguments = process.argv.slice(2);
const summaryOnly = arguments.includes('--summary');
const requestedRoots = arguments.filter((argument) => argument !== '--summary');
const roots = requestedRoots.length > 0 ? requestedRoots : ['client/src'];
const ignoredDirectories = new Set([
  '__tests__',
  'build',
  'coverage',
  'dist',
  'generated',
  'node_modules',
]);

const isProductionSource = (filename) => {
  const basename = path.basename(filename);
  return (
    /\.tsx?$/.test(basename) &&
    !/\.d\.ts$/.test(basename) &&
    !/\.(spec|test|stories)\.tsx?$/.test(basename) &&
    basename !== 'test-setup.ts'
  );
};

const containsArrowFunction = (filename) => {
  const source = ts.createSourceFile(
    filename,
    fs.readFileSync(filename, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    filename.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  let arrowFunction;
  const visit = (node) => {
    if (arrowFunction !== undefined) return;
    if (ts.isArrowFunction(node)) {
      arrowFunction = node;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  if (arrowFunction === undefined) return undefined;
  const location = source.getLineAndCharacterOfPosition(
    arrowFunction.getStart(source),
  );
  return location.line + 1;
};

const hasColocatedSpec = (filename) => {
  const directory = path.dirname(filename);
  const extension = path.extname(filename);
  const basename = path.basename(filename, extension);
  return fs.readdirSync(directory, { withFileTypes: true }).some((entry) => {
    if (!entry.isFile()) return false;
    return new RegExp(
      `^${basename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\.[^.]+)*\\.spec\\.tsx?$`,
    ).test(entry.name);
  });
};

const candidates = [];
const walk = (target) => {
  if (!fs.existsSync(target)) return;
  const stat = fs.statSync(target);
  if (stat.isFile()) {
    if (isProductionSource(target)) candidates.push(target);
    return;
  }
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    walk(path.join(target, entry.name));
  }
};

for (const root of roots) walk(root);

const violations = [];
let arrowFiles = 0;
for (const filename of candidates.sort()) {
  const line = containsArrowFunction(filename);
  if (line === undefined) continue;
  arrowFiles += 1;
  if (!hasColocatedSpec(filename)) {
    violations.push(`${filename}:${line}: missing colocated spec for arrow-function code`);
  }
}

if (!summaryOnly) {
  for (const violation of violations) console.error(violation);
}
console.log(
  `Test colocation check: ${candidates.length} production file(s), ${arrowFiles} with arrow functions, ${violations.length} missing colocated spec(s).`,
);
process.exitCode = violations.length === 0 ? 0 : 1;
