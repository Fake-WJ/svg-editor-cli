import type { DocumentStore } from '../src/application/DocumentStore.js';
import type { SvgDocument } from '../src/model/SvgDocument.js';

export class MemoryStore implements DocumentStore {
  private readonly documents = new Map<string, SvgDocument>();
  async read(path: string): Promise<{ document: SvgDocument; warnings: readonly string[] }> {
    const document = this.documents.get(path);
    if (!document) throw new Error(`cannot read file: ${path}`);
    return { document: document.clone(), warnings: [] };
  }
  async write(path: string, document: SvgDocument): Promise<void> {
    if (path === 'readonly.svg') throw new Error(`cannot write file: ${path}`);
    this.documents.set(path, document.clone());
  }
}
