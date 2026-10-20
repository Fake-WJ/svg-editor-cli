import type { Command } from '../Command.js';
import type { EditorSession } from '../EditorSession.js';
import { Arguments } from '../Arguments.js';

export class SaveCommand implements Command {
  constructor(private readonly values: readonly string[]) {}
  async execute(session: EditorSession): Promise<string> {
    void session.document;
    new Arguments(this.values, 'save [file.svg]').count(0, 1);
    return session.save(this.values[0]);
  }
}
