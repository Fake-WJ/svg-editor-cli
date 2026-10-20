import type { Shape } from '../model/Shape.js';
import type { SvgDocument } from '../model/SvgDocument.js';

export class ShapeFormatter {
  label(shape: Shape): string { return `${shape.tag}#${shape.id}`; }

  summary(shape: Shape): string {
    const { id: _id, ...attributes } = shape.attributes();
    const details = Object.entries(attributes).map(([key, value]) => `${key}=${value}`).join(' ');
    const content = shape.textContent === undefined ? '' : ` ${JSON.stringify(shape.textContent)}`;
    return `${this.label(shape)}${details ? `  ${details}` : ''}${content}`;
  }

  tree(document: SvgDocument, id?: string): string {
    const root = id === undefined ? document.root : document.find(id);
    const lines = [id === undefined ? `svg (${document.width}x${document.height})` : this.summary(root)];
    const visit = (shape: Shape, prefix: string): void => {
      shape.children.forEach((child, index) => {
        const last = index === shape.children.length - 1;
        lines.push(`${prefix}${last ? '└── ' : '├── '}${this.summary(child)}`);
        visit(child, `${prefix}${last ? '    ' : '│   '}`);
      });
    };
    visit(root, '');
    return lines.join('\n');
  }

  show(document: SvgDocument, id: string): string {
    const shape = document.find(id);
    const parent = shape.parent === document.root ? 'svg' : this.label(shape.parent!);
    const { id: _id, ...attributes } = shape.attributes();
    const lines = [`${this.label(shape)}  parent=${parent}`];
    for (const [key, value] of Object.entries(attributes)) lines.push(`  ${key}=${value}`);
    if (shape.textContent !== undefined) lines.push(`  text=${JSON.stringify(shape.textContent)}`);
    return lines.join('\n');
  }
}
