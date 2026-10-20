import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SvgCodec } from '../src/io/SvgCodec.js';
import { FileDocumentStore } from '../src/io/FileDocumentStore.js';
import { ShapeFormatter } from '../src/application/ShapeFormatter.js';
import { EditorSession } from '../src/application/EditorSession.js';
import { Cli } from '../src/cli/Cli.js';

const codec = new SvgCodec();
const svg = (body: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">${body}</svg>`;

test('read fixture repairs IDs, reports warning and survives save/read round trip', async () => {
  const source = await readFile(new URL('../examples/other.svg', import.meta.url), 'utf8');
  const result = codec.decode(source);
  assert.deepEqual(result.warnings, ['warning: assigned id rect1 to unnamed <rect>']);
  assert.equal(result.document.all().length, 7);
  const output = codec.encode(result.document);
  const roundTrip = codec.decode(output);
  assert.equal(roundTrip.warnings.length, 0);
  const formatter = new ShapeFormatter();
  assert.equal(formatter.tree(roundTrip.document), formatter.tree(result.document));
});

test('automatic IDs reserve later explicit names across the entire document', () => {
  const result = codec.decode(svg('<rect/><g id="g"><rect id="rect1"/><rect/></g>'));
  assert.deepEqual(result.document.all().map(shape => shape.id), ['rect2', 'g', 'rect1', 'rect3']);
  assert.equal(result.warnings.length, 2);
});

test('text escaping, whitespace, inherited styles and preserved transforms round trip', () => {
  const source = svg('<g id="g" fill="red" transform="translate(20,30) scale(0.8)">' +
    '<text id="t" x="10" y="20" font-size="16" text-anchor="middle">  开始 &amp; &lt;End&gt; "测试"  </text></g>');
  const original = codec.decode(source).document;
  const roundTrip = codec.decode(codec.encode(original)).document;
  assert.equal(roundTrip.find('t').textContent, '  开始 & <End> "测试"  ');
  assert.equal(roundTrip.find('g').attributes().transform, 'translate(20,30) scale(0.8)');
  assert.equal(roundTrip.find('t').attributes()['text-anchor'], 'middle');
});

test('viewBox and px dimensions supported without silently changing coordinate systems', () => {
  const document = codec.decode('<svg xmlns="http://www.w3.org/2000/svg" width="400px" height="300px" viewBox="-10 20 80 60"/>').document;
  assert.equal(document.width, 400);
  assert.equal(document.viewBox, '-10 20 80 60');
  assert.equal(codec.decode(codec.encode(document)).document.viewBox, document.viewBox);
  assert.equal(codec.decode('<svg viewBox="0 0 50 60"/>').document.width, 50);
});

test('malformed XML, duplicate IDs, unknown types/attributes and unsupported syntax fail clearly', () => {
  for (const source of [
    '<svg><g></svg>', '<html/>', '<svg width="NaN"/>', '<svg viewBox="0 0 -1 2"/>',
    svg('<rect id="r"/><circle id="r"/>'), svg('<path id="p" d="M0 0"/>'),
    svg('<rect id="r" unsupported="1"/>'), svg('<rect><circle/></rect>'),
    svg('<text id="t"><tspan>nested</tspan></text>'), '<!DOCTYPE svg><svg/>',
    '<svg style="color: red"/>', svg('unexpected text'),
  ]) assert.throws(() => codec.decode(source), source);
});

test('disk saves replace existing files; malformed reads and failed writes preserve state/history', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'svg-editor-'));
  try {
    const session = new EditorSession(new FileDocumentStore());
    const cli = new Cli(session);
    const file = join(directory, 'with spaces.svg');
    await cli.execute('init');
    await cli.execute('create circle c 1 2 3 red');
    assert.doesNotMatch(await cli.execute(`save "${file}"`), /^error:/);
    await cli.execute('move c 1 0');
    assert.doesNotMatch(await cli.execute('save'), /^error:/);
    assert.equal(codec.decode(await readFile(file, 'utf8')).document.find('c').attributes().cx, '2');
    await cli.execute('move c 1 0');
    const before = await cli.execute('tree');
    assert.match(await cli.execute(`save "${join(directory, 'missing', 'a.svg')}"`), /cannot write file/);
    await writeFile(join(directory, 'invalid.svg'), '<svg><g></svg>');
    assert.match(await cli.execute(`read "${join(directory, 'invalid.svg')}"`), /^error:/);
    assert.equal(await cli.execute('tree'), before);
    assert.doesNotMatch(await cli.execute('undo'), /^error:/);
    assert.deepEqual((await readdir(directory)).sort(), ['invalid.svg', 'with spaces.svg']);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
