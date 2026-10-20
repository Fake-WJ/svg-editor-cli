import type { SvgDocument } from '../model/SvgDocument.js';

interface Entry {
  readonly before: SvgDocument;
  readonly after: SvgDocument;
  readonly summary: string;
}

export class History {
  private undoEntries: Entry[] = [];
  private redoEntries: Entry[] = [];
  private locked = true;

  reset(): void {
    this.undoEntries = [];
    this.redoEntries = [];
    this.locked = true;
  }

  record(before: SvgDocument, after: SvgDocument, summary: string): void {
    this.undoEntries.push({ before: before.clone(), after: after.clone(), summary });
    this.redoEntries = [];
    this.locked = false;
  }

  undo(): { document: SvgDocument; summary: string } {
    this.checkUnlocked();
    const entry = this.undoEntries.pop();
    if (!entry) throw new Error('nothing to undo');
    this.redoEntries.push(entry);
    return { document: entry.before.clone(), summary: `undone: ${entry.summary}` };
  }

  redo(): { document: SvgDocument; summary: string } {
    this.checkUnlocked();
    const entry = this.redoEntries.pop();
    if (!entry) throw new Error('nothing to redo');
    this.undoEntries.push(entry);
    return { document: entry.after.clone(), summary: `redone: ${entry.summary}` };
  }

  private checkUnlocked(): void {
    if (this.locked) throw new Error('undo not allowed after io command');
  }
}
