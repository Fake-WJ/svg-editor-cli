import { Shape } from './Shape.js';

export class Ellipse extends Shape {
  constructor(id: string) {
    super(id, 'ellipse', { cx: 0, cy: 0, rx: 0, ry: 0 }, ['cx'], ['cy'], ['rx', 'ry']);
  }
  protected newCopy(): Ellipse { return new Ellipse(this.id); }
}
