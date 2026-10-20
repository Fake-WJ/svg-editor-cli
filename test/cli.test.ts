import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SvgCodec } from '../src/io/SvgCodec.js';

const entry = fileURLToPath(new URL('../dist/main.js', import.meta.url));

test('compiled CLI replays the complete two-node example and exports a readable SVG', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'svg-cli-'));
  try {
    await mkdir(join(directory, 'examples'));
    const script = fileURLToPath(new URL('../examples/flowchart.txt', import.meta.url));
    const result = spawnSync(process.execPath, [entry, '--script', script], { cwd: directory, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, '');
    assert.match(result.stdout, /g#flowchart/);
    assert.match(result.stdout, /处理数据 v2/);
    assert.match(result.stdout, /saved to examples\/flowchart.svg \(8 elements\)/);
    const document = new SvgCodec().decode(await readFile(join(directory, 'examples', 'flowchart.svg'), 'utf8')).document;
    assert.equal(document.find('process').attributes().y, '100');
    assert.equal(document.find('process-label').textContent, '处理数据 v2');
    assert.equal(document.find('arrow1').parent?.id, 'flowchart');
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('compiled CLI stdin is sequential, continues after errors and returns nonzero for failed scripts', () => {
  const result = spawnSync(process.execPath, [entry], {
    input: 'init\ncreate circle c 1 2 3\nmove c 4 5\nundo\nredo\nscale c 0\nshow c\n',
    encoding: 'utf8',
  });
  assert.equal(result.status, 1);
  assert.equal(result.stderr.trim(), 'error: scale factor must be positive');
  assert.match(result.stdout, /cx=5/);
  assert.match(result.stdout, /cy=7/);
  assert.doesNotMatch(result.stdout, /svg>/);
});

test('assignment full transcript produces expected failures without corrupting document', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'svg-transcript-'));
  try {
    const imported = fileURLToPath(new URL('../examples/other.svg', import.meta.url));
    const lines = [
      'init 800 600', 'create rect bg 0 0 800 600 #ffffff',
      'create text title 20 40 "My Diagram"', 'create circle c1 100 100 20 red',
      'create rect box 200 80 60 60 #3366ff', 'group markers c1 box', 'tree',
      'move c1 30 0', 'undo', 'redo', 'set title text "My Diagram v2"', 'undo',
      'group bad c1 markers', 'delete box', 'undo', 'save demo.svg', 'undo',
      `read "${imported}"`, 'tree',
    ];
    const result = spawnSync(process.execPath, [entry], { input: lines.join('\n'), cwd: directory, encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.deepEqual(result.stderr.trim().split(/\r?\n/), [
      'error: cannot group a container into its own descendant: markers',
      'error: undo not allowed after io command',
    ]);
    assert.match(result.stdout, /warning: assigned id rect1 to unnamed <rect>/);
    assert.match(result.stdout, /svg \(400x300\)/);
    const saved = new SvgCodec().decode(await readFile(join(directory, 'demo.svg'), 'utf8')).document;
    assert.equal(saved.all().length, 5);
    assert.equal(saved.find('title').textContent, 'My Diagram');
    assert.equal(saved.find('c1').attributes().cx, '130');
    assert.equal(saved.find('box').parent?.id, 'markers');
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('script argument errors and missing script files are actionable', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'svg-script-'));
  try {
    const missing = spawnSync(process.execPath, [entry, '--script', join(directory, 'missing.txt')], { encoding: 'utf8' });
    assert.equal(missing.status, 1);
    assert.match(missing.stderr, /^error: cannot read script:/);
    const wrong = spawnSync(process.execPath, [entry, '--bad'], { encoding: 'utf8' });
    assert.equal(wrong.status, 1);
    assert.match(wrong.stderr, /^error: usage:/);
    const script = resolve(directory, 'unicode 命令.txt');
    await writeFile(script, '# 空行\r\n\r\ninit\r\ncanvas\r\n');
    const result = spawnSync(process.execPath, [entry, '--script', script], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /canvas 800x600/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
