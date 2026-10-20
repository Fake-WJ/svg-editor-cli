import { Shape } from './Shape.js';
import { Numbers } from './Numbers.js';

export class Group extends Shape {
  private readonly members: Shape[] = [];
  constructor(id: string) { super(id, 'g', {}, [], [], []); }
  override get children(): readonly Shape[] { return [...this.members]; }

  contains(shape: Shape): boolean {
    for (let current: Shape | null = shape; current; current = current.parent) {
      if (current === this) return true;
    }
    return false;
  }

  insert(shape: Shape, index = this.members.length): void {
    if (shape === this || (shape instanceof Group && shape.contains(this))) {
      throw new Error(`cannot group a container into its own descendant: ${shape.id}`);
    }
    if (!Number.isInteger(index) || index < 0 || index > this.members.length) {
      throw new Error('invalid child position');
    }
    shape.parent?.remove(shape);
    this.members.splice(Math.min(index, this.members.length), 0, shape);
    shape.assignParent(this);
  }

  remove(shape: Shape): void {
    const index = this.members.indexOf(shape);
    if (index < 0) throw new Error(`no such child: ${shape.id}`);
    this.members.splice(index, 1);
    shape.assignParent(null);
  }

  override move(dx: number, dy: number): void {
    for (const child of this.members) child.move(dx, dy);
  }

  override scale(factor: number): void {
    Numbers.positive(factor, 'scale factor');
    for (const child of this.members) child.scale(factor);
  }

  protected newCopy(): Group {
    const group = new Group(this.id);
    for (const child of this.members) group.insert(child.clone());
    return group;
  }
}
