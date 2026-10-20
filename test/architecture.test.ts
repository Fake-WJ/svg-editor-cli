import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { resolve, relative, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

test('all production imports obey documented dependency directions; one named class per file', async () => {
  const root = fileURLToPath(new URL('../src/', import.meta.url));
  const entries = await readdir(root, { recursive: true });
  const allowed: Record<string, readonly string[]> = {
    model: ['model'], application: ['application', 'model'],
    io: ['io', 'application', 'model'], cli: ['cli', 'application', 'model'],
  };
  for (const entry of entries.filter(name => name.endsWith('.ts'))) {
    const file = resolve(root, entry);
    const owner = entry.replaceAll('\\', '/').split('/')[0]!;
    const source = ts.createSourceFile(file, await readFile(file, 'utf8'), ts.ScriptTarget.Latest, true);
    const classes = source.statements.filter(ts.isClassDeclaration);
    assert.ok(classes.length <= 1, `${entry}: more than one class`);
    if (classes.length) assert.equal(classes[0]!.name?.text, basename(file, '.ts'), entry);
    for (const node of source.statements) {
      if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) continue;
      const specifier = node.moduleSpecifier.text;
      if (specifier.startsWith('.')) {
        const dependency = relative(root, resolve(dirname(file), specifier)).replaceAll('\\', '/').split('/')[0]!;
        if (owner !== 'main.ts') assert.ok(allowed[owner]?.includes(dependency), `${entry} -> ${specifier}`);
      } else {
        if (owner === 'model' || owner === 'application') assert.fail(`${entry}: external dependency ${specifier}`);
        if (owner === 'cli') assert.ok(['node:readline', 'node:stream'].includes(specifier), `${entry}: forbidden IO`);
      }
    }
  }
});
