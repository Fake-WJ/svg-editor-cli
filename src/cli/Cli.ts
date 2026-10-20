import type { EditorSession } from '../application/EditorSession.js';
import { CommandDispatcher } from './CommandDispatcher.js';
import { Tokenizer } from './Tokenizer.js';

export class Cli {
  private readonly tokenizer = new Tokenizer();
  private readonly dispatcher = new CommandDispatcher();
  constructor(private readonly session: EditorSession) {}

  async execute(line: string): Promise<string> {
    try {
      const tokens = this.tokenizer.tokenize(line);
      if (tokens.length === 0) return '';
      return await this.dispatcher.dispatch(tokens).execute(this.session);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return `error: ${message.replace(/[\r\n]+/g, ' ')}`;
    }
  }
}
