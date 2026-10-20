import type { Command } from '../Command.js';
import type { EditorSession } from '../EditorSession.js';
import { Arguments } from '../Arguments.js';
import { ShapeFormatter } from '../ShapeFormatter.js';

export class ShowCommand implements Command {
  constructor(private readonly values: readonly string[]) {}
  async execute(session: EditorSession): Promise<string> {
    const document = session.document;
    const args = new Arguments(this.values, 'show <id>').count(1);
    return new ShapeFormatter().show(document, args.at(0));
  }
}
