const fs = require("node:fs");
const path = require("node:path");
const ts = require(
  require.resolve("typescript", { paths: [path.resolve("server")] }),
);
const scope = process.argv[2] ?? "all";
const roots =
  scope === "be"
    ? ["server/src"]
    : scope === "fe"
      ? ["client/src"]
      : ["server/src", "client/src"];
const violations = [];
const scan = (filename) => {
  const source = ts.createSourceFile(
    filename,
    fs.readFileSync(filename, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const report = (node, rule) => {
    const location = source.getLineAndCharacterOfPosition(
      node.getStart(source),
    );
    violations.push(`${filename}:${location.line + 1}: ${rule}`);
  };
  const visit = (node) => {
    if (node.kind === ts.SyntaxKind.AnyKeyword) report(node, "any");
    if (ts.isNonNullExpression(node)) report(node, "non-null assertion");
    if (ts.isAsExpression(node) || ts.isTypeAssertionExpression(node)) {
      // The reports permit only this technical enum-key assertion on BE.
      const permitted =
        filename.startsWith("server/") &&
        /^Object\.keys\(([A-Za-z_$][\w$]*)\) as Array<keyof typeof \1>$/.test(
          node.getText(source),
        );
      if (!permitted) report(node, "type assertion");
    }
    if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
      if (
        ts.isIdentifier(node.expression) &&
        ["eval", "Function"].includes(node.expression.text)
      )
        report(node, "dynamic execution");
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  const comments = ts.createScanner(
    ts.ScriptTarget.Latest,
    false,
    ts.LanguageVariant.Standard,
    source.text,
  );
  for (
    let token = comments.scan();
    token !== ts.SyntaxKind.EndOfFileToken;
    token = comments.scan()
  ) {
    if (
      [
        ts.SyntaxKind.SingleLineCommentTrivia,
        ts.SyntaxKind.MultiLineCommentTrivia,
      ].includes(token) &&
      /@ts-(ignore|expect-error|nocheck)|eslint-disable/.test(
        comments.getTokenText(),
      )
    ) {
      const line =
        source.getLineAndCharacterOfPosition(comments.getTokenPos()).line + 1;
      violations.push(`${filename}:${line}: suppression directive`);
    }
  }
};
const walk = (directory) => {
  if (!fs.existsSync(directory)) return;
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    const filename = path.join(directory, item.name);
    if (
      item.isDirectory() &&
      !["node_modules", "dist", "build", "generated"].includes(item.name)
    )
      walk(filename);
    else if (
      item.isFile() &&
      /\.tsx?$/.test(item.name) &&
      !/\.d\.ts$/.test(item.name)
    )
      scan(filename);
  }
};
if (process.argv.length > 3) {
  for (const filename of process.argv.slice(3)) scan(filename);
} else {
  for (const directory of roots) walk(directory);
}
for (const violation of violations) console.error(violation);
console.log(
  `Strict AST check: ${violations.length} violation(s); tests are included.`,
);
process.exitCode = violations.length === 0 ? 0 : 1;
