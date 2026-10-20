import type { Command } from '../Command.js';
import type { EditorSession } from '../EditorSession.js';
import { Arguments } from '../Arguments.js';
import { ShapeFormatter } from '../ShapeFormatter.js';

export class TreeCommand implements Command {
  constructor(private readonly values: readonly string[]) {}
  async execute(session: EditorSession): Promise<string> {
    const document = session.document;
    new Arguments(this.values, 'tree [id]').count(0, 1);
    return new ShapeFormatter().tree(document, this.values[0]);
  }
}
