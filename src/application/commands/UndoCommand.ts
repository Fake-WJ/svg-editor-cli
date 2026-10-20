import type { Command } from '../Command.js';
import type { EditorSession } from '../EditorSession.js';
import { Arguments } from '../Arguments.js';

export class UndoCommand implements Command {
  constructor(private readonly values: readonly string[]) {}
  async execute(session: EditorSession): Promise<string> {
    void session.document;
    new Arguments(this.values, 'undo').count(0);
    return session.undo();
  }
}
