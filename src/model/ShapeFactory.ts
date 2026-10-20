import { Shape } from './Shape.js';
import { Rect } from './Rect.js';
import { Circle } from './Circle.js';
import { Ellipse } from './Ellipse.js';
import { Line } from './Line.js';
import { Text } from './Text.js';
import { Group } from './Group.js';

export class ShapeFactory {
  // Allowed name dispatch #1. Replace with providers in the plugin phase.
  private readonly constructors: Readonly<Record<string, (id: string) => Shape>> = {
    rect: id => new Rect(id), circle: id => new Circle(id),
    ellipse: id => new Ellipse(id), line: id => new Line(id),
    text: id => new Text(id), g: id => new Group(id),
  };

  empty(type: string, id: string): Shape {
    if (!Object.hasOwn(this.constructors, type)) {
      throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
    }
    return this.constructors[type]!(id);
  }

  create(type: string, id: string, parameters: readonly string[]): Shape {
    const shape = this.empty(type, id);
    const keys = shape.geometryNames;
    const required = keys.length + (shape instanceof Text ? 1 : 0);
    const optional = shape instanceof Group || shape instanceof Text ? 0 : 1;
    if (parameters.length < required || parameters.length > required + optional) {
      throw new Error(`invalid parameters for ${type}: expected ${required}${optional ? ` or ${required + optional}` : ''}`);
    }
    keys.forEach((key, index) => shape.set(key, parameters[index]!));
    if (shape instanceof Text) shape.set('text', parameters[keys.length]!);
    else if (parameters[keys.length] !== undefined) {
      shape.set(shape instanceof Line ? 'stroke' : 'fill', parameters[keys.length]!);
    }
    return shape;
  }
}
