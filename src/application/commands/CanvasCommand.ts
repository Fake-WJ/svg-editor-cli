import type { Command } from '../Command.js';
import type { EditorSession } from '../EditorSession.js';
import { Arguments } from '../Arguments.js';

export class CanvasCommand implements Command {
  constructor(private readonly values: readonly string[]) {}
  async execute(session: EditorSession): Promise<string> {
    const document = session.document;
    if (this.values.length === 0) return `canvas ${document.width}x${document.height}`;
    const args = new Arguments(this.values, 'canvas [w h]').count(2);
    return session.resize(args.number(0), args.number(1));
  }
}
