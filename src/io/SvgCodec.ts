import { DOMImplementation, DOMParser, XMLSerializer } from '@xmldom/xmldom';
import type { Document, Element, Node } from '@xmldom/xmldom';
import { SvgDocument } from '../model/SvgDocument.js';
import { ShapeFactory } from '../model/ShapeFactory.js';
import { Group } from '../model/Group.js';
import { Numbers } from '../model/Numbers.js';
import type { Shape } from '../model/Shape.js';

export class SvgCodec {
  private readonly namespace = 'http://www.w3.org/2000/svg';
  private readonly factory = new ShapeFactory();

  decode(source: string): { document: SvgDocument; warnings: readonly string[] } {
    if (/<!DOCTYPE|<!ENTITY/i.test(source)) throw new Error('unsupported SVG: DTD and entities');
    let xml: Document;
    try {
      xml = new DOMParser({ onError: (_level, message) => { throw new Error(message); } })
        .parseFromString(source, 'image/svg+xml');
    } catch (error) {
      throw new Error(`invalid SVG: ${error instanceof Error ? error.message : String(error)}`);
    }
    const root = xml.documentElement;
    if (!root || root.localName !== 'svg' || (root.namespaceURI && root.namespaceURI !== this.namespace)) {
      throw new Error('invalid SVG: expected <svg> root');
    }
    for (let index = 0; index < root.attributes.length; index++) {
      const attr = root.attributes.item(index)!;
      if (!['xmlns', 'width', 'height', 'viewBox'].includes(attr.name)) {
        throw new Error(`unsupported SVG root attribute: ${attr.name}`);
      }
    }
    const viewBox = root.getAttribute('viewBox') || undefined;
    let viewport: number[] | undefined;
    if (viewBox !== undefined) {
      viewport = viewBox.trim().split(/[\s,]+/).map(value => Numbers.parse(value, 'viewBox'));
      if (viewport.length !== 4 || viewport[2]! <= 0 || viewport[3]! <= 0) {
        throw new Error('invalid SVG: viewBox requires x y positive-width positive-height');
      }
    }
    const width = this.dimension(root.getAttribute('width'), viewport?.[2] ?? 800, 'width');
    const height = this.dimension(root.getAttribute('height'), viewport?.[3] ?? 600, 'height');
    const document = new SvgDocument(width, height, viewBox);
    const reserved = new Set<string>();
    const elements = Array.from(root.getElementsByTagName('*'));
    for (const element of elements) {
      const id = element.getAttribute('id');
      if (id) {
        if (reserved.has(id)) throw new Error(`id already exists: ${id}`);
        reserved.add(id);
      }
    }
    const warnings: string[] = [];
    const counters = new Map<string, number>();
    const readElement = (element: Element): Shape => {
      if (element.namespaceURI && element.namespaceURI !== this.namespace) {
        throw new Error(`unsupported SVG namespace: ${element.namespaceURI}`);
      }
      const type = element.localName ?? element.tagName;
      let id = element.getAttribute('id');
      if (!id) {
        let count = counters.get(type) ?? 0;
        do { id = `${type}${++count}`; } while (reserved.has(id));
        counters.set(type, count);
        reserved.add(id);
        warnings.push(`warning: assigned id ${id} to unnamed <${type}>`);
      }
      const shape = this.factory.empty(type, id);
      for (let index = 0; index < element.attributes.length; index++) {
        const attr = element.attributes.item(index)!;
        if (attr.name !== 'id') shape.importAttribute(attr.name, attr.value);
      }
      const children = this.elements(element);
      if (shape instanceof Group) {
        this.rejectUnexpectedText(element);
        children.forEach(child => shape.insert(readElement(child)));
      } else {
        if (children.length) throw new Error(`unsupported SVG: child element in <${type}>`);
        if (shape.textContent !== undefined) shape.set('text', element.textContent ?? '');
        else this.rejectUnexpectedText(element);
      }
      return shape;
    };
    this.rejectUnexpectedText(root);
    this.elements(root).forEach(element => document.add(readElement(element)));
    return { document, warnings };
  }

  encode(document: SvgDocument): string {
    const xml = new DOMImplementation().createDocument(this.namespace, 'svg', null);
    const root = xml.documentElement!;
    root.setAttribute('xmlns', this.namespace);
    root.setAttribute('width', String(document.width));
    root.setAttribute('height', String(document.height));
    root.setAttribute('viewBox', document.viewBox);
    const append = (shape: Shape, parent: Element, depth: number): void => {
      parent.appendChild(xml.createTextNode(`\n${'  '.repeat(depth)}`));
      const element = xml.createElementNS(this.namespace, shape.tag);
      for (const [key, value] of Object.entries(shape.attributes())) element.setAttribute(key, value);
      if (shape.textContent !== undefined) element.appendChild(xml.createTextNode(shape.textContent));
      shape.children.forEach(child => append(child, element, depth + 1));
      if (shape.children.length) element.appendChild(xml.createTextNode(`\n${'  '.repeat(depth)}`));
      parent.appendChild(element);
    };
    document.root.children.forEach(shape => append(shape, root, 1));
    root.appendChild(xml.createTextNode('\n'));
    return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(xml)}\n`;
  }

  private elements(parent: Node): Element[] {
    return Array.from(parent.childNodes).filter(node => node.nodeType === 1) as Element[];
  }

  private rejectUnexpectedText(parent: Element): void {
    for (const child of Array.from(parent.childNodes)) {
      if ((child.nodeType === 3 || child.nodeType === 4) && child.nodeValue?.trim()) {
        throw new Error(`unsupported SVG: text content in <${parent.localName}>`);
      }
    }
  }

  private dimension(value: string | null, fallback: number, name: string): number {
    return value === null ? fallback : Numbers.positive(value.replace(/px$/, ''), name);
  }
}
