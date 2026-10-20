import type { Group } from './Group.js';
import { Numbers } from './Numbers.js';

export abstract class Shape {
  private owner: Group | null = null;
  private readonly geometry: Record<string, number>;
  private readonly presentation: Record<string, string> = {};
  private readonly preserved: Record<string, string> = {};
  static readonly styleAttributes = ['fill', 'stroke', 'stroke-width'] as const;
  static readonly preservedAttributes = [
    'transform', 'opacity', 'fill-opacity', 'stroke-opacity', 'stroke-linecap',
    'stroke-linejoin', 'stroke-dasharray', 'font-family', 'font-size', 'font-weight',
    'text-anchor', 'dominant-baseline', 'data-kind',
  ] as const;

  protected constructor(
    readonly id: string,
    readonly tag: string,
    geometry: Record<string, number>,
    private readonly horizontal: readonly string[],
    private readonly vertical: readonly string[],
    private readonly nonnegative: readonly string[],
  ) {
    if (!id || /\s/.test(id)) throw new Error(`invalid id: ${id}`);
    this.geometry = { ...geometry };
  }

  get parent(): Group | null { return this.owner; }
  get children(): readonly Shape[] { return []; }
  get textContent(): string | undefined { return undefined; }
  get geometryNames(): readonly string[] { return Object.keys(this.geometry); }

  /** Only Group calls this when updating the tree; parent is never directly writable. */
  assignParent(parent: Group | null): void { this.owner = parent; }

  attributes(): Readonly<Record<string, string>> {
    return {
      id: this.id,
      ...Object.fromEntries(Object.entries(this.geometry).map(([key, value]) => [key, String(value)])),
      ...this.presentation,
      ...this.preserved,
    };
  }

  set(attribute: string, value: string): void {
    if (Object.hasOwn(this.geometry, attribute)) {
      const number = Numbers.parse(value, attribute);
      if (this.nonnegative.includes(attribute) && number < 0) {
        throw new Error(`${attribute} must be non-negative`);
      }
      this.geometry[attribute] = number;
      return;
    }
    if (Shape.styleAttributes.some(name => name === attribute)) {
      if (attribute === 'stroke-width' && Numbers.parse(value, attribute) < 0) {
        throw new Error('stroke-width must be non-negative');
      }
      if (!value.trim()) throw new Error(`empty value for ${attribute}`);
      this.presentation[attribute] = value;
      return;
    }
    throw new Error(`unknown attribute: ${attribute}`);
  }

  importAttribute(attribute: string, value: string): void {
    if (Shape.preservedAttributes.some(name => name === attribute)) {
      this.preserved[attribute] = value;
      return;
    }
    this.set(attribute, value);
  }

  move(dx: number, dy: number): void {
    const next = { ...this.geometry };
    for (const key of this.horizontal) next[key] = Numbers.parse(next[key]! + dx, key);
    for (const key of this.vertical) next[key] = Numbers.parse(next[key]! + dy, key);
    Object.assign(this.geometry, next);
  }

  scale(factor: number): void {
    Numbers.positive(factor, 'scale factor');
    const next = Object.fromEntries(Object.entries(this.geometry)
      .map(([key, value]) => [key, Numbers.parse(value * factor, key)]));
    Object.assign(this.geometry, next);
  }

  clone(): Shape {
    const copy = this.newCopy();
    Object.assign(copy.geometry, this.geometry);
    Object.assign(copy.presentation, this.presentation);
    Object.assign(copy.preserved, this.preserved);
    return copy;
  }

  protected abstract newCopy(): Shape;
}
