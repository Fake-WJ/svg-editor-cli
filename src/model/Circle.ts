import { Shape } from './Shape.js';

export class Circle extends Shape {
  constructor(id: string) {
    super(id, 'circle', { cx: 0, cy: 0, r: 0 }, ['cx'], ['cy'], ['r']);
  }
  protected newCopy(): Circle { return new Circle(this.id); }
}
