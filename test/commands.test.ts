import test from 'node:test';
import assert from 'node:assert/strict';
import { EditorSession } from '../src/application/EditorSession.js';
import { Cli } from '../src/cli/Cli.js';
import { MemoryStore } from './MemoryStore.js';

const fixture = () => {
  const session = new EditorSession(new MemoryStore());
  return { session, cli: new Cli(session) };
};

test('create, nested move/scale and undo/redo restore complete subtrees', async () => {
  const { cli, session } = fixture();
  for (const line of ['init', 'create g scene', 'create g node in scene',
    'create rect r 10 20 30 40 #eee in node', 'create text t 15 25 "开始 节点" in node']) {
    assert.doesNotMatch(await cli.execute(line), /^error:/);
  }
  const initial = await cli.execute('tree');
  await cli.execute('move node 3 4');
  await cli.execute('scale node 2');
  assert.equal(session.document.find('r').attributes().x, '26');
  assert.equal(session.document.find('t').attributes().y, '58');
  await cli.execute('undo');
  await cli.execute('undo');
  assert.equal(await cli.execute('tree'), initial);
  await cli.execute('redo');
  await cli.execute('redo');
  const transformed = await cli.execute('tree');
  await cli.execute('delete node');
  assert.equal(session.document.all().length, 1);
  await cli.execute('undo');
  assert.equal(await cli.execute('tree'), transformed);
});

test('failed multi-object commands and overflow leave document and redo intact', async () => {
  const { cli } = fixture();
  for (const line of ['init', 'create g g1', 'create circle a 1 2 3 in g1',
    'create circle b 1e308 2 3 in g1', 'move a 1 0', 'undo']) await cli.execute(line);
  const before = await cli.execute('tree');
  for (const line of ['group bad a missing', 'group bad a g1', 'addto g1 g1',
    'scale g1 10', 'create rect x 1 2 -3 4', 'set a id other']) {
    assert.match(await cli.execute(line), /^error:/, line);
    assert.equal(await cli.execute('tree'), before, line);
  }
  assert.doesNotMatch(await cli.execute('redo'), /^error:/);
  assert.match(await cli.execute('show a'), /cx=2/);
});

test('read/save/init/canvas mutation barriers and failed IO obey history contract', async () => {
  const { cli } = fixture();
  await cli.execute('init');
  await cli.execute('create circle a 1 2 3');
  assert.match(await cli.execute('save readonly.svg'), /^error:/);
  assert.doesNotMatch(await cli.execute('undo'), /^error:/);
  await cli.execute('redo');
  await cli.execute('save saved.svg');
  assert.equal(await cli.execute('undo'), 'error: undo not allowed after io command');
  assert.equal(await cli.execute('redo'), 'error: undo not allowed after io command');
  await cli.execute('move a 1 0');
  await cli.execute('canvas');
  await cli.execute('show a');
  await cli.execute('help');
  assert.doesNotMatch(await cli.execute('undo'), /^error:/);
  await cli.execute('read missing.svg');
  assert.doesNotMatch(await cli.execute('redo'), /^error:/);
  await cli.execute('canvas 200 300');
  assert.match(await cli.execute('undo'), /not allowed/);
  await cli.execute('move a 1 0');
  await cli.execute('read saved.svg');
  assert.match(await cli.execute('undo'), /not allowed/);
  assert.match(await cli.execute('show a'), /cx=1/);
  await cli.execute('init');
  assert.equal(await cli.execute('save'), 'error: no file path. use save <file.svg>');
});

test('new edit after undo clears redo but reads and failures do not', async () => {
  const { cli } = fixture();
  for (const line of ['init', 'create g g', 'create circle c 1 2 3 in g', 'undo']) await cli.execute(line);
  await cli.execute('tree');
  assert.doesNotMatch(await cli.execute('redo'), /^error:/);
  await cli.execute('undo');
  await cli.execute('set g fill red');
  assert.equal(await cli.execute('redo'), 'error: nothing to redo');
});

test('group, ungroup, addto and sibling ordering each undo in one step', async () => {
  const { cli } = fixture();
  for (const line of ['init', 'create g scene', 'create circle a 1 2 3 in scene',
    'create circle b 1 2 3 in scene', 'create circle c 1 2 3 in scene']) await cli.execute(line);
  for (const line of ['group nested c a', 'front a', 'back c', 'addto scene a', 'ungroup nested']) {
    const before = await cli.execute('tree');
    assert.doesNotMatch(await cli.execute(line), /^error:/, line);
    const after = await cli.execute('tree');
    await cli.execute('undo');
    assert.equal(await cli.execute('tree'), before, line);
    await cli.execute('redo');
    assert.equal(await cli.execute('tree'), after, line);
  }
});

test('no-document errors, explicit IDs, empty text, comments and quoting', async () => {
  const { cli } = fixture();
  assert.match(await cli.execute('tree'), /no document/);
  assert.match(await cli.execute('help'), /create rect/);
  assert.equal(await cli.execute('# hello'), '');
  await cli.execute('init');
  await cli.execute('create text t 1 2 "a \\"quote\\" and #hash"');
  assert.match(await cli.execute('show t'), /#hash/);
  await cli.execute('set t text ""');
  assert.match(await cli.execute('show t'), /text=""/);
  assert.match(await cli.execute('create g t'), /id already exists/);
  assert.match(await cli.execute('create g T'), /created/);
  assert.equal(await cli.execute('create g a in missing'), 'error: no such container: missing');
  assert.equal(await cli.execute('create g a in t'), 'error: not a container: t');
  assert.match(await cli.execute('set t fill "bad'), /unterminated/);
  assert.match(await cli.execute('toString'), /unknown command/);
});
