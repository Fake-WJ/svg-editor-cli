import type { Command } from '../Command.js';
import type { EditorSession } from '../EditorSession.js';
import { Arguments } from '../Arguments.js';

export class ReadCommand implements Command {
  constructor(private readonly values: readonly string[]) {}
  async execute(session: EditorSession): Promise<string> {
    return session.read(new Arguments(this.values, 'read <file.svg>').count(1).at(0));
  }
}
