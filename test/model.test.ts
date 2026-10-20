import test from 'node:test';
import assert from 'node:assert/strict';
import { SvgDocument } from '../src/model/SvgDocument.js';
import { ShapeFactory } from '../src/model/ShapeFactory.js';
import { Group } from '../src/model/Group.js';

const factory = new ShapeFactory();

test('all six shapes, optional style defaults, text and polymorphic transforms', () => {
  const document = new SvgDocument();
  const group = new Group('scene');
  document.add(group);
  for (const [type, args] of [
    ['rect', ['10', '20', '30', '40']], ['circle', ['10', '20', '5']],
    ['ellipse', ['10', '20', '5', '6']], ['line', ['10', '20', '30', '40']],
    ['text', ['10', '20', 'hello world']],
  ] as const) document.add(factory.create(type, type, args), group);
  group.move(1, 2);
  group.scale(2);
  assert.equal(document.find('rect').attributes().x, '22');
  assert.equal(document.find('rect').attributes().width, '60');
  assert.equal(document.find('circle').attributes().cy, '44');
  assert.equal(document.find('ellipse').attributes().ry, '12');
  assert.equal(document.find('line').attributes().x2, '62');
  assert.equal(document.find('text').textContent, 'hello world');
  assert.equal(document.find('rect').attributes().fill, undefined);
  assert.throws(() => group.scale(0), /must be positive/);
});

test('clones isolate geometry, style, text and structure', () => {
  const document = new SvgDocument();
  document.add(factory.create('text', 't', ['1', '2', 'original']));
  const copy = document.clone();
  copy.find('t').set('text', 'changed');
  copy.find('t').set('fill', 'red');
  copy.find('t').move(10, 20);
  assert.equal(document.find('t').textContent, 'original');
  assert.equal(document.find('t').attributes().fill, undefined);
  assert.equal(document.find('t').attributes().x, '1');
});

test('group uses original order, preserves nesting and rejects ancestry cycles', () => {
  const document = new SvgDocument();
  const parent = new Group('parent');
  document.add(parent);
  for (const id of ['a', 'b', 'c']) document.add(factory.create('circle', id, ['1', '2', '3']), parent);
  const group = document.group('nested', ['c', 'a']);
  assert.deepEqual(group.children.map(shape => shape.id), ['a', 'c']);
  assert.deepEqual(parent.children.map(shape => shape.id), ['nested', 'b']);
  assert.throws(() => document.group('bad', ['nested', 'a']), /own descendant/);
  assert.throws(() => group.insert(parent), /own descendant/);
  document.ungroup('nested');
  assert.deepEqual(parent.children.map(shape => shape.id), ['a', 'c', 'b']);
  assert.throws(() => document.ungroup('parent'), /top-level/);
});

test('unknown names, invalid geometry and global duplicate IDs are rejected', () => {
  const document = new SvgDocument();
  document.add(factory.create('rect', 'r', ['0', '0', '10', '20']));
  assert.throws(() => document.add(new Group('r')), /already exists/);
  assert.throws(() => factory.create('box', 'b', []), /unknown shape type/);
  assert.throws(() => factory.create('toString', 'b', []), /unknown shape type/);
  assert.throws(() => document.find('r').set('width', '-1'), /non-negative/);
  assert.throws(() => document.find('r').set('id', 'new'), /unknown attribute/);
  assert.throws(() => document.find('r').set('x', 'Infinity'), /invalid number/);
});
