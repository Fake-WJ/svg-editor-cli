import { Shape } from './Shape.js';

export class Text extends Shape {
  private content = '';
  constructor(id: string) { super(id, 'text', { x: 0, y: 0 }, ['x'], ['y'], []); }
  override get textContent(): string { return this.content; }
  override set(attribute: string, value: string): void {
    if (attribute === 'text') this.content = value;
    else super.set(attribute, value);
  }
  protected newCopy(): Text {
    const copy = new Text(this.id);
    copy.content = this.content;
    return copy;
  }
}
