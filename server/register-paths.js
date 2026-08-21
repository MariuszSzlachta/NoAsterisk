/**
 * Runtime module resolution fix for @budget/domain in compiled output.
 * Required because tsc emits `require("@budget/domain")` but the workspace
 * symlink points to .ts source (unusable by Node directly).
 *
 * Used by: nest start --watch (via --exec flag)
 * Not needed for: production (use `npm run build` which runs tsc-alias)
 */
const Module = require('module');
const path = require('path');

const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...args) {
  if (request === '@budget/domain') {
    const distRoot = path.join(__dirname, 'dist');
    return path.join(distRoot, 'packages', 'domain', 'src', 'index.js');
  }
  return originalResolveFilename.call(this, request, parent, ...args);
};
