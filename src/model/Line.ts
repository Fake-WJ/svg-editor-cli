import { Shape } from './Shape.js';

export class Line extends Shape {
  constructor(id: string) {
    super(id, 'line', { x1: 0, y1: 0, x2: 0, y2: 0 }, ['x1', 'x2'], ['y1', 'y2'], []);
  }
  protected newCopy(): Line { return new Line(this.id); }
}
