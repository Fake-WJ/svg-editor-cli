import { SvgDocument } from '../model/SvgDocument.js';
import type { DocumentStore } from './DocumentStore.js';
import type { EditCommand } from './EditCommand.js';
import { History } from './History.js';

export class EditorSession {
  private current: SvgDocument | undefined;
  private currentPath: string | undefined;
  private readonly history = new History();
  constructor(private readonly store: DocumentStore) {}

  get document(): SvgDocument {
    if (!this.current) throw new Error("no document. use 'init' or 'read' first");
    return this.current;
  }

  init(width: number, height: number): string {
    const document = new SvgDocument(width, height);
    this.current = document;
    this.currentPath = undefined;
    this.history.reset();
    return `canvas ${width}x${height} created`;
  }

  async read(path: string): Promise<string> {
    const result = await this.store.read(path);
    this.current = result.document;
    this.currentPath = path;
    this.history.reset();
    return [...result.warnings, `read ${path} (${this.document.all().length} elements)`].join('\n');
  }

  async save(path?: string): Promise<string> {
    const document = this.document;
    const destination = path ?? this.currentPath;
    if (!destination) throw new Error('no file path. use save <file.svg>');
    await this.store.write(destination, document);
    this.currentPath = destination;
    this.history.reset();
    return `saved to ${destination} (${document.all().length} elements)`;
  }

  resize(width: number, height: number): string {
    const working = this.document.clone();
    working.resize(width, height);
    this.current = working;
    this.history.reset();
    return `canvas resized to ${width}x${height}`;
  }

  edit(command: EditCommand): string {
    const before = this.document;
    const working = before.clone();
    const summary = command.apply(working);
    this.history.record(before, working, summary);
    this.current = working;
    return summary;
  }

  undo(): string {
    void this.document;
    const result = this.history.undo();
    this.current = result.document;
    return result.summary;
  }

  redo(): string {
    void this.document;
    const result = this.history.redo();
    this.current = result.document;
    return result.summary;
  }
}
