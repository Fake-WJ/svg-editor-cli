import { Group } from './Group.js';
import { Shape } from './Shape.js';
import { Numbers } from './Numbers.js';

export class SvgDocument {
  readonly root = new Group('__document_root__');
  private canvasWidth: number;
  private canvasHeight: number;
  private viewport: string;

  constructor(width = 800, height = 600, viewBox?: string) {
    this.canvasWidth = Numbers.positive(width, 'canvas width');
    this.canvasHeight = Numbers.positive(height, 'canvas height');
    this.viewport = viewBox ?? `0 0 ${width} ${height}`;
  }
  get width(): number { return this.canvasWidth; }
  get height(): number { return this.canvasHeight; }
  get viewBox(): string { return this.viewport; }

  resize(width: number, height: number): void {
    Numbers.positive(width, 'canvas width');
    Numbers.positive(height, 'canvas height');
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.viewport = `0 0 ${width} ${height}`;
  }

  all(): readonly Shape[] {
    const shapes: Shape[] = [];
    const visit = (shape: Shape): void => {
      shapes.push(shape);
      shape.children.forEach(visit);
    };
    this.root.children.forEach(visit);
    return shapes;
  }

  find(id: string): Shape {
    const shape = this.all().find(candidate => candidate.id === id);
    if (!shape) throw new Error(`no such shape: ${id}`);
    return shape;
  }

  container(id: string): Group {
    const shape = this.all().find(candidate => candidate.id === id);
    if (!shape) throw new Error(`no such container: ${id}`);
    if (!(shape instanceof Group)) throw new Error(`not a container: ${id}`);
    return shape;
  }

  ensureAvailable(id: string): void {
    if (this.all().some(shape => shape.id === id)) throw new Error(`id already exists: ${id}`);
  }

  add(shape: Shape, parent = this.root): void {
    const existing = new Set(this.all().map(item => item.id));
    const visit = (item: Shape): void => {
      if (existing.has(item.id)) throw new Error(`id already exists: ${item.id}`);
      existing.add(item.id);
      item.children.forEach(visit);
    };
    visit(shape);
    parent.insert(shape);
  }

  delete(id: string): Shape {
    const shape = this.find(id);
    shape.parent!.remove(shape);
    return shape;
  }

  group(id: string, ids: readonly string[]): Group {
    this.ensureAvailable(id);
    if (ids.length < 1) throw new Error('group requires at least one shape');
    if (new Set(ids).size !== ids.length) throw new Error('duplicate group member');
    const selected = ids.map(member => this.find(member));
    for (const shape of selected) {
      if (shape instanceof Group && selected.some(other => other !== shape && shape.contains(other))) {
        throw new Error(`cannot group a container into its own descendant: ${shape.id}`);
      }
    }
    const ordered = this.all().filter(shape => selected.includes(shape));
    let parent = ordered[0]!.parent!;
    while (!ordered.every(shape => parent.contains(shape))) parent = parent.parent!;
    const firstBranch = parent.children.findIndex(child => ordered.some(shape =>
      child === shape || (child instanceof Group && child.contains(shape))));
    const group = new Group(id);
    parent.insert(group, firstBranch);
    for (const shape of ordered) group.insert(shape);
    return group;
  }

  ungroup(id: string): void {
    const group = this.container(id);
    const parent = group.parent!;
    if (parent === this.root) throw new Error(`cannot ungroup top-level container: ${id}`);
    const index = parent.children.indexOf(group);
    const children = group.children;
    parent.remove(group);
    children.forEach((child, offset) => parent.insert(child, index + offset));
  }

  reorder(id: string, front: boolean): void {
    const shape = this.find(id);
    const parent = shape.parent!;
    parent.remove(shape);
    parent.insert(shape, front ? parent.children.length : 0);
  }

  clone(): SvgDocument {
    const copy = new SvgDocument(this.width, this.height, this.viewBox);
    for (const shape of this.root.children) copy.root.insert(shape.clone());
    return copy;
  }
}
