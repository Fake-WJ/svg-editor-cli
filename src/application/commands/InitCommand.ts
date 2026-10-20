import type { Command } from '../Command.js';
import type { EditorSession } from '../EditorSession.js';
import { Arguments } from '../Arguments.js';

export class InitCommand implements Command {
  constructor(private readonly values: readonly string[]) {}
  async execute(session: EditorSession): Promise<string> {
    const args = new Arguments(this.values, 'init [w] [h]').count(0, 2);
    return session.init(this.values.length > 0 ? args.number(0) : 800, this.values.length > 1 ? args.number(1) : 600);
  }
}
