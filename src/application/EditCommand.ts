import type { SvgDocument } from '../model/SvgDocument.js';
import type { Command } from './Command.js';
import type { EditorSession } from './EditorSession.js';

export abstract class EditCommand implements Command {
  async execute(session: EditorSession): Promise<string> { return session.edit(this); }
  abstract apply(document: SvgDocument): string;
}
